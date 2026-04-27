"use client";

import { useState, useEffect } from "react";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { TrendingUp, Gauge } from "lucide-react";

import { PlanType } from "@/config/pricing";
import { useSession } from "@/lib/auth-client";

interface UsageIndicatorProps {
  className?: string;
  showCompact?: boolean;
}

interface SoftLimitResponse {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
  softLimitLevel: "normal" | "warning" | "critical" | "exceeded";
}

export function UsageIndicator({
  className = "",
  showCompact = false,
}: UsageIndicatorProps) {
  const { data: session } = useSession();
  const [limitStatus, setLimitStatus] = useState<SoftLimitResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);

      return;
    }

    fetchUsageData();
  }, [session]);

  const fetchUsageData = async () => {
    try {
      // Get portal limit status
      const limitResponse = await fetch("/api/limits/portals/soft");

      if (limitResponse.ok) {
        const limitData: SoftLimitResponse = await limitResponse.json();

        setLimitStatus(limitData);
      }

      // Get user plan
      const planResponse = await fetch("/api/limits/portals");

      if (planResponse.ok) {
        const planData = await planResponse.json();

        setCurrentPlan(planData.planType);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !session?.user?.id || !limitStatus) {
    return null;
  }

  // Only show if user has some usage (not on free plan with 0 portals)
  if (limitStatus.current === 0 || limitStatus.softLimitLevel === "normal") {
    return null;
  }

  const getProgressColor = () => {
    switch (limitStatus.softLimitLevel) {
      case "warning":
        return "warning";
      case "critical":
        return "default";
      case "exceeded":
        return "danger";
      default:
        return "primary";
    }
  };

  const getChipColor = () => {
    switch (limitStatus.softLimitLevel) {
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
      <Chip
        className={`text-xs ${className}`}
        color={getChipColor()}
        size="sm"
        startContent={<Gauge className="h-3 w-3" />}
        variant="flat"
      >
        {limitStatus.current}/{limitStatus.limit} portals
      </Chip>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <TrendingUp className="h-4 w-4 text-default-500" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-default-500">Portals:</span>
        <Progress
          className="w-20 h-2"
          color={getProgressColor()}
          size="sm"
          value={Math.min(limitStatus.percentage, 100)}
        />
        <span className="text-xs text-default-600 font-medium">
          {limitStatus.current}/{limitStatus.limit}
        </span>
      </div>
    </div>
  );
}
