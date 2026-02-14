"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { X, ArrowUp } from "lucide-react";

import {
  PRICING_PLANS,
  PlanType,
  formatPrice,
  formatStorage,
} from "@/config/pricing";

interface UpgradePromptProps {
  currentPlan: PlanType;
  reason: string;
  feature?: string;
  onClose?: () => void;
  inline?: boolean;
}

export function UpgradePrompt({
  currentPlan,
  reason,
  feature,
  onClose,
  inline = false,
}: UpgradePromptProps) {
  const router = useRouter();

  // Determine recommended upgrade
  const getRecommendedPlan = (): PlanType => {
    if (currentPlan === "free") return "pro";
    if (currentPlan === "pro") return "team";
    if (currentPlan === "team") return "enterprise";

    return "enterprise";
  };

  const recommendedPlan = getRecommendedPlan();
  const plan = PRICING_PLANS[recommendedPlan];

  const handleUpgrade = () => {
    router.push("/dashboard/billing");
  };

  if (inline) {
    return (
      <div className="bg-warning/10 border border-warning rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ArrowUp className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">Upgrade Required</p>
            <p className="text-sm text-default-600 mb-3">{reason}</p>
            <Button color="warning" size="sm" onPress={handleUpgrade}>
              Upgrade to {plan.name}
            </Button>
          </div>
          {onClose && (
            <button
              className="text-default-400 hover:text-default-600"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold font-mono">Upgrade Required</h3>
          <p className="text-sm text-default-500 mt-1">
            You've reached the limits of your {PRICING_PLANS[currentPlan].name}{" "}
            plan
          </p>
        </div>
        {onClose && (
          <button
            className="text-default-400 hover:text-default-600"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Reason */}
        <div className="bg-warning/10 border border-warning rounded-lg p-4">
          <p className="text-sm">{reason}</p>
        </div>

        {/* Recommended Plan */}
        <div>
          <h4 className="font-semibold mb-3">Recommended: {plan.name}</h4>
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono">
                {formatPrice(plan.price)}
              </span>
              <span className="text-default-500">/month</span>
              <span className="text-sm text-success ml-auto">
                Save 20% with annual billing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-default-500">Portals</p>
                <p className="font-semibold">
                  {plan.limits.portals >= 999999
                    ? "Unlimited"
                    : plan.limits.portals}
                </p>
              </div>
              <div>
                <p className="text-default-500">Storage</p>
                <p className="font-semibold">
                  {formatStorage(plan.limits.storage)}
                </p>
              </div>
              <div>
                <p className="text-default-500">Custom Domains</p>
                <p className="font-semibold">
                  {plan.limits.customDomains >= 999999
                    ? "Unlimited"
                    : plan.limits.customDomains}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-2">Key Features:</p>
              <ul className="text-sm space-y-1">
                {plan.features.slice(0, 5).map((feature, index) => (
                  <li key={index} className="text-default-600">
                    • {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button fullWidth color="primary" size="lg" onPress={handleUpgrade}>
            Upgrade to {plan.name}
          </Button>
          {onClose && (
            <Button variant="bordered" onPress={onClose}>
              Maybe Later
            </Button>
          )}
        </div>

        {/* Compare Plans Link */}
        <div className="text-center">
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => router.push("/pricing")}
          >
            Compare all plans
          </button>
        </div>
      </CardBody>
    </Card>
  );
}
