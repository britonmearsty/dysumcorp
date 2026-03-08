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
        defaultValue: "free",
        input: false,
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "active",
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
      const isSignup =
        path === "/sign-up" ||
        path === "/signup" ||
        path.includes("/callback/");
      const isSignIn = path === "/sign-in" || path === "/signin";

      const body = ctx.body as
        | { user?: { email: string; name?: string | null } }
        | undefined;
      const user = body?.user;

      if (!user) return ctx;

      const userName = user.name || user.email.split("@")[0];

      if (isSignup) {
        try {
          await sendWelcomeEmail({ to: user.email, userName });
        } catch (error) {
          console.error("Failed to send welcome email:", error);
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
      onCheckoutCompleted: async ({ customer }) => {
        try {
          console.log("[Creem] ✅ onCheckoutCompleted called");
          console.log("[Creem] Customer data:", JSON.stringify(customer, null, 2));
          
          if (customer?.email) {
            console.log("[Creem] Updating user subscription status for:", customer.email);
            
            const updateResult = await prisma.user.updateMany({
              where: { email: customer.email },
              data: { subscriptionStatus: "active" },
            });
            
            console.log("[Creem] User update result:", updateResult);
          } else {
            console.error("[Creem] ❌ No customer email in onCheckoutCompleted");
          }
        } catch (error) {
          console.error("[Creem] ❌ Error in onCheckoutCompleted:", error);
          console.error("[Creem] Error stack:", error instanceof Error ? error.stack : "No stack");
        }
      },
      onGrantAccess: async ({ customer, metadata }) => {
        try {
          console.log("[Creem] ✅ onGrantAccess called");
          console.log("[Creem] Customer data:", JSON.stringify(customer, null, 2));
          console.log("[Creem] Metadata:", JSON.stringify(metadata, null, 2));
          
          const planId = metadata?.planId as string | undefined;
          const billingCycle = metadata?.billingCycle as string | undefined;
          const userId = metadata?.userId as string | undefined;
          const productId = metadata?.productId as string | undefined;

          console.log("[Creem] Extracted values:", { planId, billingCycle, userId, productId });

          if (!customer?.email) {
            console.error("[Creem] ❌ No customer email in onGrantAccess");
            return;
          }

          if (!planId || planId === "free") {
            console.error("[Creem] ❌ Invalid planId:", planId);
            return;
          }

          console.log("[Creem] Updating user subscription for:", customer.email);
          
          // Update user subscription
          const userUpdateResult = await prisma.user.updateMany({
            where: { email: customer.email },
            data: {
              subscriptionPlan: planId,
              subscriptionStatus: "active",
              creemCustomerId: customer.id,
            },
          });
          
          console.log("[Creem] User update result:", userUpdateResult);

          // Create or update Creem_subscription record
          if (userId) {
            console.log("[Creem] Creating/updating Creem_subscription record");
            
            const periodEnd = billingCycle === "annual" 
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            console.log("[Creem] Period end calculated:", periodEnd);

            const subscriptionData = {
              id: customer.id,
              productId: productId || "",
              referenceId: userId,
              creemCustomerId: customer.id,
              creemSubscriptionId: customer.id,
              status: "active",
              periodStart: new Date(),
              periodEnd: periodEnd,
              cancelAtPeriodEnd: false,
            };

            console.log("[Creem] Subscription data:", JSON.stringify(subscriptionData, null, 2));

            const subscriptionResult = await prisma.creem_subscription.upsert({
              where: { id: customer.id },
              create: subscriptionData,
              update: {
                status: "active",
                periodStart: new Date(),
                periodEnd: periodEnd,
                cancelAtPeriodEnd: false,
              },
            });

            console.log("[Creem] Subscription upsert result:", JSON.stringify(subscriptionResult, null, 2));
          } else {
            console.error("[Creem] ❌ No userId in metadata, skipping Creem_subscription creation");
          }

          console.log("[Creem] ✅ Successfully granted access for:", customer.email);
        } catch (error) {
          console.error("[Creem] ❌ Error in onGrantAccess:", error);
          console.error("[Creem] Error message:", error instanceof Error ? error.message : "Unknown error");
          console.error("[Creem] Error stack:", error instanceof Error ? error.stack : "No stack");
        }
      },
      onRevokeAccess: async ({ customer }) => {
        try {
          if (customer?.email) {
            await prisma.user.updateMany({
              where: { email: customer.email },
              data: {
                subscriptionPlan: "free",
                subscriptionStatus: "cancelled",
              },
            });
          }
        } catch (error) {
          console.error("Error in onRevokeAccess:", error);
        }
      },
    }),
  ].filter(Boolean),
});

// Export prisma from the shared instance
export { prisma };
