/**
 * One-time migration script: Remove Freemium
 *
 * For every user with subscriptionPlan = 'free' and no active Creem subscription:
 *   SET trialStartedAt = createdAt, subscriptionPlan = 'expired',
 *       subscriptionStatus = 'cancelled', hadTrial = true
 *
 * For users with subscriptionPlan = 'free' who DO have an active Creem subscription:
 *   SET subscriptionPlan = 'pro', subscriptionStatus = 'active',
 *       trialStartedAt = createdAt, hadTrial = true
 *
 * Idempotent: users who already have trialStartedAt set are skipped.
 *
 * Run AFTER the schema migration:
 *   pnpm tsx scripts/migrate-free-users.ts
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface UserRow {
  id: string;
  email: string;
  creem_customer_id: string | null;
}

async function main() {
  const client = await pool.connect();

  try {
    console.log("Starting free-user migration...\n");

    // Find free users who haven't been migrated yet (trialStartedAt IS NULL)
    const { rows: freeUsers } = await client.query<UserRow>(
      `SELECT id, email, "creemCustomerId" AS creem_customer_id
       FROM "user"
       WHERE "subscriptionPlan" = 'free'
         AND "trialStartedAt" IS NULL`,
    );

    console.log(`Found ${freeUsers.length} free user(s) to evaluate.\n`);

    let migratedExpired = 0;
    let migratedPro = 0;

    for (const user of freeUsers) {
      // Check for an active Creem subscription
      const subQuery = user.creem_customer_id
        ? `SELECT id FROM creem_subscription
           WHERE status = 'active'
             AND ("referenceId" = $1 OR "creemCustomerId" = $2)
           LIMIT 1`
        : `SELECT id FROM creem_subscription
           WHERE status = 'active'
             AND "referenceId" = $1
           LIMIT 1`;

      const subParams = user.creem_customer_id
        ? [user.id, user.creem_customer_id]
        : [user.id];

      const { rows: activeSubs } = await client.query(subQuery, subParams);

      if (activeSubs.length > 0) {
        // Has active subscription — upgrade to pro
        await client.query(
          `UPDATE "user"
           SET "subscriptionPlan" = 'pro',
               "subscriptionStatus" = 'active',
               "trialStartedAt" = "createdAt",
               "hadTrial" = true
           WHERE id = $1`,
          [user.id],
        );
        console.log(`  UPGRADED to pro: ${user.email}`);
        migratedPro++;
      } else {
        // No active subscription — mark as expired trial
        await client.query(
          `UPDATE "user"
           SET "subscriptionPlan" = 'expired',
               "subscriptionStatus" = 'cancelled',
               "trialStartedAt" = "createdAt",
               "hadTrial" = true
           WHERE id = $1`,
          [user.id],
        );
        console.log(`  MIGRATED to expired: ${user.email}`);
        migratedExpired++;
      }
    }

    console.log("\n--- Migration Summary ---");
    console.log(`  Total free users found:  ${freeUsers.length}`);
    console.log(`  Migrated to expired:     ${migratedExpired}`);
    console.log(`  Upgraded to pro:         ${migratedPro}`);
    console.log("\nDone.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
