"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    return (
      <Button onClick={() => router.push("/auth")} variant="default">
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
        onClick={async () => {
          await signOut();
          router.push("/");
        }}
        variant="outline"
      >
        Sign Out
      </Button>
    </div>
  );
}
