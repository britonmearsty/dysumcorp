"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Info, AlertTriangle, TrendingUp, Zap, ArrowRight } from "lucide-react";

import { PlanType } from "@/config/pricing";

export interface LimitStatus {
  used: number;
  limit: number;
  percentage: number;
  isUnlimited: boolean;
}

export interface SoftLimitState {
  level: "normal" | "warning" | "critical" | "exceeded";
  message: string;
  canProceed: boolean;
  requiresUpgrade: boolean;
  graceUsed?: number;
  graceTotal?: number;
}

interface ProgressiveLimitWarningProps {
  resourceType: "portals" | "storage" | "teamMembers" | "customDomains";
  currentPlan: PlanType;
  usage: LimitStatus;
  onUpgrade?: () => void;
  showCompact?: boolean;
  className?: string;
}

export function ProgressiveLimitWarning({
  resourceType,
  currentPlan,
  usage,
  onUpgrade,
  showCompact = false,
  className = "",
}: ProgressiveLimitWarningProps) {
  const [softLimitState, setSoftLimitState] = useState<SoftLimitState>({
    level: "normal",
    message: "",
    canProceed: true,
    requiresUpgrade: false,
  });

  useEffect(() => {
    const state = calculateSoftLimitState(usage, resourceType, currentPlan);

    setSoftLimitState(state);
  }, [usage, resourceType, currentPlan]);

  if (usage.isUnlimited || softLimitState.level === "normal") {
    return null;
  }

  const getAlertIcon = () => {
    switch (softLimitState.level) {
      case "warning":
        return <Info className="h-4 w-4 text-warning" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "exceeded":
        return <TrendingUp className="h-4 w-4 text-danger" />;
      default:
        return <Info className="h-4 w-4 text-default" />;
    }
  };

  const getProgressColor = () => {
    switch (softLimitState.level) {
      case "warning":
        return "warning" as const;
      case "critical":
        return "default" as const;
      case "exceeded":
        return "danger" as const;
      default:
        return "primary" as const;
    }
  };

  if (showCompact) {
    return (
      <Card
        className={`border-l-4 ${
          softLimitState.level === "warning"
            ? "border-l-warning"
            : softLimitState.level === "critical"
              ? "border-l-orange-500"
              : "border-l-danger"
        } ${className}`}
      >
        <CardBody className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getAlertIcon()}
              <span className="text-sm font-medium">
                {softLimitState.message}
              </span>
            </div>
            {softLimitState.requiresUpgrade && (
              <Button
                className="text-xs"
                size="sm"
                variant="bordered"
                onClick={onUpgrade}
              >
                Upgrade
              </Button>
            )}
          </div>

          {!usage.isUnlimited && (
            <Progress
              className="mt-2 h-2"
              color={getProgressColor()}
              value={Math.min(usage.percentage, 100)}
            />
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={`border-l-4 ${
        softLimitState.level === "warning"
          ? "border-l-warning"
          : softLimitState.level === "critical"
            ? "border-l-orange-500"
            : "border-l-danger"
      } ${className}`}
    >
      <CardBody className="py-4">
        <div className="flex items-start gap-3">
          {getAlertIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-medium">
              {softLimitState.level === "warning" && "Usage Warning"}
              {softLimitState.level === "critical" && "Usage Critical"}
              {softLimitState.level === "exceeded" && "Limit Exceeded"}
            </h4>
            <div className="mt-2 space-y-3">
              <p className="text-sm text-default-600">
                {softLimitState.message}
              </p>

              {!usage.isUnlimited && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Current usage: {usage.used}</span>
                    <span>Limit: {usage.limit}</span>
                  </div>
                  <Progress
                    className="h-2"
                    color={getProgressColor()}
                    value={Math.min(usage.percentage, 100)}
                  />
                </div>
              )}

              {softLimitState.graceUsed && softLimitState.graceTotal && (
                <Chip color="warning" size="sm" variant="flat">
                  Grace period: {softLimitState.graceUsed} of{" "}
                  {softLimitState.graceTotal} uses remaining
                </Chip>
              )}

              {softLimitState.requiresUpgrade && (
                <div className="flex items-center gap-2">
                  <Button
                    className="text-xs"
                    color="primary"
                    size="sm"
                    onClick={onUpgrade}
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Upgrade Plan
                  </Button>
                  <Button
                    className="text-xs"
                    size="sm"
                    variant="bordered"
                    onClick={() => (window.location.href = "/pricing")}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Compare Plans
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function calculateSoftLimitState(
  usage: LimitStatus,
  resourceType: string,
  currentPlan: PlanType,
): SoftLimitState {
  if (usage.isUnlimited) {
    return {
      level: "normal",
      message: "",
      canProceed: true,
      requiresUpgrade: false,
    };
  }

  const percentage = usage.percentage;

  // Warning stage: 80-90% usage
  if (percentage >= 80 && percentage < 90) {
    return {
      level: "warning",
      message: `You're approaching your ${resourceType} limit. Consider upgrading soon to avoid interruptions.`,
      canProceed: true,
      requiresUpgrade: false,
    };
  }

  // Critical stage: 90-100% usage
  if (percentage >= 90 && percentage < 100) {
    return {
      level: "critical",
      message: `You're almost at your ${resourceType} limit. Upgrade now to continue without interruption.`,
      canProceed: true,
      requiresUpgrade: true,
    };
  }

  // Exceeded stage: 100%+ usage with grace period
  if (percentage >= 100) {
    const overage = usage.used - usage.limit;

    // Allow 10% overage as grace period (or 1 item minimum)
    const graceLimit = Math.max(Math.ceil(usage.limit * 0.1), 1);
    const remainingGrace = Math.max(graceLimit - overage, 0);

    if (remainingGrace > 0) {
      return {
        level: "exceeded",
        message: `You've exceeded your ${resourceType} limit. You have ${remainingGrace} more action(s) before upgrade is required.`,
        canProceed: true,
        requiresUpgrade: true,
        graceUsed: graceLimit - remainingGrace,
        graceTotal: graceLimit,
      };
    }

    // Hard limit after grace period
    return {
      level: "exceeded",
      message: `You've reached your ${resourceType} limit. Upgrade your plan to continue.`,
      canProceed: false,
      requiresUpgrade: true,
    };
  }

  return {
    level: "normal",
    message: "",
    canProceed: true,
    requiresUpgrade: false,
  };
}

export function useProgressiveLimits() {
  const [graceUsage, setGraceUsage] = useState<Record<string, number>>({});

  const checkLimitWithGrace = async (
    resourceType: string,
    userId: string,
    currentPlan: PlanType,
  ) => {
    try {
      const response = await fetch(`/api/limits/${resourceType}`);
      const data = await response.json();

      const usage: LimitStatus = {
        used: data.current || 0,
        limit: data.limit || 0,
        percentage: data.limit ? ((data.current || 0) / data.limit) * 100 : 0,
        isUnlimited: data.limit >= 999999,
      };

      const state = calculateSoftLimitState(usage, resourceType, currentPlan);

      // Track grace usage if applicable
      if (state.level === "exceeded" && state.graceUsed && state.graceTotal) {
        const key = `${userId}-${resourceType}`;
        const currentGraceUsed = graceUsage[key] || 0;

        if (currentGraceUsed < state.graceTotal) {
          setGraceUsage((prev) => ({
            ...prev,
            [key]: currentGraceUsed + 1,
          }));
        }
      }

      return {
        ...state,
        usage,
        canProceed: state.canProceed,
      };
    } catch (error) {
      console.error("Failed to check limit:", error);

      return {
        level: "normal" as const,
        message: "",
        canProceed: true,
        requiresUpgrade: false,
        usage: { used: 0, limit: 0, percentage: 0, isUnlimited: false },
      };
    }
  };

  return {
    checkLimitWithGrace,
    graceUsage,
  };
}
