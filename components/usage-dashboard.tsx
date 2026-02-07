"use client";

import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";
import { PRICING_PLANS, formatStorage } from "@/config/pricing";

interface UsageData {
  portalsUsed: number;
  storageUsed: number; // in GB
  teamMembersUsed: number;
  customDomainsUsed: number;
}

export function UsageDashboard() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData>({
    portalsUsed: 0,
    storageUsed: 0,
    teamMembersUsed: 1,
    customDomainsUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentPlan = (session?.user as any)?.subscriptionPlan || "free";
  const limits =
    PRICING_PLANS[currentPlan as keyof typeof PRICING_PLANS]?.limits;

  useEffect(() => {
    // Fetch usage data from API
    async function fetchUsage() {
      try {
        const response = await fetch("/api/user/usage");

        if (response.ok) {
          const data = await response.json();

          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchUsage();
    }
  }, [session]);

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-default-500">Loading usage data...</p>
        </CardBody>
      </Card>
    );
  }

  const usageItems = [
    {
      label: "Portals",
      used: usage.portalsUsed,
      limit: limits?.portals || 1,
      unit: "",
    },
    {
      label: "Storage",
      used: usage.storageUsed,
      limit: limits?.storage || 1,
      unit: "GB",
      formatter: formatStorage,
    },
    {
      label: "Team Members",
      used: usage.teamMembersUsed,
      limit: limits?.teamMembers || 1,
      unit: "",
    },
    {
      label: "Custom Domains",
      used: usage.customDomainsUsed,
      limit: limits?.customDomains || 0,
      unit: "",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {usageItems.map((item) => {
        const percentage =
          item.limit === 999999 ? 0 : (item.used / item.limit) * 100;
        const isUnlimited = item.limit >= 999999;
        const color =
          percentage >= 90
            ? "danger"
            : percentage >= 70
              ? "warning"
              : "success";

        return (
          <Card key={item.label}>
            <CardBody className="gap-3">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-default-500">
                  {isUnlimited ? (
                    "Unlimited"
                  ) : (
                    <>
                      {item.used}
                      {item.unit} / {item.limit}
                      {item.unit}
                    </>
                  )}
                </p>
              </div>

              {!isUnlimited && (
                <Progress
                  aria-label={`${item.label} usage`}
                  color={color}
                  size="sm"
                  value={percentage}
                />
              )}

              {!isUnlimited && percentage >= 80 && (
                <p className="text-xs text-warning">
                  {percentage >= 90 ? "Almost at limit!" : "Approaching limit"}
                </p>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
