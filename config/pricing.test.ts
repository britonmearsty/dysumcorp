import { describe, it, expect } from "vitest";

import {
  formatStorage,
  formatPrice,
  getPlanByCreemProductId,
} from "@/config/pricing";

describe("pricing utilities", () => {
  describe("formatStorage", () => {
    it("should format GB correctly", () => {
      expect(formatStorage(1)).toBe("1GB");
      expect(formatStorage(50)).toBe("50GB");
      expect(formatStorage(500)).toBe("500GB");
    });

    it("should format TB correctly", () => {
      expect(formatStorage(1000)).toBe("1TB");
      expect(formatStorage(1500)).toBe("1.5TB");
      expect(formatStorage(2000)).toBe("2TB");
    });
  });

  describe("formatPrice", () => {
    it("should format price with dollar sign", () => {
      expect(formatPrice(0)).toBe("$0");
      expect(formatPrice(29)).toBe("$29");
      expect(formatPrice(100)).toBe("$100");
    });

    it("should format decimal prices", () => {
      expect(formatPrice(9.99)).toBe("$9.99");
    });
  });

  describe("getPlanByCreemProductId", () => {
    it("should return plan for valid product ID", () => {
      const plan = getPlanByCreemProductId("prod_1Rz5XOjKFlcgahDws69WiH");

      expect(plan?.id).toBe("pro");
    });

    it("should return plan for annual product ID", () => {
      const plan = getPlanByCreemProductId("prod_4TLbnNWJvTQcOReecnTIa0");

      expect(plan?.id).toBe("pro");
    });

    it("should return null for invalid product ID", () => {
      expect(getPlanByCreemProductId("invalid")).toBeNull();
    });
  });
});
