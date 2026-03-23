#!/usr/bin/env node
/**
 * r2-nuke.mjs — Manual R2 bucket reset
 *
 * Aborts all in-progress multipart uploads, deletes every object in the bucket,
 * and marks all non-completed staging DB records as "failed".
 *
 * Usage:
 *   node scripts/r2-nuke.mjs             (live — actually deletes)
 *   node scripts/r2-nuke.mjs --dry-run   (preview only, no changes)
 */

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import pg from "pg";
import { config } from "dotenv";

config(); // load .env

const DRY_RUN = process.argv.includes("--dry-run");

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, DATABASE_URL } =
  process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("Missing R2 env vars. Check your .env file.");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Missing DATABASE_URL. Check your .env file.");
  process.exit(1);
}

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const db = new pg.Client({ connectionString: DATABASE_URL });

// ── 1. Abort in-progress multipart uploads ────────────────────────────────────
async function abortMultiparts() {
  let aborted = 0;
  let keyMarker, uploadIdMarker;

  do {
    const res = await r2.send(
      new ListMultipartUploadsCommand({
        Bucket: R2_BUCKET_NAME,
        KeyMarker: keyMarker,
        UploadIdMarker: uploadIdMarker,
      })
    );

    for (const u of res.Uploads ?? []) {
      console.log(`  [multipart] ${DRY_RUN ? "(dry-run) would abort" : "Aborting"} key=${u.Key} uploadId=${u.UploadId}`);
      if (!DRY_RUN) {
        await r2.send(
          new AbortMultipartUploadCommand({ Bucket: R2_BUCKET_NAME, Key: u.Key, UploadId: u.UploadId })
        );
      }
      aborted++;
    }

    keyMarker = res.IsTruncated ? res.NextKeyMarker : undefined;
    uploadIdMarker = res.IsTruncated ? res.NextUploadIdMarker : undefined;
  } while (keyMarker);

  return aborted;
}

// ── 2. Delete all objects ─────────────────────────────────────────────────────
async function deleteAllObjects() {
  let deleted = 0;
  let continuationToken;

  do {
    const list = await r2.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET_NAME, ContinuationToken: continuationToken })
    );

    const objects = list.Contents ?? [];
    if (objects.length === 0) break;

    if (DRY_RUN) {
      objects.forEach((o) => console.log(`  [objects] (dry-run) would delete: ${o.Key}`));
    } else {
      console.log(`  [objects] Deleting ${objects.length} object(s)...`);
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET_NAME,
          Delete: { Objects: objects.map((o) => ({ Key: o.Key })), Quiet: true },
        })
      );
    }

    deleted += objects.length;
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);

  return deleted;
}

// ── 3. Mark staging DB records as failed ─────────────────────────────────────
async function failStagingRecords() {
  const countRes = await db.query(
    `SELECT COUNT(*) FROM r2_staging_upload WHERE status NOT IN ('completed', 'failed')`
  );
  const count = parseInt(countRes.rows[0].count, 10);

  if (DRY_RUN) {
    console.log(`  [db] (dry-run) would mark ${count} staging record(s) as failed`);
    return count;
  }

  await db.query(
    `UPDATE r2_staging_upload SET status = 'failed' WHERE status NOT IN ('completed', 'failed')`
  );
  return count;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🪣  R2 Nuke — bucket: ${R2_BUCKET_NAME}${DRY_RUN ? " [DRY RUN]" : ""}\n`);

  await db.connect();

  console.log("Step 1: Aborting in-progress multipart uploads...");
  const aborted = await abortMultiparts();
  console.log(`  → ${aborted} multipart upload(s) ${DRY_RUN ? "found" : "aborted"}\n`);

  console.log("Step 2: Deleting all objects...");
  const deleted = await deleteAllObjects();
  console.log(`  → ${deleted} object(s) ${DRY_RUN ? "found" : "deleted"}\n`);

  console.log("Step 3: Marking staging DB records as failed...");
  const failed = await failStagingRecords();
  console.log(`  → ${failed} record(s) ${DRY_RUN ? "would be" : ""} updated\n`);

  console.log("Done.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => db.end());
