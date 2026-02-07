import { checkSubscriptionAccess } from "@creem_io/better-auth/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Get the current session
 * Use this in Server Components or API routes
 */
export async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Check if a user has an active subscription
 * Use this in Server Components or API routes
 */
export async function checkUserSubscription(userId: string) {
  return await checkSubscriptionAccess(
    {
      apiKey: process.env.CREEM_API_KEY!,
      testMode: true, // Set to false in production
    },
    {
      database: auth.options.database,
      userId,
    },
  );
}

export { auth };
