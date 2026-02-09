import { createAuthClient } from "better-auth/react";
import { creemClient } from "@creem_io/better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    creemClient(),
    inferAdditionalFields({
      user: {
        subscriptionPlan: {
          type: "string",
        },
        subscriptionStatus: {
          type: "string",
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
