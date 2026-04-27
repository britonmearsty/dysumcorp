import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type PlanType = "free" | "pro";

export type SubscriptionStatus = "active" | "cancelled" | "past_due";

export interface UserSubscription {
  plan: PlanType;
  status: SubscriptionStatus;
  polarCustomerId?: string;
  polarSubscriptionId?: string;
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
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  polarCurrentPeriodEnd?: string | null;
}
