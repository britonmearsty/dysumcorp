import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { creem } from "@creem_io/better-auth";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

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
    enabled: false, // Disabled email/password auth
  },
  user: {
    // Define additional fields that exist in your User model
    additionalFields: {
      subscriptionPlan: {
        type: "string",
        defaultValue: "free",
        input: false, // Don't allow users to set this during signup
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "active",
        input: false, // Don't allow users to set this during signup
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
  trustedOrigins: [process.env.BETTER_AUTH_URL!],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "better-auth",
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
