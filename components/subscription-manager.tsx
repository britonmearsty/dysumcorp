"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Alert } from "@heroui/alert";

import { CustomerPortalButton } from "./customer-portal-button";

import { PRICING_PLANS } from "@/config/pricing";

interface SubscriptionManagerProps {
  currentPlan: string;
  onSubscriptionChanged?: () => void;
}

export function SubscriptionManager({
  currentPlan,
  onSubscriptionChanged,
}: SubscriptionManagerProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isFreePlan = currentPlan === "free";
  const currentPlanDetails =
    PRICING_PLANS[currentPlan as keyof typeof PRICING_PLANS];

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to cancel subscription",
        });

        return;
      }

      setMessage({
        type: "success",
        text: "Subscription cancelled successfully. You will have access until the end of your billing period.",
      });
      setShowCancelModal(false);
      onSubscriptionChanged?.();

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to cancel subscription" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFreePlan) {
    return (
      <Card className="bg-card border border-border rounded-xl" shadow="none">
        <CardBody className="text-center py-8">
          <p className="text-muted-foreground mb-4">You are on the Free plan</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border border-border rounded-xl" shadow="none">
        <CardHeader className="flex flex-col items-start gap-1 bg-muted/30">
          <h3 className="text-lg font-semibold">Manage Subscription</h3>
          <p className="text-small text-muted-foreground">
            Current Plan: {currentPlanDetails?.name}
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          {message && (
            <Alert color={message.type === "success" ? "success" : "danger"}>
              {message.text}
            </Alert>
          )}

          <div className="grid gap-3">
            <CustomerPortalButton
              color="secondary"
              label="Manage Payment Methods"
              variant="flat"
            />

            <Button
              color="danger"
              variant="flat"
              onPress={() => setShowCancelModal(true)}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <ModalContent>
          <ModalHeader>Cancel Subscription</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to cancel your subscription?</p>
            <p className="text-small text-default-500 mt-2">
              You will continue to have access until the end of your current
              billing period. After that, your account will be downgraded to the
              Free plan.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowCancelModal(false)}>
              Keep Subscription
            </Button>
            <Button
              color="danger"
              isLoading={isLoading}
              onPress={handleCancelSubscription}
            >
              Yes, Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
