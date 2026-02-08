"use client";

import { useCallback, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Zap, TrendingUp } from "lucide-react";

import { PRICING_PLANS, PlanType, formatPrice } from "@/config/pricing";

interface SoftPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  feature: string;
  reason: string;
  usage?: {
    current: number;
    limit: number;
    percentage: number;
  };
  graceRemaining?: number;
  recommendedPlan?: PlanType;
  onUpgrade?: () => void;
  onProceed?: () => void;
}

export function SoftPaywallModal({
  isOpen,
  onClose,
  currentPlan,
  feature,
  reason,
  usage,
  graceRemaining,
  recommendedPlan,
  onUpgrade,
  onProceed,
}: SoftPaywallModalProps) {
  const { onOpenChange } = useDisclosure({ isOpen });

  const plan = recommendedPlan
    ? PRICING_PLANS[recommendedPlan]
    : PRICING_PLANS.pro;

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = "/dashboard/billing";
    }
  };

  const handleProceedAnyway = () => {
    onClose();
    if (onProceed) {
      onProceed();
    }
  };

  return (
    <Modal
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(_onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-mono">
                    Usage Notification
                  </h2>
                  <p className="text-sm text-default-500">
                    You&apos;re approaching your limits
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              {/* Current Status */}
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardBody className="py-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                        {reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Chip color="default" size="sm" variant="flat">
                          Current: {PRICING_PLANS[currentPlan].name}
                        </Chip>
                        {recommendedPlan && (
                          <>
                            <span>→</span>
                            <Chip color="primary" size="sm" variant="flat">
                              Recommended: {PRICING_PLANS[recommendedPlan].name}
                            </Chip>
                          </>
                        )}
                      </div>

                      {usage && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              Usage: {usage.current}/{usage.limit}
                            </span>
                            <span>{Math.round(usage.percentage)}%</span>
                          </div>
                          <Progress
                            className="h-2"
                            color="primary"
                            size="sm"
                            value={Math.min(usage.percentage, 100)}
                          />
                        </div>
                      )}

                      {graceRemaining && graceRemaining > 0 && (
                        <div className="mt-2">
                          <Chip color="warning" size="sm" variant="flat">
                            {graceRemaining} grace uses remaining
                          </Chip>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Benefits of Upgrading */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Why Upgrade to {plan.name}?
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-primary">
                    <CardBody className="space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-default-500">/month</span>
                        {plan.priceAnnual > 0 && (
                          <Chip color="success" size="sm" variant="flat">
                            Save 20% annually
                          </Chip>
                        )}
                      </div>

                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Portals:</span>
                          <span className="font-semibold">
                            {plan.limits.portals >= 999999
                              ? "Unlimited"
                              : plan.limits.portals}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span className="font-semibold">
                            {plan.limits.storage}GB
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Custom Domains:</span>
                          <span className="font-semibold">
                            {plan.limits.customDomains >= 999999
                              ? "Unlimited"
                              : plan.limits.customDomains}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody className="space-y-2">
                      <h4 className="font-semibold text-sm">Key Benefits:</h4>
                      <ul className="text-sm space-y-1 text-default-600">
                        {plan.features.slice(0, 4).map((featureItem, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {featureItem}
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="gap-3">
              {onProceed && (
                <Button
                  className="font-medium"
                  variant="bordered"
                  onPress={handleProceedAnyway}
                >
                  Proceed Anyway
                </Button>
              )}
              <Button
                className="font-semibold font-mono"
                color="primary"
                onPress={handleUpgrade}
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Hook for easier usage
export function useSoftPaywall() {
  const [paywallState, setPaywallState] = useState<{
    isOpen: boolean;
    currentPlan: PlanType;
    feature: string;
    reason: string;
    usage?: {
      current: number;
      limit: number;
      percentage: number;
    };
    graceRemaining?: number;
    recommendedPlan?: PlanType;
    canProceed?: boolean;
    onProceed?: () => void;
  }>({
    isOpen: false,
    currentPlan: "free",
    feature: "",
    reason: "",
  });

  const showSoftPaywall = useCallback(
    (
      currentPlan: PlanType,
      feature: string,
      reason: string,
      options?: {
        usage?: {
          current: number;
          limit: number;
          percentage: number;
        };
        graceRemaining?: number;
        recommendedPlan?: PlanType;
        canProceed?: boolean;
        onProceed?: () => void;
      },
    ) => {
      setPaywallState({
        isOpen: true,
        currentPlan,
        feature,
        reason,
        ...options,
      });
    },
    [],
  );

  const hideSoftPaywall = useCallback(() => {
    setPaywallState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    showSoftPaywall,
    hideSoftPaywall,
    paywallState,
    SoftPaywallModal: () => (
      <SoftPaywallModal
        currentPlan={paywallState.currentPlan}
        feature={paywallState.feature}
        graceRemaining={paywallState.graceRemaining}
        isOpen={paywallState.isOpen}
        reason={paywallState.reason}
        recommendedPlan={paywallState.recommendedPlan}
        usage={paywallState.usage}
        onClose={hideSoftPaywall}
        onProceed={paywallState.onProceed}
      />
    ),
  };
}
