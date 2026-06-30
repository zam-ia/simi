import { NextResponse } from "next/server";
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
  pickupTime?: string;
  notes?: string;
  deliveryFee?: number;
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
    const deliveryFee = payload.orderType === "delivery" ? Math.max(0, Number(payload.deliveryFee || 0)) : 0;
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
