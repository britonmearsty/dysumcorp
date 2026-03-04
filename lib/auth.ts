import { betterAuth } from "better-auth";
import { PrismaPg } from "@prisma/adapter-pg";
import { creem } from "@creem_io/better-auth";
import pg from "pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import { sendWelcomeEmail, sendSignInNotification } from "@/lib/email-service";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

const adapter = new PrismaPg(pool);

const prismaClient = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

export const auth = betterAuth({
  database: {
    provider: "postgres",
    url: process.env.DATABASE_URL!,
  },
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
      apiKey: process.env.CREEM_API_KEY!,
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
      testMode: process.env.NODE_ENV === "development",
      defaultSuccessUrl: "/dashboard/billing?success=true",
      persistSubscriptions: true,
      onCheckoutCompleted: async ({ customer }) => {
        if (customer?.email) {
          await prismaClient.user.updateMany({
            where: { email: customer.email },
            data: { subscriptionStatus: "active" },
          });
        }
      },
      onGrantAccess: async ({ customer, metadata }) => {
        const planId = metadata?.planId as string | undefined;

        if (planId && planId !== "free" && customer?.email) {
          await prismaClient.user.updateMany({
            where: { email: customer.email },
            data: {
              subscriptionPlan: planId,
              subscriptionStatus: "active",
              creemCustomerId: customer.id,
            },
          });
        }
      },
      onRevokeAccess: async ({ customer }) => {
        if (customer?.email) {
          await prismaClient.user.updateMany({
            where: { email: customer.email },
            data: {
              subscriptionPlan: "free",
              subscriptionStatus: "cancelled",
            },
          });
        }
      },
    }),
  ],
});

export const prisma = prismaClient;
