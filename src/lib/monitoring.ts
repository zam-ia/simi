type SupabaseInsertClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: unknown }>;
  };
};

export type MonitoringLevel = "debug" | "info" | "warning" | "error" | "critical";
export type MonitoringSource = "client" | "server" | "api" | "health" | "auth" | "security" | "queue";

export type MonitoringEventInput = {
  requestId?: string | null;
  source: MonitoringSource;
  level: MonitoringLevel;
  route?: string | null;
  message: string;
  stack?: string | null;
  breadcrumbs?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  userAgent?: string | null;
};

function isMissingMonitoringTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("monitoring_events");
}

export async function recordMonitoringEvent(supabase: SupabaseInsertClient, input: MonitoringEventInput) {
  const { error } = await supabase.from("monitoring_events").insert({
    request_id: input.requestId || null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    source: input.source,
    level: input.level,
    route: input.route || null,
    message: input.message.slice(0, 1000),
    stack: input.stack ? input.stack.slice(0, 6000) : null,
    breadcrumbs: input.breadcrumbs || [],
    metadata: input.metadata || {},
    user_agent: input.userAgent || null
  });

  if (error && !isMissingMonitoringTable(error)) {
    console.warn("No se pudo registrar monitoring_event.", error);
  }
}
