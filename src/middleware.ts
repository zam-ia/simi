import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

type RateResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  source: "upstash" | "memory";
};

const WINDOW_MS = 60_000;
const rateBuckets = new Map<string, RateBucket>();
const distributedLimiters = new Map<number, Ratelimit>();
const upstashRedis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    })
  : null;

const publicWriteLimits: Array<{ pattern: RegExp; limit: number }> = [
  { pattern: /^\/api\/public\/orders$/, limit: 24 },
  { pattern: /^\/api\/public\/reservations$/, limit: 18 },
  { pattern: /^\/api\/public\/orders\/[^/]+\/proof$/, limit: 30 },
  { pattern: /^\/api\/monitoring\/client-error$/, limit: 60 }
];

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return forwardedFor.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function getLimit(pathname: string) {
  return publicWriteLimits.find((entry) => entry.pattern.test(pathname))?.limit || null;
}

function isAllowed(key: string, limit: number) {
  const now = Date.now();
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, retryAfter: 0, source: "memory" as const };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000), source: "memory" as const };
  }

  current.count += 1;
  rateBuckets.set(key, current);
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfter: 0, source: "memory" as const };
}

function getDistributedLimiter(limit: number) {
  if (!upstashRedis) return null;

  const existing = distributedLimiters.get(limit);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: upstashRedis,
    limiter: Ratelimit.slidingWindow(limit, "1 m"),
    prefix: `simi:public:${limit}`,
    analytics: true,
    timeout: 750
  });
  distributedLimiters.set(limit, limiter);
  return limiter;
}

async function checkRateLimit(key: string, limit: number, event: NextFetchEvent): Promise<RateResult> {
  const distributedLimiter = getDistributedLimiter(limit);
  if (!distributedLimiter) return isAllowed(key, limit);

  try {
    const result = await distributedLimiter.limit(key);
    event.waitUntil(result.pending);

    if (result.reason === "timeout") return isAllowed(key, limit);

    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      source: "upstash"
    };
  } catch (error) {
    console.error("Upstash rate limit unavailable; using local protection.", error);
    return isAllowed(key, limit);
  }
}

function addSecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set("x-simi-request-id", requestId);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "SAMEORIGIN");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");
  response.headers.set("x-dns-prefetch-control", "on");
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-simi-request-id", requestId);

  const limit = request.method !== "GET" ? getLimit(request.nextUrl.pathname) : null;

  let rateResult: RateResult | null = null;

  if (limit) {
    const ip = getRequestIp(request);
    const key = `${request.nextUrl.pathname}:${ip}`;
    const result = await checkRateLimit(key, limit, event);
    rateResult = result;

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: "Estamos recibiendo demasiadas solicitudes. Intenta nuevamente en unos segundos.",
          requestId
        },
        { status: 429 }
      );
      response.headers.set("retry-after", String(result.retryAfter));
      response.headers.set("x-ratelimit-limit", String(limit));
      response.headers.set("x-ratelimit-remaining", "0");
      response.headers.set("x-simi-ratelimit-source", result.source);
      addSecurityHeaders(response, requestId);
      return response;
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  addSecurityHeaders(response, requestId);
  if (limit && rateResult) {
    response.headers.set("x-ratelimit-limit", String(limit));
    response.headers.set("x-ratelimit-remaining", String(rateResult.remaining));
    response.headers.set("x-simi-ratelimit-source", rateResult.source);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|simi/).*)"]
};
