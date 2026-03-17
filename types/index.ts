import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type PlanType = "trial" | "pro" | "expired";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "trialing";

export interface UserSubscription {
  plan: PlanType;
  status: SubscriptionStatus;
  creemCustomerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: Date;
}

export interface UserProfile {
  id: string;
  name?: string | null;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  portalLogo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  subscriptionPlan?: PlanType;
  subscriptionStatus?: SubscriptionStatus;
  creemCustomerId?: string | null;
}
