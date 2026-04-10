export type PlanType = "trial" | "pro" | "expired";

export interface PlanLimits {
  portals: number;
  storage: number; // in GB
  customDomains: number;
  whiteLabeling: boolean;
  passwordProtection: boolean;
  expiringLinks: boolean;
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
    price: 10,
    priceAnnual: 96, // 20% discount (10 * 12 * 0.8 = 96)
    creemProductId: "prod_75qoqwUpyQHTUOIqd5EkTw",
    creemProductIdAnnual: "prod_4DfGPhCcp1oJs7N3zxvaOk",
    limits: {
      portals: 999999, // Unlimited
      storage: 999999, // Unlimited
      customDomains: 0, // Not implemented
      whiteLabeling: true,
      passwordProtection: true,
      expiringLinks: true,
      customBranding: true,
    },
    features: [
      "Unlimited Portals",
      "Unlimited Storage",
      "Full white-labeling",
      "Password protection",
      "Expiring links",
      "Custom branding & themes",
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
