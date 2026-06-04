// ============================================================
// DISCOUNT PROMO CONFIG - REMOVABLE BLOCK
// Delete this file and all "REMOVABLE: DISCOUNT" comments to disable
// ============================================================

export const DISCOUNT_CONFIG = {
  monthly: {
    code: "5MVH04XL",
    percent: 50,
    endsAt: "June 30, 2026",
  },
  yearly: {
    code: "ZRED2R2I",
    percent: 25,
    endsAt: "June 30, 2026",
  },
} as const;

export type BillingCycle = "monthly" | "annual";

export function getDiscount(billingCycle: BillingCycle) {
  return billingCycle === "monthly" ? DISCOUNT_CONFIG.monthly : DISCOUNT_CONFIG.yearly;
}

export function calculateDiscountedPrice(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}
