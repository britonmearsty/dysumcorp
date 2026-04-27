import * as cron from "node-cron";

import { prisma } from "@/lib/prisma";
import { sendStorageWarning, sendWeeklyReport } from "@/lib/email-service";
import { PRICING_PLANS, PlanType } from "@/config/pricing";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getPlanLimits(plan: PlanType) {
  return PRICING_PLANS[plan as "pro"]?.limits || PRICING_PLANS.pro.limits;
}

export async function updateUsageTracking() {
  try {
    console.log("Starting usage tracking update...");

    const currentMonth = new Date().toISOString().slice(0, 7);

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
        const storageUsed = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).reduce(
                (portalTotal: number, file: Record<string, unknown>) => {
                  return portalTotal + Number(file.size);
                },
                0,
              )
            );
          },
          0,
        );

        const monthlyPortalsCreated = user.portals.filter(
          (portal: Record<string, unknown>) =>
            (portal.createdAt as Date).toISOString().slice(0, 7) ===
            currentMonth,
        ).length;

        const monthlyFilesUploaded = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).filter(
                (file: Record<string, unknown>) =>
                  (file.uploadedAt as Date).toISOString().slice(0, 7) ===
                  currentMonth,
              ).length
            );
          },
          0,
        );

        const monthlyBandwidth = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).reduce(
                (portalTotal: number, file: Record<string, unknown>) => {
                  return (
                    portalTotal +
                    Number(file.size) * Number(file.downloads || 0)
                  );
                },
                0,
              )
            );
          },
          0,
        );

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

        if (user.subscriptionPlan) {
          const planLimits = getPlanLimits(user.subscriptionPlan as PlanType);

          if (planLimits.storage !== undefined) {
            const storageLimitBytes = planLimits.storage * 1024 * 1024 * 1024;
            const storagePercentage = (storageUsed / storageLimitBytes) * 100;

          if (storagePercentage >= 90 && user.notifyOnStorageWarning) {
            await sendStorageWarning({
              userEmail: user.email,
              userName: user.name || undefined,
              usedStorage: formatBytes(storageUsed),
              totalStorage: formatBytes(storageLimitBytes),
              percentage: Math.round(storagePercentage),
            });
          }
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

export async function sendWeeklyReports() {
  try {
    console.log("Starting weekly reports...");

    const users = await prisma.user.findMany({
      where: {
        weeklyReports: true,
      },
      include: {
        portals: {
          include: {
            files: true,
          },
        },
      },
    });

    const now = new Date();
    const weekEnd = now.toISOString().slice(0, 10);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    for (const user of users) {
      try {
        const planLimits = getPlanLimits(
          (user.subscriptionPlan as PlanType) || "pro",
        );

        const storageUsed = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).reduce(
                (portalTotal: number, file: Record<string, unknown>) => {
                  return portalTotal + Number(file.size);
                },
                0,
              )
            );
          },
          0,
        );

        const totalFiles = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return total + (portal.files as Array<unknown>).length;
          },
          0,
        );

        const newFiles = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).filter(
                (file: Record<string, unknown>) => {
                  const uploadedAt = file.uploadedAt as Date;

                  return (
                    uploadedAt >= new Date(weekStart) &&
                    uploadedAt <= new Date(weekEnd)
                  );
                },
              ).length
            );
          },
          0,
        );

        const newPortals = user.portals.filter(
          (portal: Record<string, unknown>) => {
            const createdAt = portal.createdAt as Date;

            return (
              createdAt >= new Date(weekStart) && createdAt <= new Date(weekEnd)
            );
          },
        ).length;

        const totalDownloads = user.portals.reduce(
          (total: number, portal: Record<string, unknown>) => {
            return (
              total +
              (portal.files as Array<Record<string, unknown>>).reduce(
                (portalTotal: number, file: Record<string, unknown>) => {
                  return portalTotal + Number(file.downloads || 0);
                },
                0,
              )
            );
          },
          0,
        );

        const portalStats = user.portals.map(
          (portal: Record<string, unknown>) => ({
            name: portal.name as string,
            files: (portal.files as Array<unknown>).length,
            downloads: (portal.files as Array<Record<string, unknown>>).reduce(
              (total: number, file: Record<string, unknown>) =>
                total + Number(file.downloads || 0),
              0,
            ),
          }),
        );

        const topPortals = portalStats
          .sort((a, b) => b.downloads - a.downloads)
          .slice(0, 5);

        // Storage is optional - if not set, files go to user's cloud
        const storageLimitBytes = planLimits.storage !== undefined
          ? planLimits.storage * 1024 * 1024 * 1024
          : Number.MAX_SAFE_INTEGER;

        await sendWeeklyReport({
          to: user.email,
          userName: user.name || user.email.split("@")[0],
          weekStart,
          weekEnd,
          totalFiles,
          totalSize: formatBytes(storageUsed),
          newFiles,
          newPortals,
          totalDownloads,
          storageUsed: formatBytes(storageUsed),
          storageLimit: formatBytes(storageLimitBytes),
          storagePercentage: planLimits.storage !== undefined
            ? Math.round((storageUsed / storageLimitBytes) * 100)
            : 0,
          topPortals,
        });
      } catch (userError) {
        console.error(
          `Failed to send weekly report to user ${user.id}:`,
          userError,
        );
      }
    }

    console.log("Weekly reports completed successfully");
  } catch (error) {
    console.error("Weekly reports failed:", error);
  }
}

