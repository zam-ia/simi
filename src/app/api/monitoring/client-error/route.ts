import { NextResponse } from "next/server";
import { recordMonitoringEvent } from "@/lib/monitoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ClientErrorPayload = {
  message?: string;
  stack?: string;
  route?: string;
  level?: "debug" | "info" | "warning" | "error" | "critical";
  breadcrumbs?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const requestId = request.headers.get("x-simi-request-id") || crypto.randomUUID();

  try {
    const payload = (await request.json()) as ClientErrorPayload;
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "El evento necesita un mensaje.", requestId }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await recordMonitoringEvent(supabase, {
      requestId,
      source: "client",
      level: payload.level || "error",
      route: typeof payload.route === "string" ? payload.route : null,
      message,
      stack: typeof payload.stack === "string" ? payload.stack : null,
      breadcrumbs: Array.isArray(payload.breadcrumbs) ? payload.breadcrumbs.slice(0, 20) : [],
      metadata: payload.metadata || {},
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    console.error("No se pudo procesar client-error.", error);
    return NextResponse.json({ error: "No se pudo registrar el evento.", requestId }, { status: 500 });
  }
}
