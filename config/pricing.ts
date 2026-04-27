export type PlanType = "free" | "pro";

export interface PlanLimits {
  portals: number;
  storage?: number; // in GB - not enforced, files go to user's cloud
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
  monthlyPrice: number;
  annualPrice: number;
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
    monthlyPrice: 10,
    annualPrice: 96,
    // Set these after creating products in Polar dashboard
    polarProductId: process.env.POLAR_PRODUCT_ID_MONTHLY || "",
    polarProductIdAnnual: process.env.POLAR_PRODUCT_ID_ANNUAL || "",
    limits: {
      portals: 100, // Generous limits for professionals
      customDomains: 0, // Coming soon
      whiteLabeling: true,
      passwordProtection: true,
      expiringLinks: true,
      customBranding: true,
    },
    features: [
      "Up to 100 Portals",
      "Full white-labeling",
      "Custom branding & themes",
      "Password protection",
      "Expiring links",
      "Priority support",
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

export function formatStorage(gb: number | undefined): string {
  if (gb === undefined || gb >= 999999) return "Your Cloud";
  if (gb >= 1024) return `${Math.round(gb / 1024)}TB`;
  return `${gb}GB`;
}

export function formatPrice(price: number | undefined): string {
  if (price === undefined) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}
