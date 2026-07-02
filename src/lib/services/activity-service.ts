type SupabaseLike = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: unknown }>;
  };
};

type ActivityEntityType = "order" | "payment" | "kitchen" | "delivery" | "reservation" | "table" | "product" | "promotion" | "customer" | "system";
type NotificationModule = "orders" | "payments" | "kitchen" | "delivery" | "reservations" | "menu" | "promotions" | "customers" | "settings" | "system";
type NotificationPriority = "low" | "normal" | "high" | "critical";

type Actor = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

type ActivityInput = {
  clientId: string;
  entityType: ActivityEntityType;
  entityId: string;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor?: Actor;
  metadata?: Record<string, unknown>;
  note?: string | null;
};

type NotificationInput = {
  clientId: string;
  module: NotificationModule;
  title: string;
  message?: string | null;
  entityType?: ActivityEntityType;
  entityId?: string;
  priority?: NotificationPriority;
};

function isMissingOperationalTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("activity_events") || message.includes("notifications");
}

export async function recordActivityEvent(supabase: SupabaseLike, input: ActivityInput) {
  const { error } = await supabase.from("activity_events").insert({
    client_id: input.clientId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    from_status: input.fromStatus || null,
    to_status: input.toStatus || null,
    actor_user_id: input.actor?.userId || null,
    actor_email: input.actor?.email || null,
    actor_role: input.actor?.role || null,
    metadata: input.metadata || {},
    note: input.note || null
  });

  if (error && !isMissingOperationalTable(error)) {
    console.warn("No se pudo registrar activity_event.", error);
  }
}

export async function createNotification(supabase: SupabaseLike, input: NotificationInput) {
  const { error } = await supabase.from("notifications").insert({
    client_id: input.clientId,
    module: input.module,
    title: input.title,
    message: input.message || null,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    priority: input.priority || "normal"
  });

  if (error && !isMissingOperationalTable(error)) {
    console.warn("No se pudo crear notification.", error);
  }
}

export async function recordOperationalActivity(
  supabase: SupabaseLike,
  activity: ActivityInput,
  notification?: NotificationInput
) {
  await Promise.all([
    recordActivityEvent(supabase, activity),
    notification ? createNotification(supabase, notification) : Promise.resolve()
  ]);
}
