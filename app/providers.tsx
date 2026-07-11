"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useRef } from "react";
import posthog from "posthog-js";

import { ToastProvider } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { useSession } from "@/lib/auth-client";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

function PostHogIdentify() {
  const { data: session } = useSession();
  const user = session?.user;
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (user?.id) {
      posthog.identify(user.id, {
        name: user.name,
        email: user.email,
        subscription_plan: (user as any).subscriptionPlan ?? "free",
      });
      prevUserIdRef.current = user.id;
    } else if (prevUserIdRef.current) {
      posthog.reset();
      prevUserIdRef.current = undefined;
    }
  }, [user?.id]);

  return null;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  // Initialize usage tracking cron job on client side
  useEffect(() => {
    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      // The cron job will be initialized on the server side
      // This is just to ensure the client knows about it
      logger.log(
        "Providers mounted - usage tracking should be running on server",
      );
    }
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider>
        <NextThemesProvider {...themeProps}>
          <PostHogIdentify />
          {children}
        </NextThemesProvider>
      </ToastProvider>
    </HeroUIProvider>
  );
}
