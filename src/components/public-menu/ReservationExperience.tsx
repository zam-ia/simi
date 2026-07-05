"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import type { Client, ClientTable } from "@/types/menu";

type ReservationExperienceProps = {
  client: Client;
  tables: ClientTable[];
};

export function ReservationExperience({ client, tables }: ReservationExperienceProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [tableId, setTableId] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [reservationCode, setReservationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReservation() {
    setMessage("");
    setReservationCode("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          customerName,
          customerPhone,
          partySize,
          reservationDate,
          reservationTime,
          tableId: tableId || null,
          notes
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar la reserva.");

      setReservationCode(data.reservation.reservation_code);
      setMessage("Reserva enviada. El negocio la confirmara desde su panel.");
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6">
      <section className="mx-auto grid max-w-[520px] gap-5">
        <div className="flex items-center justify-between gap-3">
          <a href={`/menu/${client.slug}`} className="focus-ring inline-flex min-h-10 items-center rounded-full bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] shadow-panel">
            Atras
          </a>
          <div className="flex items-center gap-2">
            <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="h-10 w-10 rounded-[14px]" />
            <span className="text-xl font-medium">SIMI</span>
          </div>
          <span className="h-10 w-14" />
        </div>

        <div className="rounded-[28px] border border-white/70 bg-[var(--surface)]/96 p-5 shadow-soft backdrop-blur-xl">
          <p className="text-sm text-[var(--text-muted)]">{client.name}</p>
          <h1 className="mt-2 text-4xl font-medium leading-tight">Reservar <span className="text-[var(--accent)]">mesa</span></h1>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Asegura tu lugar y disfruta sin esperar.</p>
        </div>

        <section className="grid gap-4 rounded-[28px] border border-white/70 bg-[var(--surface)]/96 p-5 shadow-soft backdrop-blur-xl">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Nombre</span>
            <input className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Carlos" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Telefono</span>
            <input className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="+51 999 999 999" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Personas</span>
            <input className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" type="number" min="1" max="30" value={partySize} onChange={(event) => setPartySize(Number(event.target.value || 1))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Fecha</span>
              <input className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" type="date" value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Hora</span>
              <input className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" type="time" value={reservationTime} onChange={(event) => setReservationTime(event.target.value)} />
            </label>
          </div>
          {tables.length ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Mesa preferida</span>
              <select className="focus-ring min-h-12 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3" value={tableId} onChange={(event) => setTableId(event.target.value)}>
                <option value="">Sin preferencia</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>{table.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Nota</span>
            <textarea className="focus-ring min-h-24 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Cumpleanos, silla de bebe, preferencia de zona..." />
          </label>
          {message ? (
            <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">
              {message}
              {reservationCode ? <span className="mt-1 block font-medium text-[var(--text)]">Codigo: {reservationCode}</span> : null}
            </p>
          ) : null}
          <Button type="button" onClick={submitReservation} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Solicitar reserva"}
          </Button>
        </section>
      </section>
    </main>
  );
}
