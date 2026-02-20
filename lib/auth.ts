import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { creem } from "@creem_io/better-auth";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { sendWelcomeEmail, sendSignInNotification } from "@/lib/email-service";

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}
if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not defined");
}

// Create PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

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
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL!,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  ].filter(Boolean),
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

      const body = ctx.body as unknown as
        | { user?: { email: string; name?: string | null } }
        | undefined;
      if ((isSignup || isSignIn) && body?.user) {
        const user = body.user;

        const userName = user.name || user.email.split("@")[0];

        if (isSignup) {
          console.log(`📧 Sending welcome email to ${user.email}`);
          try {
            await sendWelcomeEmail({
              to: user.email,
              userName,
            });
            console.log(`✅ Welcome email sent to ${user.email}`);
          } catch (error) {
            console.error("Failed to send welcome email:", error);
          }
        }

        if (isSignIn) {
          console.log(`📧 Sending sign-in notification to ${user.email}`);
          try {
            await sendSignInNotification({
              to: user.email,
              userName,
              time: new Date().toLocaleString(),
            });
            console.log(`✅ Sign-in notification sent to ${user.email}`);
          } catch (error) {
            console.error("Failed to send sign-in notification:", error);
          }
        }
      }
      return ctx;
    },
  },
  plugins: [
    creem({
      apiKey: process.env.CREEM_API_KEY!,
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
      testMode: process.env.NODE_ENV === "development", // Automatically switch based on environment
      defaultSuccessUrl: "/dashboard/billing?success=true",
      persistSubscriptions: true, // Enable database persistence
      onCheckoutCompleted: async ({ customer, metadata }) => {
        console.log(`🛒 Checkout completed for ${customer?.email}`);
      },
      onGrantAccess: async ({ reason, product, customer, metadata }) => {
        console.log(
          `✅ Granted access to ${customer?.email} - Reason: ${reason}`,
        );

        // Update user's subscription plan in the database
        try {
          const planId = metadata?.planId as string | undefined;

          if (planId && planId !== "free" && customer?.email) {
            await prisma.user.updateMany({
              where: { email: customer.email },
              data: {
                subscriptionPlan: planId,
                subscriptionStatus: "active",
                creemCustomerId: customer.id,
              },
            });
            console.log(`✅ Updated user ${customer.email} to ${planId} plan`);
          }
        } catch (error) {
          console.error("Failed to update user subscription:", error);
        }
      },
      onRevokeAccess: async ({ reason, product, customer, metadata }) => {
        console.log(
          `❌ Revoked access from ${customer?.email} - Reason: ${reason}`,
        );

        // Downgrade user to free plan
        try {
          if (customer?.email) {
            await prisma.user.updateMany({
              where: { email: customer.email },
              data: {
                subscriptionPlan: "free",
                subscriptionStatus: "cancelled",
              },
            });
            console.log(`⬇️ Downgraded user ${customer.email} to free plan`);
          }
        } catch (error) {
          console.error("Failed to downgrade user:", error);
        }
      },
    }),
  ],
});
