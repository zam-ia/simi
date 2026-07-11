import { NextRequest, NextResponse } from "next/server";

type RateBucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const rateBuckets = new Map<string, RateBucket>();

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
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  rateBuckets.set(key, current);
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfter: 0 };
}

function addSecurityHeaders(response: NextResponse, requestId: string) {
  response.headers.set("x-simi-request-id", requestId);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "SAMEORIGIN");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(self), payment=(self)");
  response.headers.set("x-dns-prefetch-control", "on");
}

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-simi-request-id", requestId);

  const limit = request.method !== "GET" ? getLimit(request.nextUrl.pathname) : null;

  if (limit) {
    const ip = getRequestIp(request);
    const key = `${request.nextUrl.pathname}:${ip}`;
    const result = isAllowed(key, limit);

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
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|simi/).*)"]
};
