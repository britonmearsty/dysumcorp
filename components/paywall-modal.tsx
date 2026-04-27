"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Lock, Check } from "lucide-react";

import {
  PRICING_PLANS,
  PlanType,
  formatPrice,
  formatStorage,
} from "@/config/pricing";

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
}: PaywallModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);

  useEffect(() => {
    setInternalIsOpen(isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    onClose();
  }, [onClose]);

  const plan = PRICING_PLANS["pro"];

  const handleUpgrade = async () => {
    onClose();
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "pro",
          billingCycle: "monthly",
        }),
      });
      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      window.location.href = "/dashboard/billing?tab=plans";
    }
  };

  const handleViewPlans = () => {
    onClose();
    window.location.href = "/dashboard/billing?tab=plans";
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "max-h-[90vh]",
        body: "py-6",
      }}
      hideCloseButton={false}
      isOpen={internalIsOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={handleClose}
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
                    Pro Subscription Required
                  </h2>
                  <p className="text-sm text-default-500">
                    {feature} requires a Pro subscription
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
                          Current: {currentPlan}
                        </Chip>
                        <span>→</span>
                        <Chip color="primary" size="sm" variant="flat">
                          Required: Pro
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Recommended Plan */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pro Plan</h3>

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
                          {plan.limits.portals}
                        </p>
                      </div>
                      <div>
                        <p className="text-default-500">Cloud</p>
                        <p className="font-semibold text-xs">Your Drive/Dropbox</p>
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
            </ModalBody>

            <ModalFooter className="gap-3">
              <Button
                className="font-medium"
                variant="bordered"
                onPress={handleViewPlans}
              >
                View Plans
              </Button>
              <Button
                className="font-semibold font-mono"
                color="primary"
                onPress={handleUpgrade}
              >
                Subscribe to Pro
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
    currentPlan: "free" as PlanType,
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
