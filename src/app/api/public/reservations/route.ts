import { NextResponse } from "next/server";
import { recordOperationalActivity } from "@/lib/services/activity-service";
import { getClientServiceModes } from "@/lib/service-modes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ReservationPayload = {
  clientId: string;
  tableId?: string | null;
  customerName?: string;
  customerPhone?: string;
  partySize?: number;
  reservationDate?: string;
  reservationTime?: string;
  notes?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildReservationCode() {
  return `R${Math.floor(100000 + Math.random() * 900000)}`;
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReservationPayload;
    const supabase = createSupabaseAdminClient();

    const customerName = normalizeText(payload.customerName);
    const customerPhone = normalizeText(payload.customerPhone);
    const reservationDate = normalizeText(payload.reservationDate);
    const reservationTime = normalizeText(payload.reservationTime);
    const partySize = Math.max(1, Math.min(30, Number(payload.partySize || 1)));

    if (!payload.clientId) return NextResponse.json({ error: "Selecciona el negocio." }, { status: 400 });
    if (!customerName) return NextResponse.json({ error: "Ingresa tu nombre." }, { status: 400 });
    if (customerPhone.replace(/\D/g, "").length < 9) return NextResponse.json({ error: "Ingresa un telefono valido." }, { status: 400 });
    if (!isValidDate(reservationDate) || !isValidTime(reservationTime)) return NextResponse.json({ error: "Selecciona fecha y hora de reserva." }, { status: 400 });

    const { data: client } = await supabase.from("clients").select("id,is_active,order_flow_config").eq("id", payload.clientId).eq("is_active", true).single();
    if (!client) return NextResponse.json({ error: "Este negocio no esta disponible." }, { status: 404 });
    const { data: settings } = await supabase.from("reservation_settings").select("*").eq("client_id", payload.clientId).maybeSingle();
    const serviceModes = getClientServiceModes(client, { reservationsEnabled: settings?.reservations_enabled });
    if (!serviceModes.reservations) {
      return NextResponse.json({ error: "Este negocio no esta recibiendo reservas por ahora." }, { status: 400 });
    }
    const maxPeoplePerReservation = Number(settings?.max_people_per_reservation || 30);
    if (partySize > maxPeoplePerReservation) {
      return NextResponse.json({ error: `Este negocio acepta hasta ${maxPeoplePerReservation} personas por reserva.` }, { status: 400 });
    }
    const initialStatus = settings?.confirmation_mode === "AUTOMATICA" ? "confirmed" : "pending";

    let insertedReservation = null;
    let insertError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const reservationInsert: Record<string, unknown> = {
        client_id: payload.clientId,
        table_id: payload.tableId || null,
        reservation_code: buildReservationCode(),
        customer_name: customerName,
        customer_phone: customerPhone,
        party_size: partySize,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        notes: normalizeText(payload.notes) || null,
        status: initialStatus
      };
      if (initialStatus === "confirmed") reservationInsert.confirmed_at = new Date().toISOString();

      const result = await supabase
        .from("reservations")
        .insert(reservationInsert)
        .select("*")
        .single();

      insertedReservation = result.data;
      insertError = result.error;
      if (!insertError) break;
    }

    if (!insertedReservation || insertError) {
      return NextResponse.json({ error: "No se pudo registrar la reserva. Revisa que la migracion 009 este aplicada." }, { status: 500 });
    }

    await recordOperationalActivity(
      supabase,
      {
        clientId: insertedReservation.client_id,
        entityType: "reservation",
        entityId: insertedReservation.id,
        eventType: "reservation.created",
        fromStatus: null,
        toStatus: insertedReservation.status,
        actor: { role: "customer" },
        metadata: {
          reservation_code: insertedReservation.reservation_code,
          customer_name: customerName,
          party_size: partySize,
          reservation_date: reservationDate,
          reservation_time: reservationTime
        },
        note: "Reserva creada desde la pagina publica"
      },
      {
        clientId: insertedReservation.client_id,
        module: "reservations",
        title: `Nueva reserva ${insertedReservation.reservation_code}`,
        message: `${customerName} solicito mesa para ${partySize} persona${partySize === 1 ? "" : "s"}.`,
        entityType: "reservation",
        entityId: insertedReservation.id,
        priority: "high"
      }
    );

    return NextResponse.json({ reservation: insertedReservation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo registrar la reserva." }, { status: 500 });
  }
}
