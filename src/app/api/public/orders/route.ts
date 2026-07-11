import { after, NextResponse } from "next/server";
import { createPublicOrder, PublicOrderError, type PublicOrderPayload } from "@/lib/services/public-order-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as PublicOrderPayload;
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || crypto.randomUUID();
    const traceId = request.headers.get("x-simi-request-id")?.trim() || crypto.randomUUID();
    const supabase = createSupabaseAdminClient();
    const result = await createPublicOrder(supabase, payload, idempotencyKey, traceId);

    if (result.notificationMode === "automatic") {
      after(() => wakeNotificationWorker(traceId));
    }

    return NextResponse.json(result, {
      status: result.reused ? 200 : 201,
      headers: {
        "x-simi-request-id": traceId,
        "x-idempotency-key": idempotencyKey
      }
    });
  } catch (error) {
    console.error("No se pudo crear el pedido publico.", error);
    const status = error instanceof PublicOrderError ? error.status : 500;
    const message = error instanceof Error ? error.message : "No se pudo crear el pedido.";
    return NextResponse.json({ error: message }, { status });
  }
}

async function wakeNotificationWorker(traceId: string) {
  const apiUrl = process.env.SIMI_API_URL?.replace(/\/$/, "");
  const workerToken = process.env.SIMI_API_WORKER_TOKEN;
  if (!apiUrl || !workerToken) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`${apiUrl}/api/internal/notifications/process?limit=20`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerToken}`,
        "X-SIMI-Request-ID": traceId
      },
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) console.error("El worker de WhatsApp no aceptó el lote.", response.status);
  } catch (error) {
    console.error("No se pudo despertar el worker de WhatsApp.", error instanceof Error ? error.message : error);
  } finally {
    clearTimeout(timeout);
  }
}
