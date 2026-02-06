"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // You can track the successful subscription here
    console.log("Subscription successful");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
        </div>
        <h1 className="text-3xl font-bold font-mono mb-4">
          Subscription Successful!
        </h1>
        <p className="text-muted-foreground font-mono mb-8">
          Thank you for subscribing. Your account has been upgraded and you now have access to all premium features.
        </p>
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => router.push("/dashboard")}
            className="rounded-none bg-[#FF6B2C] hover:bg-[#FF6B2C]/90 font-mono"
          >
            GO TO DASHBOARD
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/billing")}
            className="rounded-none font-mono"
          >
            VIEW BILLING
          </Button>
        </div>
      </div>
    </div>
  );
}
