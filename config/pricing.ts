export type PlanType = "trial" | "pro" | "expired";

export interface PlanLimits {
  portals: number;
  storage: number; // in GB
  customDomains: number;
  whiteLabeling: boolean;
  passwordProtection: boolean;
  expiringLinks: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  priceAnnual: number;
  creemProductId: string;
  creemProductIdAnnual: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: Record<"pro", PricingPlan> = {
  pro: {
    id: "pro",
    name: "Pro",
    description: "For professionals and power users",
    price: 29,
    priceAnnual: 278.4, // 20% discount (29 * 12 * 0.8 = 278.4)
    creemProductId: "prod_1Rz5XOjKFlcgahDws69WiH",
    creemProductIdAnnual: "prod_4TLbnNWJvTQcOReecnTIa0",
    limits: {
      portals: 999999, // Unlimited
      storage: 500, // 500GB
      customDomains: 1,
      whiteLabeling: true,
      passwordProtection: true,
      expiringLinks: true,
      analytics: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
    features: [
      "Unlimited Portals",
      "500GB Storage",
      "Full white-labeling",
      "Password protection",
      "Expiring links",
      "Advanced analytics",
      "Custom branding & themes",
      "Priority email support",
    ],
    popular: true,
  },
};

export function getPlanByCreemProductId(productId: string): PricingPlan | null {
  for (const plan of Object.values(PRICING_PLANS)) {
    if (
      plan.creemProductId === productId ||
      plan.creemProductIdAnnual === productId
    ) {
      return plan;
    }
  }
  return null;
}

export function formatStorage(gb: number): string {
  if (gb >= 1000) {
    return `${gb / 1000}TB`;
  }
  return `${gb}GB`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}
