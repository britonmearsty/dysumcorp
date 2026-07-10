// ============================================================
// DISCOUNT PROMO CONFIG - REMOVABLE BLOCK
// Delete this file and all "REMOVABLE: DISCOUNT" comments to disable
// ============================================================

export const DISCOUNT_CONFIG = {
  monthly: {
    code: "5MVH04XL",
    percent: 50,
    active: false,
  },
  yearly: {
    code: "ZRED2R2I",
    percent: 25,
    active: false,
  },
} as const;

export type BillingCycle = "monthly" | "annual";

export type Discount = {
  code: string;
  percent: number;
  active: boolean;
};

export function getDiscount(billingCycle: BillingCycle): Discount {
  return billingCycle === "monthly" ? DISCOUNT_CONFIG.monthly : DISCOUNT_CONFIG.yearly;
}

export function calculateDiscountedPrice(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}
