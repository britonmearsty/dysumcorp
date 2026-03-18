import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Validate required env vars at module load so misconfiguration is caught early
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  // Only throw in non-build environments to avoid breaking `next build`
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

/**
 * Generate a presigned PUT URL for uploading directly to R2.
 * The URL is scoped to the exact key and content-type.
 *
 * @param key           R2 object key (e.g. "staging/{portalId}/{uuid}/{fileName}")
 * @param contentType   MIME type of the file
 * @param expiresInSeconds  URL validity window (default 900 = 15 min)
 */
export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 900,
): Promise<string> {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "[R2 Client] R2 environment variables are not configured. " +
        "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.",
    );
  }

  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );
}

/**
 * Delete an object from R2 (used by the cleanup cron).
 */
export async function deleteR2Object(key: string): Promise<void> {
  if (!bucketName) {
    throw new Error("[R2 Client] R2_BUCKET_NAME is not configured.");
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
}
