import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { creem } from "@creem_io/better-auth";
import pg from "pg";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Create Prisma adapter for PostgreSQL
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the adapter
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false, // Disabled email/password auth
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    dropbox: {
      clientId: process.env.DROPBOX_CLIENT_ID!,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  plugins: [
    creem({
      apiKey: process.env.CREEM_API_KEY!,
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET,
      testMode: true, // Set to false in production
      defaultSuccessUrl: "/dashboard",
      persistSubscriptions: true, // Enable database persistence
      onGrantAccess: async ({ reason, product, customer, metadata }) => {
        console.log(`✅ Granted access to ${customer.email} - Reason: ${reason}`);
        // Add custom logic here if needed
      },
      onRevokeAccess: async ({ reason, product, customer, metadata }) => {
        console.log(`❌ Revoked access from ${customer.email} - Reason: ${reason}`);
        // Add custom logic here if needed
      },
    }),
  ],
});