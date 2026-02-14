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
import { Select, SelectItem } from "@heroui/select";
import { Alert } from "@heroui/alert";
import { useRouter } from "next/navigation";

import { CustomerPortalButton } from "./customer-portal-button";

import { useSession } from "@/lib/auth-client";
import { PRICING_PLANS } from "@/config/pricing";

interface SubscriptionManagerProps {
  currentPlan: string;
  onSubscriptionChanged?: () => void;
}

export function SubscriptionManager({
  currentPlan,
  onSubscriptionChanged,
}: SubscriptionManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isFreePlan = currentPlan === "free";
  const currentPlanDetails =
    PRICING_PLANS[currentPlan as keyof typeof PRICING_PLANS];
  const availablePlans = Object.values(PRICING_PLANS).filter(
    (plan) => plan.id !== "free" && plan.id !== currentPlan,
  );

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

      // Refresh session to get updated subscription
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to cancel subscription" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (selectedPlan === currentPlan) {
      setShowChangePlanModal(false);

      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPlanId: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to change plan",
        });

        return;
      }

      if (data.checkoutUrl) {
        // Redirect to checkout for new plan
        window.location.href = data.checkoutUrl;

        return;
      }

      setMessage({ type: "success", text: "Plan changed successfully!" });
      setShowChangePlanModal(false);
      onSubscriptionChanged?.();

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change plan" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFreePlan) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-default-500 mb-4">You are on the Free plan</p>
          <Button color="primary" onPress={() => router.push("#pricing")}>
            Upgrade Now
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col items-start gap-1">
          <h3 className="text-lg font-semibold">Manage Subscription</h3>
          <p className="text-small text-default-500">
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
            {/* Change Plan Button */}
            <Button
              color="primary"
              variant="flat"
              onPress={() => setShowChangePlanModal(true)}
            >
              Change Plan
            </Button>

            {/* Customer Portal - Manage Payment Methods */}
            <CustomerPortalButton
              color="secondary"
              label="Manage Payment Methods"
              variant="flat"
            />

            {/* Cancel Subscription */}
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

      {/* Cancel Subscription Modal */}
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

      {/* Change Plan Modal */}
      <Modal
        isOpen={showChangePlanModal}
        onClose={() => setShowChangePlanModal(false)}
      >
        <ModalContent>
          <ModalHeader>Change Plan</ModalHeader>
          <ModalBody>
            <p className="mb-4">Select a new plan:</p>
            <Select
              label="Choose Plan"
              selectedKeys={[selectedPlan]}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {availablePlans.map((plan) => (
                <SelectItem
                  key={plan.id}
                  textValue={`${plan.name} - $${plan.price}/month`}
                >
                  {plan.name} - ${plan.price}/month
                </SelectItem>
              ))}
            </Select>
            <p className="text-small text-default-500 mt-4">
              You will be charged/credited the prorated difference immediately.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowChangePlanModal(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isLoading={isLoading}
              onPress={handleChangePlan}
            >
              Change Plan
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
