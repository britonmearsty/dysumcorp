import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create different rate limiters for different use cases
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 uploads per minute
  analytics: true,
});

export const downloadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 downloads per minute
  analytics: true,
});

export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 auth attempts per minute
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "60 s"), // 1000 API calls per minute
  analytics: true,
});

// Fallback in-memory rate limiter for when Redis is not available
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

// Fallback rate limiters
export const fallbackUploadLimit = new InMemoryRateLimit(10, 60);
export const fallbackDownloadLimit = new InMemoryRateLimit(100, 60);
export const fallbackAuthLimit = new InMemoryRateLimit(5, 60);
export const fallbackApiLimit = new InMemoryRateLimit(1000, 60);

// Helper function to get rate limit with fallback
export async function getRateLimit(
  limiter: any,
  fallback: any,
  identifier: string,
) {
  try {
    if (
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    ) {
      return await limiter.limit(identifier);
    }
  } catch (error) {
    console.warn("Redis rate limiting failed, using fallback:", error);
  }

  return await fallback.checkLimit(identifier);
}
