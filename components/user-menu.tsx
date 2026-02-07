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
    <div className="flex items-center gap-4">
      <span className="text-sm">
        Welcome, {session.user?.name || session.user?.email}
      </span>
      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
      >
        Sign Out
      </Button>
    </div>
  );
}
