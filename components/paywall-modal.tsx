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
import { Lock, Check, X } from "lucide-react";

import {
  PRICING_PLANS,
  PlanType,
  formatPrice,
  formatStorage,
} from "@/config/pricing";

// Import static icons for paywall modal

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  feature: string;
  reason: string;
  requiredPlan?: PlanType;
}

export function PaywallModal({
  isOpen,
  onClose,
  currentPlan,
  feature,
  reason,
  requiredPlan,
}: PaywallModalProps) {
  const { onOpenChange } = useDisclosure({ isOpen });

  // Determine the minimum plan needed for this feature
  const getMinimumPlan = (): PlanType => {
    if (requiredPlan) return requiredPlan;

    // Logic to determine minimum plan based on feature
    if (feature.includes("Custom Domain") || feature.includes("White Label")) {
      return "pro";
    }
    if (feature.includes("SSO") || feature.includes("Enterprise")) {
      return "enterprise";
    }

    return "pro"; // Default to pro for most features
  };

  const minimumPlan = getMinimumPlan();
  const recommendedPlan =
    currentPlan === "free"
      ? "pro"
      : currentPlan === "pro"
        ? "team"
        : currentPlan === "team"
          ? "enterprise"
          : "enterprise";

  const plan = PRICING_PLANS[recommendedPlan];
  const minimumPlanDetails = PRICING_PLANS[minimumPlan];

  const handleUpgrade = () => {
    onClose();
    window.location.href = "/dashboard/billing";
  };

  const handleComparePlans = () => {
    onClose();
    window.location.href = "/pricing";
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
      hideCloseButton={false}
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-mono">
                    Feature Available on Higher Plans
                  </h2>
                  <p className="text-sm text-default-500">
                    {feature} requires an upgrade to access
                  </p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody>
              {/* Current Situation */}
              <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardBody className="py-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-blue-700 dark:text-blue-300">
                        Upgrade Required
                      </p>
                      <p className="text-sm text-default-600 mt-1">{reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Chip color="default" size="sm" variant="flat">
                          Current: {PRICING_PLANS[currentPlan].name}
                        </Chip>
                        <span>→</span>
                        <Chip color="primary" size="sm" variant="flat">
                          Required: {minimumPlanDetails.name}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Recommended Plan */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Recommended: {plan.name}
                </h3>

                <Card className="border-primary">
                  <CardBody className="space-y-4">
                    {/* Pricing */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-default-500">/month</span>
                      {plan.priceAnnual > 0 && (
                        <Chip color="success" size="sm" variant="flat">
                          Save 20% annually
                        </Chip>
                      )}
                      {plan.popular && (
                        <Chip
                          className="ml-auto"
                          color="primary"
                          size="sm"
                          variant="solid"
                        >
                          Popular
                        </Chip>
                      )}
                    </div>

                    {/* Limits Grid */}
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

                    {/* Key Features */}
                    <div className="pt-4 border-t">
                      <p className="text-sm font-semibold mb-2">
                        What you&apos;ll get:
                      </p>
                      <ul className="text-sm space-y-2">
                        {plan.features.slice(0, 6).map((featureItem, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-default-600"
                          >
                            <Check className="w-4 h-4 text-success flex-shrink-0" />
                            {featureItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Feature Availability */}
              <div className="bg-default-50 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2">
                  Feature Availability:
                </p>
                <div className="space-y-2 text-sm">
                  {Object.entries(PRICING_PLANS).map(
                    ([planType, planDetails]) => {
                      const featureValue =
                        planDetails.limits[
                          feature as keyof typeof planDetails.limits
                        ];
                      const hasAccess =
                        featureValue === true ||
                        (typeof featureValue === "number" && featureValue > 0);

                      return (
                        <div
                          key={planType}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">
                            {planDetails.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasAccess ? (
                              <>
                                <Check className="w-4 h-4 text-success" />
                                <Chip color="success" size="sm" variant="flat">
                                  Available
                                </Chip>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 text-default-400" />
                                <Chip color="default" size="sm" variant="flat">
                                  Not Available
                                </Chip>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="gap-3">
              <Button
                className="font-medium"
                variant="bordered"
                onPress={handleComparePlans}
              >
                Compare All Plans
              </Button>
              <Button
                className="font-semibold font-mono"
                color="primary"
                onPress={handleUpgrade}
              >
                Upgrade to {plan.name}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

// Hook for easier usage
export function usePaywall() {
  const [paywallState, setPaywallState] = useState<{
    isOpen: boolean;
    currentPlan: PlanType;
    feature: string;
    reason: string;
    requiredPlan?: PlanType;
  }>({
    isOpen: false,
    currentPlan: "free",
    feature: "",
    reason: "",
  });

  const showPaywall = useCallback(
    (
      currentPlan: PlanType,
      feature: string,
      reason: string,
      requiredPlan?: PlanType,
    ) => {
      setPaywallState({
        isOpen: true,
        currentPlan,
        feature,
        reason,
        requiredPlan,
      });
    },
    [],
  );

  const hidePaywall = useCallback(() => {
    setPaywallState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    showPaywall,
    hidePaywall,
    paywallState,
    PaywallModal: () => (
      <PaywallModal
        currentPlan={paywallState.currentPlan}
        feature={paywallState.feature}
        isOpen={paywallState.isOpen}
        reason={paywallState.reason}
        requiredPlan={paywallState.requiredPlan}
        onClose={hidePaywall}
      />
    ),
  };
}
