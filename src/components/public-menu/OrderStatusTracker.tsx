"use client";

import { useEffect, useMemo, useState } from "react";
import { getTrackingStepIndex, getVisibleTrackingSteps, orderStatusLabels, paymentStatusLabels } from "@/constants/order-status";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import type { CustomerOrderItem, OrderStatusEvent, OrderWithDetails } from "@/types/menu";

type StatusPayload = {
  order: OrderWithDetails & {
    clients?: {
      name?: string;
      slug?: string;
      logo_url?: string | null;
      primary_color?: string;
      whatsapp_number?: string;
    };
  };
  items: CustomerOrderItem[];
  events: OrderStatusEvent[];
};

type OrderStatusTrackerProps = {
  orderId: string;
};

export function OrderStatusTracker({ orderId }: OrderStatusTrackerProps) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [message, setMessage] = useState("Cargando estado del pedido...");

  async function loadStatus() {
    try {
      const response = await fetch(`/api/public/orders/${orderId}/status`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el pedido.");
      setPayload(data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el pedido.");
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = window.setInterval(loadStatus, 8000);
    let cleanupRealtime = () => {};

    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel(`public-order-${orderId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, loadStatus)
        .on("postgres_changes", { event: "*", schema: "public", table: "order_status_events", filter: `order_id=eq.${orderId}` }, loadStatus)
        .subscribe();

      cleanupRealtime = () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.warn("Realtime no disponible. Se mantiene refresco automatico.", error);
    }

    return () => {
      window.clearInterval(interval);
      cleanupRealtime();
    };
  }, [orderId]);

  const steps = useMemo(() => (payload ? getVisibleTrackingSteps(payload.order.order_type) : []), [payload]);
  const currentIndex = payload ? getTrackingStepIndex(payload.order.order_status, payload.order.order_type) : 0;
  const accentColor = payload?.order.clients?.primary_color || "#0071E3";

  if (!payload) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-panel">
          <p className="text-sm text-[var(--text-muted)]">{message}</p>
        </div>
      </main>
    );
  }

  const { order, items, events } = payload;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6">
      <div className="mx-auto grid max-w-[980px] gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-soft lg:col-span-2">
          <div className="p-5 text-white" style={{ background: `linear-gradient(135deg, ${accentColor}, color-mix(in srgb, ${accentColor} 72%, #111827))` }}>
            <p className="text-sm text-white/78">{order.clients?.name || "SIMI"}</p>
            <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <h1 className="text-3xl font-medium">Pedido #{order.order_code}</h1>
                <p className="mt-2 text-sm text-white/82">Se actualiza automaticamente cuando el negocio cambia el estado.</p>
              </div>
              <div className="rounded-[20px] bg-white/16 px-4 py-3 text-left backdrop-blur md:text-right">
                <p className="text-xs text-white/78">Total</p>
                <p className="mt-1 text-2xl font-medium">{formatPrice(order.total)}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-3">
            <StatusInfo label="Estado" value={orderStatusLabels[order.order_status]} />
            <StatusInfo label="Pago" value={paymentStatusLabels[order.payment_status]} />
            <StatusInfo label="Tiempo estimado" value={order.estimated_delivery_time || "Por confirmar"} />
          </div>
          {order.tracking_note ? <p className="mx-5 mb-5 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">{order.tracking_note}</p> : null}
        </section>

        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <h2 className="text-lg font-medium">Seguimiento</h2>
          <div className="mt-4 grid gap-4">
            {steps.map((status, index) => {
              const isDone = index <= currentIndex;
              return (
                <div key={status} className="grid grid-cols-[28px_1fr] gap-3">
                  <div className="grid justify-items-center">
                    <span className="h-7 w-7 rounded-full border text-center text-sm leading-7" style={{ borderColor: isDone ? accentColor : "var(--line)", backgroundColor: isDone ? accentColor : "transparent", color: isDone ? "white" : "var(--text-muted)" }}>
                      {index + 1}
                    </span>
                    {index < steps.length - 1 ? <span className="mt-1 h-8 w-px bg-[var(--line)]" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{orderStatusLabels[status]}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{isDone ? "Completado o en proceso" : "Pendiente"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5">
          {order.order_type === "delivery" && (order.courier_name || order.courier_phone) ? (
            <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
              <h2 className="text-lg font-medium">Repartidor</h2>
              {order.courier_name ? <p className="mt-2 text-sm">{order.courier_name}</p> : null}
              {order.courier_phone ? <p className="mt-1 text-sm text-[var(--text-muted)]">{order.courier_phone}</p> : null}
            </section>
          ) : null}

          <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <h2 className="text-lg font-medium">Resumen</h2>
          <div className="mt-3 grid gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span>{item.quantity} x {item.item_name}</span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[var(--line)] pt-3 text-sm font-medium">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
          </section>
        </div>

        {events.length ? (
          <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel lg:col-span-2">
            <h2 className="text-lg font-medium">Historial</h2>
            <div className="mt-3 grid gap-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">
                  <p className="text-sm font-medium">{orderStatusLabels[event.status]}</p>
                  {event.note ? <p className="mt-1 text-sm text-[var(--text-muted)]">{event.note}</p> : null}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(event.created_at).toLocaleString("es-PE")}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function StatusInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
