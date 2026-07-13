import type { SupabaseClient } from "@supabase/supabase-js";
import { recordOperationalActivity } from "@/lib/services/activity-service";
import { getClientServiceModes, isOrderTypeEnabled } from "@/lib/service-modes";
import { buildWhatsappUrl, getAppUrl, normalizeWhatsapp } from "@/lib/utils";

export type PublicOrderPayload = {
  clientId: string;
  orderType: "dine_in" | "pickup" | "delivery";
  tableId?: string | null;
  tableLabel?: string | null;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryReference?: string;
  deliveryZoneId?: string | null;
  pickupTime?: string;
  notes?: string;
  whatsappOptIn?: boolean;
  whatsappOptInSource?: string;
  items: Array<{ menuItemId: string; quantity: number; note?: string }>;
};

type TransactionResult = {
  order: Record<string, unknown> & { id: string; order_code: string };
  items: Array<Record<string, unknown>>;
  reused?: boolean;
  customer_notification_queued?: boolean;
  business_notification_queued?: boolean;
};

type LegacyOrderRecord = Record<string, unknown> & { id: string; order_code: string; client_id: string };

type PublicOrderCreation = {
  order: TransactionResult["order"];
  items: TransactionResult["items"];
  whatsappUrl: string;
  statusUrl: string;
  reused: boolean;
  notificationMode: "automatic" | "manual_fallback";
  notifications: {
    customer: "queued" | "not_requested" | "unavailable";
    business: "queued" | "unavailable";
  };
};

export async function createPublicOrder(
  supabase: SupabaseClient,
  payload: PublicOrderPayload,
  idempotencyKey: string,
  traceId: string
): Promise<PublicOrderCreation> {
  validateBasePayload(payload);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id,name,whatsapp_number,notification_whatsapp_number,is_active,order_flow_config")
    .eq("id", payload.clientId)
    .eq("is_active", true)
    .single();

  if (clientError || !client) throw new PublicOrderError("Este menú no está disponible.", 404);

  const { data: deliverySettings } = await supabase
    .from("delivery_settings")
    .select("delivery_enabled,pickup_enabled")
    .eq("client_id", payload.clientId)
    .maybeSingle();
  const serviceModes = getClientServiceModes(client, {
    deliveryEnabled: deliverySettings?.delivery_enabled,
    pickupEnabled: deliverySettings?.pickup_enabled
  });
  if (!isOrderTypeEnabled(serviceModes, payload.orderType)) {
    throw new PublicOrderError("Este canal de atención no está disponible para el negocio.", 400);
  }

  validateCustomer(payload);

  const { data, error } = await supabase.rpc("create_public_order_v2", {
    p_client_id: payload.clientId,
    p_order_type: payload.orderType,
    p_items: payload.items,
    p_idempotency_key: idempotencyKey,
    p_table_id: payload.orderType === "dine_in" ? payload.tableId || null : null,
    p_table_label: payload.orderType === "dine_in" ? normalizeText(payload.tableLabel) || null : null,
    p_customer_name: normalizeText(payload.customerName) || null,
    p_customer_phone: normalizeText(payload.customerPhone) || null,
    p_delivery_address: payload.orderType === "delivery" ? normalizeText(payload.deliveryAddress) || null : null,
    p_delivery_reference: payload.orderType === "delivery" ? normalizeText(payload.deliveryReference) || null : null,
    p_delivery_zone_id: payload.orderType === "delivery" ? payload.deliveryZoneId || null : null,
    p_pickup_time: normalizeText(payload.pickupTime) || null,
    p_notes: normalizeText(payload.notes) || null,
    p_whatsapp_opt_in: Boolean(payload.whatsappOptIn),
    p_whatsapp_opt_in_source: normalizeText(payload.whatsappOptInSource) || "public_checkout",
    p_status_base_url: getAppUrl(),
    p_trace_id: traceId
  });

  if (!error && data) {
    const result = data as TransactionResult;
    return buildPublicResult(result, client, payload, "automatic");
  }

  if (!isMissingOrderRpc(error)) {
    throw new PublicOrderError(getDatabaseMessage(error) || "No se pudo crear el pedido.", 400);
  }

  // Keeps checkout operational while migration 020 is being applied.
  const legacyResult = await createLegacyOrder(supabase, payload);
  return buildPublicResult(legacyResult, client, payload, "manual_fallback");
}

