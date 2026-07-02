import { NextResponse } from "next/server";
import { recordOperationalActivity } from "@/lib/services/activity-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeFileName, validateImageFile } from "@/lib/storage";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const resolvedParams = await params;
    const formData = await request.formData();
    const operationNumber = String(formData.get("operation_number") || "").trim();
    const file = formData.get("proof_image");
    const supabase = createSupabaseAdminClient();
    let proofImageUrl: string | null = null;

    if (!operationNumber && !(file instanceof File && file.size > 0)) {
      return NextResponse.json({ error: "Sube una captura o escribe el número de operación." }, { status: 400 });
    }

    const { data: order } = await supabase.from("orders").select("id,client_id,order_code,customer_name").eq("id", resolvedParams.orderId).single();
    if (!order) return NextResponse.json({ error: "No encontramos el pedido." }, { status: 404 });

    if (file instanceof File && file.size > 0) {
      const validationError = validateImageFile(file);
      if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

      await supabase.storage.createBucket("order-proofs", { public: true }).catch(() => null);
      const filePath = `${resolvedParams.orderId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("order-proofs").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("order-proofs").getPublicUrl(filePath);
      proofImageUrl = data.publicUrl;
    }

    const { error: proofError } = await supabase.from("payment_proofs").insert({
      order_id: resolvedParams.orderId,
      operation_number: operationNumber || null,
      proof_image_url: proofImageUrl,
      status: "submitted"
    });

    if (proofError) throw proofError;

    await supabase.from("orders").update({ payment_status: "proof_submitted", order_status: "payment_submitted" }).eq("id", resolvedParams.orderId);
    await supabase.from("order_status_events").insert({
      order_id: resolvedParams.orderId,
      status: "payment_submitted",
      payment_status: "proof_submitted",
      note: operationNumber ? `Operacion Yape: ${operationNumber}` : "Comprobante enviado",
      created_by: "cliente"
    });

    await recordOperationalActivity(
      supabase,
      {
        clientId: order.client_id,
        entityType: "payment",
        entityId: resolvedParams.orderId,
        eventType: "payment.proof_uploaded",
        fromStatus: "pending_payment",
        toStatus: "proof_submitted",
        actor: { role: "customer" },
        metadata: { order_code: order.order_code, customer_name: order.customer_name, operation_number: operationNumber || null },
        note: operationNumber ? `Operacion Yape: ${operationNumber}` : "Comprobante enviado"
      },
      {
        clientId: order.client_id,
        module: "payments",
        title: `Comprobante por validar #${order.order_code}`,
        message: "El cliente subio un comprobante de pago.",
        entityType: "payment",
        entityId: resolvedParams.orderId,
        priority: "high"
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar el comprobante." }, { status: 500 });
  }
}
