import { describe, it, expect } from "vitest";

import {
  sanitizeSlug,
  validateSlug,
  generateSlugFromName,
} from "@/lib/slug-validation";

describe("slug-validation", () => {
  describe("sanitizeSlug", () => {
    it("should convert to lowercase", () => {
      expect(sanitizeSlug("HelloWorld")).toBe("helloworld");
    });

    it("should replace spaces with hyphens", () => {
      expect(sanitizeSlug("hello world")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(sanitizeSlug("hello@world!")).toBe("helloworld");
    });

    it("should remove consecutive hyphens", () => {
      expect(sanitizeSlug("hello---world")).toBe("hello-world");
    });

    it("should trim leading and trailing hyphens", () => {
      expect(sanitizeSlug("-hello-")).toBe("hello");
    });

    it("should handle mixed inputs", () => {
      expect(sanitizeSlug("  Hello World!@# ")).toBe("hello-world");
    });
  });

  describe("validateSlug", () => {
    it("should return invalid for empty slug", () => {
      expect(validateSlug("").isValid).toBe(false);
      expect(validateSlug("   ").isValid).toBe(false);
    });

    it("should return invalid for slug shorter than 3 characters", () => {
      expect(validateSlug("ab").isValid).toBe(false);
      expect(validateSlug("a").isValid).toBe(false);
    });

    it("should return invalid for slug longer than 50 characters", () => {
      const longSlug = "a".repeat(51);

      expect(validateSlug(longSlug).isValid).toBe(false);
    });

    it("should return invalid for slugs with uppercase", () => {
      expect(validateSlug("Hello").isValid).toBe(false);
    });

    it("should return invalid for slugs starting with hyphen", () => {
      expect(validateSlug("-hello").isValid).toBe(false);
    });

    it("should return invalid for slugs ending with hyphen", () => {
      expect(validateSlug("hello-").isValid).toBe(false);
    });

    it("should return invalid for slugs with consecutive hyphens", () => {
      expect(validateSlug("hello--world").isValid).toBe(false);
    });

    it("should return invalid for reserved slugs", () => {
      expect(validateSlug("api").isValid).toBe(false);
      expect(validateSlug("admin").isValid).toBe(false);
      expect(validateSlug("dashboard").isValid).toBe(false);
    });

    it("should return invalid for numeric-only slugs", () => {
      expect(validateSlug("123").isValid).toBe(false);
    });

    it("should return valid for proper slugs", () => {
      expect(validateSlug("my-portal").isValid).toBe(true);
      expect(validateSlug("project123").isValid).toBe(true);
      expect(validateSlug("client-files").isValid).toBe(true);
    });
  });

  describe("generateSlugFromName", () => {
    it("should generate valid slug from name", () => {
      expect(generateSlugFromName("My Portal")).toBe("my-portal");
      expect(generateSlugFromName("Hello World!")).toBe("hello-world");
    });
  });
});