function validateBasePayload(payload: PublicOrderPayload) {
  if (!payload.clientId || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new PublicOrderError("El pedido necesita negocio y productos.", 400);
  }

  if (!['dine_in', 'pickup', 'delivery'].includes(payload.orderType)) {
    throw new PublicOrderError("Selecciona una modalidad válida.", 400);
  }
}

function validateCustomer(payload: PublicOrderPayload) {
  if (payload.orderType === "dine_in" && !payload.tableId && !normalizeText(payload.tableLabel)) {
    throw new PublicOrderError("El pedido en mesa necesita una mesa.", 400);
  }

  if ((payload.orderType === "pickup" || payload.orderType === "delivery") && !normalizeText(payload.customerName)) {
    throw new PublicOrderError("Ingresa el nombre del cliente.", 400);
  }

  if (payload.orderType === "delivery" && !normalizeText(payload.deliveryAddress)) {
    throw new PublicOrderError("Ingresa la dirección de delivery.", 400);
  }

  const normalizedPhone = normalizeWhatsapp(normalizeText(payload.customerPhone));
  if ((payload.orderType === "pickup" || payload.orderType === "delivery") && !/^519\d{8}$/.test(normalizedPhone)) {
    throw new PublicOrderError("Ingresa un WhatsApp válido de Perú.", 400);
  }

  if (payload.whatsappOptIn && !/^519\d{8}$/.test(normalizedPhone)) {
    throw new PublicOrderError("Necesitamos un WhatsApp válido para enviarte actualizaciones.", 400);
  }
}

function buildPublicResult(
  result: TransactionResult,
  client: { name: string; whatsapp_number: string; notification_whatsapp_number?: string | null },
  payload: PublicOrderPayload,
  mode: PublicOrderCreation["notificationMode"]
): PublicOrderCreation {
  const statusUrl = `${getAppUrl()}/pedido/${result.order.id}`;
  const orderLines = result.items
    .map((item) => {
      const quantity = Number(item.quantity || 1);
      const name = String(item.item_name || "Producto");
      const subtotal = Number(item.subtotal || 0);
      return `- ${quantity} x ${name} (${formatPrice(subtotal)})`;
    })
    .join("\n");

  const whatsappMessage = [
    `Hola, realicé el pedido #${result.order.order_code}.`,
    payload.orderType === "dine_in" ? `Mesa: ${String(result.order.table_label || "Sin mesa")}` : null,
    "",
    "Pedido:",
    orderLines,
    "",
    `Total: ${formatPrice(Number(result.order.total || 0))}`,
    "",
    `Estado del pedido: ${statusUrl}`,
    "",
    "Ya realicé el pago por Yape. Envío el comprobante por SIMI."
  ]
    .filter((line) => line !== null)
    .join("\n");

  const customerQueued = mode === "automatic" && Boolean(result.customer_notification_queued);
  const businessQueued = mode === "automatic" && Boolean(result.business_notification_queued);

  return {
    order: result.order,
    items: result.items,
    whatsappUrl: buildWhatsappUrl(client.notification_whatsapp_number || client.whatsapp_number, whatsappMessage),
    statusUrl,
    reused: Boolean(result.reused),
    notificationMode: mode,
    notifications: {
      customer: customerQueued ? "queued" : payload.whatsappOptIn ? "unavailable" : "not_requested",
      business: businessQueued ? "queued" : "unavailable"
    }
  };
}

