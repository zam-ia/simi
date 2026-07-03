import { NextResponse } from "next/server";
import { businessTypeLabels } from "@/constants/commercial";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeWhatsapp } from "@/lib/utils";
import type { BusinessType } from "@/types/menu";

type DemoRequestPayload = {
  businessName?: string;
  businessType?: BusinessType;
  city?: string;
  contactName?: string;
  whatsapp?: string;
  socialUrl?: string;
  comment?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as DemoRequestPayload;
    const businessName = cleanText(payload.businessName);
    const contactName = cleanText(payload.contactName);
    const whatsapp = cleanText(payload.whatsapp);
    const city = cleanText(payload.city) || "Huancayo";
    const businessType = payload.businessType && payload.businessType in businessTypeLabels ? payload.businessType : "restaurant";
    const socialUrl = cleanText(payload.socialUrl);
    const comment = cleanText(payload.comment);

    if (!businessName || businessName.length < 2) {
      return NextResponse.json({ error: "Ingresa el nombre del negocio." }, { status: 400 });
    }

    if (!contactName || contactName.length < 2) {
      return NextResponse.json({ error: "Ingresa el nombre de contacto." }, { status: 400 });
    }

    if (normalizeWhatsapp(whatsapp).length < 11) {
      return NextResponse.json({ error: "Ingresa un WhatsApp valido de Peru." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("demo_requests").insert({
      business_name: businessName,
      business_type: businessType,
      city,
      contact_name: contactName,
      whatsapp,
      social_url: socialUrl || null,
      comment: comment || null,
      status: "NUEVA"
    });

    if (error) {
      const message = error.message || "";
      if (message.includes("demo_requests") || error.code === "42P01" || error.code === "PGRST204") {
        return NextResponse.json({ error: "Falta aplicar la migracion 015_commercial_layer.sql en Supabase." }, { status: 500 });
      }
      console.error("No se pudo registrar solicitud de demo", error);
      return NextResponse.json({ error: "No se pudo registrar la solicitud." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar la solicitud." }, { status: 500 });
  }
}
