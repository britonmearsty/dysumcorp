export type PlanType = "free" | "pro" | "team" | "enterprise";

export interface PlanLimits {
  portals: number;
  storage: number; // in GB
  teamMembers: number;
  customDomains: number;
  whiteLabeling: boolean;
  passwordProtection: boolean;
  expiringLinks: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  sso: boolean;
  customBranding: boolean;
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  description: string;
  price: number;
  priceAnnual: number;
  creemProductId: string; // You'll get this from Creem dashboard
  creemProductIdAnnual: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PRICING_PLANS: Record<PlanType, PricingPlan> = {
  free: {
    id: "free",
    name: "Starter",
    description: "Perfect for trying out the platform",
    price: 0,
    priceAnnual: 0,
    creemProductId: "", // No product ID for free plan
    creemProductIdAnnual: "",
    limits: {
      portals: 1,
      storage: 1, // 1GB
      teamMembers: 1,
      customDomains: 0,
      whiteLabeling: false,
      passwordProtection: false,
      expiringLinks: false,
      analytics: false,
      apiAccess: false,
      prioritySupport: false,
      sso: false,
      customBranding: false,
    },
    features: [
      "1 Portal",
      "1GB Storage",
      "Unlimited downloads",
      "Basic file sharing",
      "Community support",
      "Powered by branding",
    ],
  },
  pro: {
    id: "pro",
    name: "Professional",
    description: "For professionals and freelancers",
    price: 29,
    priceAnnual: 276, // 20% discount (29 * 12 * 0.8)
    creemProductId: "prod_pro_monthly", // Replace with actual Creem product ID
    creemProductIdAnnual: "prod_pro_annual",
    limits: {
      portals: 10,
      storage: 50, // 50GB
      teamMembers: 1,
      customDomains: 1,
      whiteLabeling: false,
      passwordProtection: true,
      expiringLinks: true,
      analytics: true,
      apiAccess: false,
      prioritySupport: false,
      sso: false,
      customBranding: true,
    },
    features: [
      "10 Portals",
      "50GB Storage",
      "Remove branding",
      "1 Custom domain",
      "Password protection",
      "Expiring links",
      "Basic analytics",
      "Custom themes",
      "Email support (24-48hr)",
    ],
  },
  team: {
    id: "team",
    name: "Business",
    description: "For teams and growing businesses",
    price: 99,
    priceAnnual: 948, // 20% discount
    creemProductId: "prod_team_monthly", // Replace with actual Creem product ID
    creemProductIdAnnual: "prod_team_annual",
    limits: {
      portals: 50,
      storage: 250, // 250GB
      teamMembers: 5,
      customDomains: 5,
      whiteLabeling: true,
      passwordProtection: true,
      expiringLinks: true,
      analytics: true,
      apiAccess: true,
      prioritySupport: true,
      sso: false,
      customBranding: true,
    },
    features: [
      "50 Portals",
      "250GB Storage",
      "5 Team members ($15/additional)",
      "Full white-labeling",
      "5 Custom domains",
      "Team collaboration",
      "Client management",
      "Advanced analytics",
      "API access",
      "Priority support (12hr)",
    ],
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 299,
    priceAnnual: 2868, // 20% discount
    creemProductId: "prod_enterprise_monthly", // Replace with actual Creem product ID
    creemProductIdAnnual: "prod_enterprise_annual",
    limits: {
      portals: 999999, // Unlimited
      storage: 1000, // 1TB
      teamMembers: 999999, // Unlimited
      customDomains: 999999, // Unlimited
      whiteLabeling: true,
      passwordProtection: true,
      expiringLinks: true,
      analytics: true,
      apiAccess: true,
      prioritySupport: true,
      sso: true,
      customBranding: true,
    },
    features: [
      "Unlimited Portals",
      "1TB Storage (expandable)",
      "Unlimited team members",
      "Unlimited custom domains",
      "Full white-labeling",
      "SSO/SAML authentication",
      "Advanced security",
      "Custom integrations",
      "Dedicated account manager",
      "99.9% SLA",
      "Phone support (4hr)",
    ],
  },
};

export function getPlanLimits(planType: PlanType): PlanLimits {
  return PRICING_PLANS[planType].limits;
}

export function getPlanByCreemProductId(productId: string): PricingPlan | null {
  for (const plan of Object.values(PRICING_PLANS)) {
    if (plan.creemProductId === productId || plan.creemProductIdAnnual === productId) {
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
