"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function CheckoutCanceledPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <XCircle className="w-20 h-20 mx-auto text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold font-mono mb-4">Checkout Canceled</h1>
        <p className="text-muted-foreground font-mono mb-8">
          Your subscription checkout was canceled. No charges were made to your
          account.
        </p>
        <div className="flex flex-col gap-4">
          <Button
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
            onClick={() => router.push("/dashboard/billing")}
          >
            TRY AGAIN
          </Button>
          <Button
            className="rounded-none font-mono"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            GO TO DASHBOARD
          </Button>
        </div>
      </div>
    </div>
  );
}
