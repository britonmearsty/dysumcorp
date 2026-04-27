export type PlanType = "free" | "pro";

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
  polarProductId: string;
  polarProductIdAnnual: string;
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
    // Set these after creating products in Polar dashboard
    polarProductId: process.env.POLAR_PRODUCT_ID_MONTHLY || "",
    polarProductIdAnnual: process.env.POLAR_PRODUCT_ID_ANNUAL || "",
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

export function getPlanByPolarProductId(productId: string): PricingPlan | null {
  for (const plan of Object.values(PRICING_PLANS)) {
    if (
      plan.polarProductId === productId ||
      plan.polarProductIdAnnual === productId
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
