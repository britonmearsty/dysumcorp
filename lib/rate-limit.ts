import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy initialization to avoid build-time errors
let redis: Redis | null = null;
let UPLOAD_LIMIT: Ratelimit | null = null;
let DOWNLOAD_LIMIT: Ratelimit | null = null;
let API_LIMIT: Ratelimit | null = null;
let AUTH_LIMIT: Ratelimit | null = null;
let PUBLIC_PORTAL_LIMIT: Ratelimit | null = null;
let STATUS_POLL_LIMIT: Ratelimit | null = null;
let PASSWORD_ATTEMPT_LIMIT: Ratelimit | null = null;

function initializeRedis() {
  if (redis !== null) return; // Already initialized

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      UPLOAD_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "60 s"),
        analytics: true,
      });

      DOWNLOAD_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "60 s"),
        analytics: true,
      });

      API_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, "60 s"),
        analytics: true,
      });

      AUTH_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
      });

      // 120 portal lookups per IP per minute — prevents slug enumeration
      PUBLIC_PORTAL_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(120, "60 s"),
        analytics: true,
      });

      // 300 status polls per IP per minute — polling is frequent but bounded
      STATUS_POLL_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(300, "60 s"),
        analytics: true,
      });

      // 10 password attempts per portal per 5 minutes — brute-force protection
      PASSWORD_ATTEMPT_LIMIT = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "300 s"),
        analytics: true,
      });
    } catch (error) {
      console.warn("Failed to initialize Redis rate limiting:", error);
      redis = null;
    }
  }
}

export {
  UPLOAD_LIMIT,
  DOWNLOAD_LIMIT,
  API_LIMIT,
  AUTH_LIMIT,
  PUBLIC_PORTAL_LIMIT,
  STATUS_POLL_LIMIT,
  PASSWORD_ATTEMPT_LIMIT,
};

class InMemoryRateLimit {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  async checkLimit(identifier: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs * 1000;

    const requestList = this.requests.get(identifier) || [];
    const validRequests = requestList.filter((time) => time > windowStart);

    if (validRequests.length >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: validRequests[0] + this.windowMs * 1000,
      };
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: now + this.windowMs * 1000,
    };
  }
}

export const FALLBACK_UPLOAD_LIMIT = new InMemoryRateLimit(50, 60);
export const FALLBACK_DOWNLOAD_LIMIT = new InMemoryRateLimit(100, 60);
export const FALLBACK_API_LIMIT = new InMemoryRateLimit(1000, 60);
export const FALLBACK_AUTH_LIMIT = new InMemoryRateLimit(5, 60);
export const FALLBACK_PUBLIC_PORTAL_LIMIT = new InMemoryRateLimit(120, 60);
export const FALLBACK_STATUS_POLL_LIMIT = new InMemoryRateLimit(300, 60);
export const FALLBACK_PASSWORD_ATTEMPT_LIMIT = new InMemoryRateLimit(10, 300);

/**
 * Extract the real client IP from a request.
 * On Vercel, x-forwarded-for is a comma-separated list; the leftmost entry
 * is the original client. Taking only the first value prevents spoofing by
 * appending extra IPs to the header.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") || "unknown";
}

export async function getRateLimit(
  limiter: any,
  fallback: any,
  identifier: string,
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Initialize Redis on first use
  initializeRedis();

  try {
    if (limiter) {
      const result = await limiter.limit(identifier);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }
  } catch (error) {
    console.warn("Redis rate limiting failed, using fallback:", error);
  }

  return await fallback.checkLimit(identifier);
}

export function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.reset / 1000).toString(),
  };
}

export async function applyRateLimit(
  limiter: any,
  fallback: any,
  identifier: string,
): Promise<NextResponse | null> {
  const result = await getRateLimit(limiter, fallback, identifier);

  if (!result.success) {
    const headers = rateLimitHeaders(result);

    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
    );
  }

  return null;
}

export async function applyApiRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(API_LIMIT, FALLBACK_API_LIMIT, `api:${ip}`);
}

export async function applyAuthRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(AUTH_LIMIT, FALLBACK_AUTH_LIMIT, `auth:${ip}`);
}

export async function applyUploadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(
    UPLOAD_LIMIT,
    FALLBACK_UPLOAD_LIMIT,
    `upload:${ip}`,
  );
}

export async function applyDownloadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(
    DOWNLOAD_LIMIT,
    FALLBACK_DOWNLOAD_LIMIT,
    `download:${ip}`,
  );
}

export async function applyPublicPortalRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(
    PUBLIC_PORTAL_LIMIT,
    FALLBACK_PUBLIC_PORTAL_LIMIT,
    `portal:${ip}`,
  );
}

export async function applyStatusPollRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);

  return await applyRateLimit(
    STATUS_POLL_LIMIT,
    FALLBACK_STATUS_POLL_LIMIT,
    `status:${ip}`,
  );
}

/**
 * Per-portal password brute-force protection.
 * Keyed on portalId so IP rotation doesn't help — 10 attempts per 5 minutes per portal.
 */
export async function applyPasswordRateLimit(
  portalId: string,
): Promise<NextResponse | null> {
  return await applyRateLimit(
    PASSWORD_ATTEMPT_LIMIT,
    FALLBACK_PASSWORD_ATTEMPT_LIMIT,
    `pwd:${portalId}`,
  );
}
