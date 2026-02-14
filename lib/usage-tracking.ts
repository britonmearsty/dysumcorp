import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as cron from "node-cron";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { sendStorageWarning } from "@/lib/email-service";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Update usage tracking for all users
 * This function calculates and stores monthly usage statistics
 */
export async function updateUsageTracking() {
  try {
    console.log("Starting usage tracking update...");

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        portals: {
          include: {
            files: true,
          },
        },
      },
    });

    for (const user of users) {
      try {
        // Calculate usage for this user
        const storageUsed = user.portals.reduce(
          (total: number, portal: any) => {
            return (
              total +
              portal.files.reduce((portalTotal: number, file: any) => {
                return portalTotal + Number(file.size);
              }, 0)
            );
          },
          0,
        );

        const monthlyPortalsCreated = user.portals.filter(
          (portal: any) =>
            portal.createdAt.toISOString().slice(0, 7) === currentMonth,
        ).length;

        const monthlyFilesUploaded = user.portals.reduce(
          (total: number, portal: any) => {
            return (
              total +
              portal.files.filter(
                (file: any) =>
                  file.uploadedAt.toISOString().slice(0, 7) === currentMonth,
              ).length
            );
          },
          0,
        );

        // Calculate bandwidth (simplified - just file sizes for downloads)
        const monthlyBandwidth = user.portals.reduce(
          (total: number, portal: any) => {
            return (
              total +
              portal.files.reduce((portalTotal: number, file: any) => {
                return portalTotal + Number(file.size) * file.downloads;
              }, 0)
            );
          },
          0,
        );

        // Update or create usage tracking record
        await prisma.usageTracking.upsert({
          where: {
            userId_month: {
              userId: user.id,
              month: currentMonth,
            },
          },
          update: {
            storageUsed: BigInt(storageUsed),
            portalsCreated: monthlyPortalsCreated,
            filesUploaded: monthlyFilesUploaded,
            bandwidth: BigInt(monthlyBandwidth),
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            month: currentMonth,
            storageUsed: BigInt(storageUsed),
            portalsCreated: monthlyPortalsCreated,
            filesUploaded: monthlyFilesUploaded,
            bandwidth: BigInt(monthlyBandwidth),
          },
        });

        // Check if user is approaching storage limits and send warning
        if (user.subscriptionPlan) {
          const planLimits = getPlanLimits(user.subscriptionPlan);
          const storagePercentage = (storageUsed / planLimits.storage) * 100;

          if (storagePercentage >= 90) {
            await sendStorageWarning({
              userEmail: user.email,
              usedStorage: formatBytes(storageUsed),
              totalStorage: formatBytes(planLimits.storage),
              percentage: Math.round(storagePercentage),
            });
          }
        }
      } catch (userError) {
        console.error(`Failed to update usage for user ${user.id}:`, userError);
      }
    }

    console.log("Usage tracking update completed successfully");
  } catch (error) {
    console.error("Usage tracking update failed:", error);
  }
}

/**
 * Get plan limits based on subscription plan
 */
function getPlanLimits(plan: string) {
  const limits = {
    free: { storage: 5 * 1024 * 1024 * 1024, portals: 3 }, // 5GB
    pro: { storage: 50 * 1024 * 1024 * 1024, portals: 10 }, // 50GB
    business: {
      storage: 500 * 1024 * 1024 * 1024,
      portals: 50,
    }, // 500GB
    enterprise: {
      storage: 5 * 1024 * 1024 * 1024 * 1024,
      portals: 999,
    }, // 5TB
  };

  return limits[plan as keyof typeof limits] || limits.free;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get usage statistics for a specific user
 */
export async function getUserUsageStats(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const usage = await prisma.usageTracking.findUnique({
    where: {
      userId_month: {
        userId,
        month: currentMonth,
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      portals: {
        include: {
          files: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const planLimits = getPlanLimits(user.subscriptionPlan || "free");

  // Calculate current storage usage
  const currentStorageUsed = user.portals.reduce(
    (total: number, portal: any) => {
      return (
        total +
        portal.files.reduce((portalTotal: number, file: any) => {
          return portalTotal + Number(file.size);
        }, 0)
      );
    },
    0,
  );

  return {
    currentMonth: usage,
    planLimits,
    currentStorageUsed,
    storagePercentage: (currentStorageUsed / planLimits.storage) * 100,
    portalsUsed: user.portals.length,
    portalsPercentage: (user.portals.length / planLimits.portals) * 100,
  };
}

/**
 * Initialize cron job for usage tracking
 * Runs every day at 2 AM
 */
export function initializeUsageTrackingCron() {
  // Schedule the usage tracking update to run daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled usage tracking update...");
    await updateUsageTracking();
  });

  // Also run it immediately on startup for testing
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Running usage tracking update on startup (development mode)...",
    );
    setTimeout(() => {
      updateUsageTracking();
    }, 5000); // Wait 5 seconds for app to start
  }

  console.log("Usage tracking cron job initialized");
}

/**
 * Manual trigger for usage tracking (for testing/admin)
 */
export async function triggerUsageTracking() {
  return await updateUsageTracking();
}