export async function cleanupExpiredFiles() {
  try {
    console.log("Starting expired files cleanup...");

    const now = new Date();

    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
      include: {
        portal: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`Found ${expiredFiles.length} expired files`);

    for (const file of expiredFiles) {
      try {
        // Delete from database first
        await prisma.file.delete({
          where: { id: file.id },
        });

        console.log(`Deleted expired file: ${file.name} (${file.id})`);

        // Note: Actual deletion from cloud storage would require the storage provider tokens
        // and should be implemented based on the storage provider
      } catch (fileError) {
        console.error(`Failed to delete expired file ${file.id}:`, fileError);
      }
    }

    console.log("Expired files cleanup completed");
  } catch (error) {
    console.error("Expired files cleanup failed:", error);
  }
}

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

  const planLimits = getPlanLimits(
    (user.subscriptionPlan as PlanType) || "pro",
  );

  const currentStorageUsed = user.portals.reduce(
    (total: number, portal: Record<string, unknown>) => {
      return (
        total +
        (portal.files as Array<Record<string, unknown>>).reduce(
          (portalTotal: number, file: Record<string, unknown>) => {
            return portalTotal + Number(file.size);
          },
          0,
        )
      );
    },
    0,
  );

  return {
    currentMonth: usage,
    planLimits: {
      storage: planLimits.storage,
      portals: planLimits.portals,
    },
    currentStorageUsed,
    storagePercentage: planLimits.storage !== undefined
      ? (currentStorageUsed / (planLimits.storage * 1024 * 1024 * 1024)) * 100
      : 0,
    portalsUsed: user.portals.length,
    portalsPercentage: (user.portals.length / planLimits.portals) * 100,
  };
}

export function initializeUsageTrackingCron() {
  // Daily usage tracking at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Running scheduled usage tracking update...");
    await updateUsageTracking();
  });

  // Weekly reports on Monday at 9 AM
  cron.schedule("0 9 * * 1", async () => {
    console.log("Running scheduled weekly reports...");
    await sendWeeklyReports();
  });

  // Expired files cleanup daily at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("Running scheduled expired files cleanup...");
    await cleanupExpiredFiles();
  });

  if (process.env.NODE_ENV === "development") {
    console.log(
      "Cron jobs initialized (development mode - skipping immediate run)",
    );
  }

  console.log(
    "Usage tracking cron jobs initialized (daily at 2 AM, weekly on Monday at 9 AM, cleanup at 3 AM)",
  );
}

export async function triggerUsageTracking() {
  return await updateUsageTracking();
}

export async function triggerWeeklyReports() {
  return await sendWeeklyReports();
}

export async function triggerExpiredFilesCleanup() {
  return await cleanupExpiredFiles();
}
