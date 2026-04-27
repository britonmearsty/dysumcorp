import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

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
      polarCustomerId: {
        type: "string",
        defaultValue: null,
        input: false,
      },
      polarSubscriptionId: {
        type: "string",
        defaultValue: null,
        input: false,
      },
      polarCurrentPeriodEnd: {
        type: "string",
        defaultValue: null,
        input: false,
      },
      portalLogo: {
        type: "string",
        defaultValue: null,
        input: true,
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
});

// Export prisma from the shared instance
export { prisma };
