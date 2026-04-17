import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { creem } from "@creem_io/better-auth";

import { sendWelcomeEmail, sendSignInNotification } from "@/lib/email-service";
import { prisma } from "@/lib/prisma";

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set");
}
if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not set");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  user: {
    additionalFields: {
      subscriptionPlan: {
        type: "string",
        defaultValue: "trial",
        input: false,
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "trialing",
        input: false,
      },
      creemCustomerId: {
        type: "string",
        defaultValue: null,
        input: false,
      },
      portalLogo: {
        type: "string",
        defaultValue: null,
        input: true,
      },
      trialStartedAt: {
        type: "string",
        defaultValue: null,
        input: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        input: false,
      },
      deletedAt: {
        type: "string",
        defaultValue: null,
        input: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      accessType: "offline",
      prompt: "consent",
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.appdata",
      ],
      enabled: !!(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ),
    },
    dropbox: {
      clientId: process.env.DROPBOX_CLIENT_ID || "",
      clientSecret: process.env.DROPBOX_CLIENT_SECRET || "",
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/dropbox`,
      scope: [
        "account_info.read",
        "files.metadata.write",
        "files.metadata.read",
        "files.content.write",
        "files.content.read",
      ],
      enabled: !!(
        process.env.DROPBOX_CLIENT_ID && process.env.DROPBOX_CLIENT_SECRET
      ),
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  ].filter((origin): origin is string => !!origin),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "better-auth",
  },
  hooks: {
    after: async (ctx) => {
      const url = ctx.request?.url || "";
      const path = url.includes("?") ? url.split("?")[0] : url;
      const isCallback = path.includes("/callback/");
      const isSignup = path === "/sign-up" || path === "/signup" || isCallback;
      const isSignIn = path === "/sign-in" || path === "/signin";

      const body = ctx.body as
        | { user?: { id?: string; email: string; name?: string | null } }
        | undefined;
      const user = body?.user;

      if (!user) return ctx;

      const userName = user.name || user.email.split("@")[0];

      if (isSignup && user.id) {
        // Check for existing deleted user with same email and reactivate
        const deletedUser = await prisma.user.findFirst({
          where: {
            email: user.email,
            status: "deleted",
            id: { not: user.id },
          },
        });

        if (deletedUser) {
          // Reactivate the old deleted user instead
          await prisma.user.update({
            where: { id: deletedUser.id },
            data: {
              status: "active",
              deletedAt: null,
              trialStartedAt: new Date(),
              trialFileCount: 0,
              trialFileLimit: 15,
            },
          });

          // Migrate session from new user to reactivated user
          await prisma.session.updateMany({
            where: { userId: user.id },
            data: { userId: deletedUser.id },
          });

          // Delete the newly created duplicate user
          await prisma.user.delete({ where: { id: user.id } });

          // Update ctx to reference the reactivated user
          (user as any).id = deletedUser.id;
        } else {
          // Fresh signup - send welcome email
          try {
            await sendWelcomeEmail({ to: user.email, userName });
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }
      }

      if (isSignIn) {
        try {
          await sendSignInNotification({
            to: user.email,
            userName,
            time: new Date().toLocaleString(),
          });
        } catch (error) {
          console.error("Failed to send sign-in notification:", error);
        }
      }

      return ctx;
    },
  },
  plugins: [
    creem({
      apiKey: process.env.CREEM_API_KEY || "",
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
      testMode: process.env.NODE_ENV === "development",
      defaultSuccessUrl: "/dashboard/billing?success=true",
      persistSubscriptions: true,
      onGrantAccess: async ({ customer, metadata, reason }) => {
        try {
          const planId = metadata?.planId as string | undefined;
          const billingCycle = metadata?.billingCycle as string | undefined;
          const userId = metadata?.userId as string | undefined;
          const productId = metadata?.productId as string | undefined;

          if (!customer?.email) {
            return;
          }

          // trialing = card on file, within trial period
          // active / paid = fully charged subscriber
          const newStatus =
            reason === "subscription_trialing" ? "trialing" : "active";

          await prisma.user.updateMany({
            where: { email: customer.email },
            data: {
              subscriptionPlan: "pro",
              subscriptionStatus: newStatus,
              creemCustomerId: customer.id,
              // Record when trial started (first time only)
              ...(newStatus === "trialing"
                ? { trialStartedAt: new Date() }
                : {}),
            },
          });

          if (userId) {
            const periodEnd =
              billingCycle === "annual"
                ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await prisma.creem_subscription.upsert({
              where: { id: customer.id },
              create: {
                id: customer.id,
                productId: productId || "",
                referenceId: userId,
                creemCustomerId: customer.id,
                creemSubscriptionId: customer.id,
                status: newStatus,
                periodStart: new Date(),
                periodEnd: periodEnd,
                cancelAtPeriodEnd: false,
              },
              update: {
                status: newStatus,
                periodStart: new Date(),
                periodEnd: periodEnd,
                cancelAtPeriodEnd: false,
              },
            });
          }
        } catch (error) {
          console.error("Error in onGrantAccess:", error);
        }
      },
      onRevokeAccess: async ({ customer }) => {
        // Fired when access is fully revoked:
        //   - trial cancelled (immediate revoke)
        //   - subscription expired without renewal
        //   - payment failed after all retries
        try {
          if (customer?.email) {
            const user = await prisma.user.findFirst({
              where: { email: customer.email },
              select: { id: true },
            });

            if (user) {
              await prisma.portal.updateMany({
                where: { userId: user.id },
                data: { isActive: false },
              });
            }

            await prisma.user.updateMany({
              where: { email: customer.email },
              data: {
                subscriptionPlan: "expired",
                subscriptionStatus: "cancelled",
              },
            });
          }
        } catch (error) {
          console.error("Error in onRevokeAccess:", error);
        }
      },
      onSubscriptionCanceled: async (data: any) => {
        // Fired for two scenarios:
        //   1. subscription.scheduled_cancel — paid subscriber cancelled at period end,
        //      still has access until current_period_end_date. Do NOT deactivate portals.
        //   2. subscription.canceled — subscription fully ended (trial cancel or period ended).
        //      Revoke access immediately.
        console.log("[Creem] Subscription canceled event:", data?.webhookEventType, data);
        try {
          const customer = data.customer;
          const subscription = data.subscription;
          const eventType = data.webhookEventType as string | undefined;

          if (!customer?.email) return;

          // subscription.scheduled_cancel: cancel at period end — keep access
          if (eventType === "subscription.scheduled_cancel") {
            await prisma.user.updateMany({
              where: { email: customer.email },
              data: { subscriptionStatus: "scheduled_cancel" },
            });

            // Store the period end so checkAccess knows when access expires
            if (subscription?.id && subscription?.current_period_end_date) {
              await prisma.creem_subscription.updateMany({
                where: { creemSubscriptionId: subscription.id },
                data: {
                  cancelAtPeriodEnd: true,
                  periodEnd: new Date(subscription.current_period_end_date),
                },
              });
            }

            console.log("[Creem] Scheduled cancel — access retained until period end");
            return;
          }

          // subscription.canceled: fully cancelled — revoke access
          // Only act if onRevokeAccess hasn't already handled it
          const user = await prisma.user.findFirst({
            where: { email: customer.email },
            select: { id: true, subscriptionStatus: true },
          });

          if (user) {
            if (
              user.subscriptionStatus !== "cancelled" &&
              user.subscriptionStatus !== "expired"
            ) {
              await prisma.portal.updateMany({
                where: { userId: user.id },
                data: { isActive: false },
              });

              await prisma.user.updateMany({
                where: { email: customer.email },
                data: {
                  subscriptionPlan: "expired",
                  subscriptionStatus: "cancelled",
                },
              });
            }
          }
        } catch (error) {
          console.error("Error in onSubscriptionCanceled:", error);
        }
      },
      onSubscriptionExpired: async (data: any) => {
        // Fired when the subscription period ends without renewal.
        console.log("[Creem] Subscription expired:", data);
        try {
          const customer = data.customer;
          if (customer?.email) {
            const user = await prisma.user.findFirst({
              where: { email: customer.email },
              select: { id: true },
            });

            if (user) {
              await prisma.portal.updateMany({
                where: { userId: user.id },
                data: { isActive: false },
              });
            }

            await prisma.user.updateMany({
              where: { email: customer.email },
              data: {
                subscriptionPlan: "expired",
                subscriptionStatus: "expired",
              },
            });
          }
        } catch (error) {
          console.error("Error in onSubscriptionExpired:", error);
        }
      },
    }),
  ].filter(Boolean),
});

// Export prisma from the shared instance
export { prisma };
