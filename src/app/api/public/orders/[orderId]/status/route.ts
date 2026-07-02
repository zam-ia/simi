import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isMissingPhaseTwoColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message) : "";
  return message.includes("courier_") || message.includes("estimated_delivery_time") || message.includes("tracking_note");
}

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const resolvedParams = await params;
    const supabase = createSupabaseAdminClient();
    const fullSelect = "*,clients(name,slug,logo_url,primary_color,whatsapp_number)";
    const baseSelect = "id,client_id,order_code,order_type,table_label,customer_name,delivery_address,delivery_reference,pickup_time,notes,subtotal,delivery_fee,total,order_status,payment_status,created_at,updated_at,clients(name,slug,logo_url,primary_color,whatsapp_number)";

    let { data: order, error } = await supabase.from("orders").select(fullSelect).eq("id", resolvedParams.orderId).maybeSingle();
    if (error && isMissingPhaseTwoColumn(error)) {
      const fallback = await supabase.from("orders").select(baseSelect).eq("id", resolvedParams.orderId).maybeSingle();
      order = fallback.data;
      error = fallback.error;
    }

    if (error || !order) {
      return NextResponse.json({ error: "No encontramos este pedido." }, { status: 404 });
    }

    const [{ data: items }, { data: events }] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", resolvedParams.orderId),
      supabase.from("order_status_events").select("*").eq("order_id", resolvedParams.orderId).order("created_at", { ascending: true })
    ]);

    return NextResponse.json({
      order,
      items: items || [],
      events: events || []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo cargar el estado del pedido." }, { status: 500 });
  }
}
