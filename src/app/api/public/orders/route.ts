import { NextResponse } from "next/server";
import { recordOperationalActivity } from "@/lib/services/activity-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildWhatsappUrl, getAppUrl } from "@/lib/utils";

type OrderPayload = {
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
  items: Array<{ menuItemId: string; quantity: number; note?: string }>;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildOrderCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;
    const supabase = createSupabaseAdminClient();

    if (!payload.clientId || !payload.items?.length) {
      return NextResponse.json({ error: "El pedido necesita negocio y productos." }, { status: 400 });
    }

    const { data: client } = await supabase.from("clients").select("*").eq("id", payload.clientId).eq("is_active", true).single();
    if (!client) return NextResponse.json({ error: "Este menú no está disponible." }, { status: 404 });

    const itemIds = payload.items.map((item) => item.menuItemId);
    const { data: menuItems, error: menuError } = await supabase.from("menu_items").select("*").eq("client_id", payload.clientId).in("id", itemIds);
    if (menuError || !menuItems?.length) return NextResponse.json({ error: "No se pudieron validar los productos." }, { status: 400 });

    const menuById = new Map(menuItems.map((item) => [item.id, item]));
    const orderItems = payload.items.map((item) => {
      const menuItem = menuById.get(item.menuItemId);
      const quantity = Math.max(1, Number(item.quantity || 1));

      if (!menuItem || !menuItem.is_available) {
        throw new Error("Uno de los productos ya no está disponible.");
      }

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
        .select("*")
        .eq("id", payload.deliveryZoneId)
        .eq("client_id", payload.clientId)
        .eq("is_active", true)
        .maybeSingle();

      if (zone) {
        deliveryFee = Number(zone.delivery_fee || 0);
        deliveryZoneName = zone.name;
        const minimumOrder = Number(zone.minimum_order || 0);
        if (minimumOrder > 0 && subtotal < minimumOrder) {
          return NextResponse.json({ error: `El pedido minimo para ${zone.name} es ${new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(minimumOrder)}.` }, { status: 400 });
        }
      }
    }

    const total = subtotal + deliveryFee;

    if (payload.orderType === "dine_in" && !payload.tableId && !payload.tableLabel) {
      return NextResponse.json({ error: "El pedido en mesa necesita una mesa." }, { status: 400 });
    }

    if ((payload.orderType === "pickup" || payload.orderType === "delivery") && !normalizeText(payload.customerName)) {
      return NextResponse.json({ error: "Ingresa el nombre del cliente." }, { status: 400 });
    }

    if (payload.orderType === "delivery" && !normalizeText(payload.deliveryAddress)) {
      return NextResponse.json({ error: "Ingresa la dirección de delivery." }, { status: 400 });
    }

    let insertedOrder = null;
    let insertError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const orderCode = buildOrderCode();
      const result = await supabase
        .from("orders")
        .insert({
          client_id: payload.clientId,
          order_code: orderCode,
          order_type: payload.orderType,
          table_id: payload.tableId || null,
          table_label: normalizeText(payload.tableLabel) || null,
          customer_name: normalizeText(payload.customerName) || null,
          customer_phone: normalizeText(payload.customerPhone) || null,
          delivery_address: normalizeText(payload.deliveryAddress) || null,
          delivery_reference: normalizeText(payload.deliveryReference) || null,
          delivery_zone_id: payload.orderType === "delivery" ? payload.deliveryZoneId || null : null,
          delivery_zone_name: deliveryZoneName,
          pickup_time: normalizeText(payload.pickupTime) || null,
          notes: normalizeText(payload.notes) || null,
          subtotal,
          delivery_fee: deliveryFee,
          total,
          order_status: "payment_pending",
          payment_status: "pending_payment"
        })
        .select("*")
        .single();

      insertedOrder = result.data;
      insertError = result.error;
      if (!insertError) break;
    }

    if (!insertedOrder || insertError) {
      return NextResponse.json({ error: "No se pudo crear el pedido." }, { status: 500 });
    }

    const { error: itemError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: insertedOrder.id })));
    if (itemError) return NextResponse.json({ error: "No se pudieron guardar los productos del pedido." }, { status: 500 });

    await supabase.from("order_status_events").insert({
      order_id: insertedOrder.id,
      status: insertedOrder.order_status,
      payment_status: insertedOrder.payment_status,
      note: "Pedido creado desde la carta publica",
      created_by: "cliente"
    });

    await recordOperationalActivity(
      supabase,
      {
        clientId: insertedOrder.client_id,
        entityType: "order",
        entityId: insertedOrder.id,
        eventType: "order.created",
        fromStatus: null,
        toStatus: insertedOrder.order_status,
        actor: { role: "customer" },
        metadata: {
          order_code: insertedOrder.order_code,
          customer_name: insertedOrder.customer_name,
          total,
          order_type: insertedOrder.order_type,
          delivery_zone: deliveryZoneName
        },
        note: "Pedido creado desde la carta publica"
      },
      {
        clientId: insertedOrder.client_id,
        module: "orders",
        title: `Nuevo pedido #${insertedOrder.order_code}`,
        message: `${insertedOrder.customer_name || "Cliente"} realizo un pedido por ${new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(total)}.`,
        entityType: "order",
        entityId: insertedOrder.id,
        priority: "high"
      }
    );

    const orderLines = orderItems.map((item) => `- ${item.quantity} x ${item.item_name} (${new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(item.subtotal)})`).join("\n");
    const statusUrl = `${getAppUrl()}/pedido/${insertedOrder.id}`;
    const whatsappMessage = [
      `Hola, realicé el pedido #${insertedOrder.order_code}.`,
      payload.orderType === "dine_in" ? `Mesa: ${insertedOrder.table_label || "Sin mesa"}` : null,
      "",
      "Pedido:",
      orderLines,
      "",
      `Total: ${new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(total)}`,
      "",
      `Estado del pedido: ${statusUrl}`,
      "",
      "Ya realicé el pago por Yape. Envío el comprobante por SIMI."
    ]
      .filter((line) => line !== null)
      .join("\n");

    return NextResponse.json({
      order: insertedOrder,
      items: orderItems,
      whatsappUrl: buildWhatsappUrl(client.notification_whatsapp_number || client.whatsapp_number, whatsappMessage),
      statusUrl
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo crear el pedido." }, { status: 500 });
  }
}