async function createLegacyOrder(supabase: SupabaseClient, payload: PublicOrderPayload): Promise<TransactionResult> {
  const itemIds = payload.items.map((item) => item.menuItemId);
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id,name,price,is_available")
    .eq("client_id", payload.clientId)
    .in("id", itemIds);

  if (menuError || !menuItems?.length) throw new PublicOrderError("No se pudieron validar los productos.", 400);

  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const orderItems = payload.items.map((item) => {
    const menuItem = menuById.get(item.menuItemId);
    const quantity = Math.max(1, Math.min(99, Number(item.quantity || 1)));
    if (!menuItem || !menuItem.is_available) throw new PublicOrderError("Uno de los productos ya no está disponible.", 400);
    const unitPrice = Number(menuItem.price);
    return {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      unit_price: unitPrice,
      quantity,
      item_note: normalizeText(item.note) || null,
      subtotal: unitPrice * quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  let deliveryFee = 0;
  let deliveryZoneName: string | null = null;

  if (payload.orderType === "delivery" && payload.deliveryZoneId) {
    const { data: zone } = await supabase
      .from("client_delivery_zones")
      .select("name,delivery_fee,minimum_order")
      .eq("id", payload.deliveryZoneId)
      .eq("client_id", payload.clientId)
      .eq("is_active", true)
      .maybeSingle();

    if (zone) {
      deliveryFee = Number(zone.delivery_fee || 0);
      deliveryZoneName = zone.name;
      if (Number(zone.minimum_order || 0) > subtotal) {
        throw new PublicOrderError(`El pedido mínimo para ${zone.name} es ${formatPrice(Number(zone.minimum_order))}.`, 400);
      }
    }
  }

  let insertedOrder: LegacyOrderRecord | null = null;
  for (let attempt = 0; attempt < 5 && !insertedOrder; attempt += 1) {
    const result = await supabase
      .from("orders")
      .insert({
        client_id: payload.clientId,
        order_code: buildOrderCode(),
        order_type: payload.orderType,
        table_id: payload.orderType === "dine_in" ? payload.tableId || null : null,
        table_label: payload.orderType === "dine_in" ? normalizeText(payload.tableLabel) || null : null,
        customer_name: normalizeText(payload.customerName) || null,
        customer_phone: normalizeText(payload.customerPhone) || null,
        delivery_address: payload.orderType === "delivery" ? normalizeText(payload.deliveryAddress) || null : null,
        delivery_reference: payload.orderType === "delivery" ? normalizeText(payload.deliveryReference) || null : null,
        delivery_zone_id: payload.orderType === "delivery" ? payload.deliveryZoneId || null : null,
        delivery_zone_name: deliveryZoneName,
        pickup_time: normalizeText(payload.pickupTime) || null,
        notes: normalizeText(payload.notes) || null,
        subtotal,
        delivery_fee: deliveryFee,
        total: subtotal + deliveryFee,
        order_status: "payment_pending",
        payment_status: "pending_payment"
      })
      .select("*")
      .single();

    if (!result.error && result.data) insertedOrder = result.data as LegacyOrderRecord;
  }

  if (!insertedOrder) throw new PublicOrderError("No se pudo crear el pedido.", 500);
  const savedOrder = insertedOrder;

  const { data: insertedItems, error: itemError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: savedOrder.id })))
    .select("*");
  if (itemError) throw new PublicOrderError("No se pudieron guardar los productos del pedido.", 500);

  await supabase.from("order_status_events").insert({
    order_id: savedOrder.id,
    status: "payment_pending",
    payment_status: "pending_payment",
    note: "Pedido creado desde la carta pública",
    created_by: "cliente"
  });

  await recordOperationalActivity(
    supabase,
    {
      clientId: savedOrder.client_id,
      entityType: "order",
      entityId: savedOrder.id,
      eventType: "order.created",
      fromStatus: null,
      toStatus: "payment_pending",
      actor: { role: "customer" },
      metadata: { order_code: savedOrder.order_code, total: subtotal + deliveryFee, order_type: payload.orderType },
      note: "Pedido creado desde la carta pública"
    },
    {
      clientId: savedOrder.client_id,
      module: "orders",
      title: `Nuevo pedido #${savedOrder.order_code}`,
      message: `${normalizeText(payload.customerName) || "Cliente"} realizó un pedido por ${formatPrice(subtotal + deliveryFee)}.`,
      entityType: "order",
      entityId: savedOrder.id,
      priority: "high"
    }
  );

  return {
    order: savedOrder,
    items: insertedItems || orderItems,
    reused: false,
    customer_notification_queued: false,
    business_notification_queued: false
  };
}

function isMissingOrderRpc(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST202" || code === "42883" || message.includes("create_public_order_v2");
}

function getDatabaseMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const message = "message" in error ? String(error.message) : "";
  return message.replace(/^P0001:\s*/i, "");
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildOrderCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}

export class PublicOrderError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicOrderError";
    this.status = status;
  }
}
