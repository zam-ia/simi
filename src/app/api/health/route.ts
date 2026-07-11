import { NextResponse } from "next/server";
import { recordMonitoringEvent } from "@/lib/monitoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout_${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-simi-request-id") || crypto.randomUUID();
  const checks: Record<string, unknown> = {
    app: "ok",
    env: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  };

  let status = 200;

  try {
    const supabase = createSupabaseAdminClient();
    const dbStartedAt = Date.now();
    const result = await withTimeout(supabase.from("clients").select("id").limit(1), 2500);
    const dbMs = Date.now() - dbStartedAt;

    checks.database = {
      status: result.error ? "error" : dbMs > 1200 ? "slow" : "ok",
      ms: dbMs
    };

    if (result.error || dbMs > 1200) {
      status = result.error ? 503 : 200;
      await recordMonitoringEvent(supabase, {
        requestId,
        source: "health",
        level: result.error ? "critical" : "warning",
        route: "/api/health",
        message: result.error ? "Supabase health check failed" : "Supabase health check slow",
        metadata: { dbMs, error: result.error || null },
        userAgent: request.headers.get("user-agent")
      });
    }
  } catch (error) {
    status = 503;
    checks.database = {
      status: "error",
      message: error instanceof Error ? error.message : "unknown"
    };
  }

  return NextResponse.json(
    {
      status: status === 200 ? "ok" : "degraded",
      requestId,
      ms: Date.now() - startedAt,
      checks
    },
    { status }
  );
}
