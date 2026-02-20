"use client";

import { useRouter } from "next/navigation";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <Button variant="default" onClick={() => router.push("/auth")}>
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <span className="text-xs sm:text-sm hidden sm:inline">
        Welcome, {session.user?.name || session.user?.email}
      </span>
      <span className="text-xs sm:text-sm sm:hidden">
        {session.user?.name?.split(" ")[0] || "User"}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        <span className="hidden sm:inline">Sign Out</span>
        <span className="sm:hidden">Out</span>
      </Button>
    </div>
  );
}
