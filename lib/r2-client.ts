import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "production") {
    console.warn(
      "[R2 Client] Missing one or more R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME",
    );
  }
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId ?? "",
    secretAccessKey: secretAccessKey ?? "",
  },
});

function requireEnv() {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "[R2 Client] R2 environment variables are not configured. " +
        "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
    );
  }
}

/** Presigned PUT URL for single-shot uploads (files < MULTIPART_THRESHOLD).
 *  contentLength is embedded in the signature so R2 rejects any PUT that
 *  doesn't match exactly — prevents a client lying about fileSize at presign time.
 */
export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 900,
  contentLength?: number,
): Promise<string> {
  requireEnv();
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: bucketName!,
      Key: key,
      ContentType: contentType,
      ...(contentLength != null ? { ContentLength: contentLength } : {}),
    }),
    { expiresIn: expiresInSeconds },
  );
}

/** Start a multipart upload and return the uploadId. */
export async function createMultipartUpload(key: string, contentType: string): Promise<string> {
  requireEnv();
  const res = await r2Client.send(
    new CreateMultipartUploadCommand({ Bucket: bucketName!, Key: key, ContentType: contentType }),
  );
  if (!res.UploadId) throw new Error("[R2 Client] CreateMultipartUpload returned no UploadId");
  return res.UploadId;
}

/**
 * Generate a presigned URL for a single part upload.
 * partNumber is 1-indexed (1..10000).
 */
export async function getPresignedPartUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresInSeconds: number = 900,
): Promise<string> {
  requireEnv();
  return getSignedUrl(
    r2Client,
    new UploadPartCommand({
      Bucket: bucketName!,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    }),
    { expiresIn: expiresInSeconds },
  );
}

export interface CompletedPart {
  PartNumber: number;
  ETag: string;
}

/** Finalize a multipart upload. Parts must be sorted by PartNumber. */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[],
): Promise<void> {
  requireEnv();
  await r2Client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucketName!,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }),
  );
}

/** Abort an in-progress multipart upload (cleanup on failure). */
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  requireEnv();
  await r2Client.send(
    new AbortMultipartUploadCommand({ Bucket: bucketName!, Key: key, UploadId: uploadId }),
  );
}

/** Delete an object from R2 (used by the cleanup cron and worker post-transfer). */
export async function deleteR2Object(key: string): Promise<void> {
  if (!bucketName) throw new Error("[R2 Client] R2_BUCKET_NAME is not configured.");
  await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}
