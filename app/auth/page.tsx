"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Box } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleOAuthSignIn = async (provider: "google" | "dropbox") => {
    setLoading(provider);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth/sign-in/social`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider,
            callbackURL: "/dashboard",
          }),
          credentials: "include",
        },
      );

      const data = await response.json();
      console.log("OAuth response:", data);

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.data?.url) {
        window.location.href = data.data.url;
      } else if (data?.error) {
        console.error("OAuth error:", data.error);
        setLoading(null);
      } else {
        console.error("Unexpected response:", data);
        setLoading(null);
      }
    } catch (err: any) {
      console.error("OAuth sign in failed:", err);
      setLoading(null);
    }

    setTimeout(() => {
      setLoading((prev) => (prev ? null : prev));
    }, 10000);
  };

  return (
    <main className="min-h-screen selection:bg-stone-200 bg-[#fafaf9]">
      <nav className="sticky top-0 z-50 bg-[#fafaf9] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <div className="w-10 h-10 bg-[#1c1917] flex items-center justify-center rounded-lg">
              <Box className="text-stone-50 text-xl" />
            </div>
            <span className="serif-font text-2xl font-bold tracking-tight text-[#1c1917]">
              dysumcorp
            </span>
          </Link>
        </div>
      </nav>
      <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
        <div className="w-full max-w-md space-y-8 rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#1c1917]">Sign In</h2>
            <p className="mt-2 text-sm text-stone-600">
              Choose a provider to sign in
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              className="w-full flex items-center justify-center gap-3 bg-[#1c1917] hover:bg-stone-800 text-stone-50"
              disabled={loading !== null}
              onClick={() => handleOAuthSignIn("google")}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="currentColor"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="currentColor"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="currentColor"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="currentColor"
                />
              </svg>
              {loading === "google" ? "Signing in..." : "Continue with Google"}
            </Button>

            <Button
              className="w-full flex items-center justify-center gap-3 bg-[#0061fe] hover:bg-[#0052d9] text-white"
              disabled={loading !== null}
              onClick={() => handleOAuthSignIn("dropbox")}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 16.724l6.001 3.822 6-3.822L12 12.902l-6 3.822z" />
              </svg>
              {loading === "dropbox"
                ? "Signing in..."
                : "Continue with Dropbox"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
