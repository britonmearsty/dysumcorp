import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const UPLOAD_LIMIT = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "60 s"),
  analytics: true,
});

export const DOWNLOAD_LIMIT = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
});

export const API_LIMIT = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "60 s"),
  analytics: true,
});

export const AUTH_LIMIT = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
});

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
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
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
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return await applyRateLimit(API_LIMIT, FALLBACK_API_LIMIT, `api:${ip}`);
}

export async function applyAuthRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return await applyRateLimit(AUTH_LIMIT, FALLBACK_AUTH_LIMIT, `auth:${ip}`);
}

export async function applyUploadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return await applyRateLimit(
    UPLOAD_LIMIT,
    FALLBACK_UPLOAD_LIMIT,
    `upload:${ip}`,
  );
}

export async function applyDownloadRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return await applyRateLimit(
    DOWNLOAD_LIMIT,
    FALLBACK_DOWNLOAD_LIMIT,
    `download:${ip}`,
  );
}
