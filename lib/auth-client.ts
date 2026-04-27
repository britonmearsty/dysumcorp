import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields({
      user: {
        subscriptionPlan: {
          type: "string",
        },
        subscriptionStatus: {
          type: "string",
        },
        polarCustomerId: {
          type: "string",
        },
        polarSubscriptionId: {
          type: "string",
        },
        polarCurrentPeriodEnd: {
          type: "string",
        },
        portalLogo: {
          type: "string",
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
