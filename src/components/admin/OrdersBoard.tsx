import { getStatusOptions, orderStatusLabels, orderTypeLabels, paymentStatusLabels } from "@/constants/order-status";
import { updateOrderStatusAction } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import type { Client, OrderWithDetails } from "@/types/menu";

type OrdersBoardProps = {
  clients: Client[];
  orders: OrderWithDetails[];
};

export function OrdersBoard({ clients, orders }: OrdersBoardProps) {
  const clientById = new Map(clients.map((client) => [client.id, client]));

  return (
    <div className="grid gap-4">
      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">Todavia no hay pedidos.</div>
      ) : (
        orders.map((order) => {
          const action = updateOrderStatusAction.bind(null, order.id);
          const client = clientById.get(order.client_id);
          const statusOptions = getStatusOptions(order.order_type);
          const isDelivery = order.order_type === "delivery";
          const alert = getOrderAlert(order);

          return (
            <article key={order.id} className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-[var(--text-muted)]">{client?.name || "Negocio"} - {orderTypeLabels[order.order_type]}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${alert.tone}`}>{alert.label}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-medium">Pedido #{order.order_code}</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{order.table_label || order.customer_name || order.delivery_address || "Sin detalle"}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-2xl font-medium">{formatPrice(order.total)}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{paymentStatusLabels[order.payment_status]}</p>
                </div>
              </div>

              <div className="grid gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium">{orderStatusLabels[order.order_status]}</span>
                  {order.estimated_delivery_time ? <span className="text-xs text-[var(--text-muted)]">Estimado: {order.estimated_delivery_time}</span> : null}
                </div>
                {alert.description ? <p className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]">{alert.description}</p> : null}
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span>{item.quantity} x {item.item_name}</span>
                    <strong className="font-medium">{formatPrice(item.subtotal)}</strong>
                  </div>
                ))}
                {order.notes ? <p className="text-sm text-[var(--text-muted)]">Nota del cliente: {order.notes}</p> : null}
                {order.tracking_note ? <p className="text-sm text-[var(--text-muted)]">Nota de seguimiento: {order.tracking_note}</p> : null}
              </div>

              {order.payment_proofs.length > 0 ? (
                <div className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--line)] p-3">
                  <h3 className="text-sm font-medium">Comprobante</h3>
                  {order.payment_proofs.map((proof) => (
                    <div key={proof.id} className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                      {proof.operation_number ? <span>Operacion: {proof.operation_number}</span> : null}
                      {proof.proof_image_url ? (
                        <a className="text-[var(--accent)] hover:underline" href={proof.proof_image_url} target="_blank" rel="noreferrer">
                          Ver captura
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {order.status_events?.length ? (
                <div className="grid gap-2 rounded-[var(--radius-card)] border border-[var(--line)] p-3">
                  <h3 className="text-sm font-medium">Historial</h3>
                  <div className="grid gap-2">
                    {order.status_events.slice(0, 4).map((event) => (
                      <div key={event.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span>{orderStatusLabels[event.status]}{event.note ? ` - ${event.note}` : ""}</span>
                        <span className="text-xs text-[var(--text-muted)]">{new Date(event.created_at).toLocaleString("es-PE")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <form action={action} className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Estado del pedido</span>
                    <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="order_status" defaultValue={order.order_status}>
                      {statusOptions.map((value) => (
                        <option key={value} value={value}>
                          {orderStatusLabels[value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Estado del pago</span>
                    <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="payment_status" defaultValue={order.payment_status}>
                      {Object.entries(paymentStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="min-h-10 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-white" type="submit">
                    Guardar
                  </button>
                </div>

                {isDelivery ? (
                  <div className="grid gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 md:grid-cols-3">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Repartidor</span>
                      <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="courier_name" defaultValue={order.courier_name || ""} placeholder="Nombre" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Telefono</span>
                      <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="courier_phone" defaultValue={order.courier_phone || ""} placeholder="+51 999 888 777" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Tiempo estimado</span>
                      <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="estimated_delivery_time" defaultValue={order.estimated_delivery_time || ""} placeholder="20 min" />
                    </label>
                  </div>
                ) : null}

                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Nota visible en seguimiento</span>
                  <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="tracking_note" defaultValue={order.tracking_note || ""} placeholder="Tu pedido ya esta saliendo del local." />
                </label>
              </form>
            </article>
          );
        })
      )}
    </div>
  );
}

function getOrderAlert(order: OrderWithDetails) {
  const ageMinutes = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);

  if (order.order_status === "cancelled") {
    return {
      label: "Cancelado",
      description: "Pedido cerrado. Revisar solo si hubo reclamo o reembolso.",
      tone: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200"
    };
  }

  if (order.payment_status === "proof_submitted") {
    return {
      label: "Pago por validar",
      description: "El cliente ya envio comprobante. Validalo para que cocina avance sin demora.",
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    };
  }

  if (order.order_status === "new" && ageMinutes >= 10) {
    return {
      label: "Sin atender",
      description: `Lleva ${ageMinutes} min sin avanzar. Conviene responder antes de que el cliente consulte por WhatsApp.`,
      tone: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200"
    };
  }

  if (order.order_type === "delivery" && !order.courier_name && ["ready", "handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) {
    return {
      label: "Falta repartidor",
      description: "Agrega repartidor o telefono para que el seguimiento sea claro para el cliente.",
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    };
  }

  if (order.order_status === "delivered") {
    return {
      label: "Entregado",
      description: "",
      tone: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200"
    };
  }

  return {
    label: "En curso",
    description: "",
    tone: "bg-[var(--surface-muted)] text-[var(--text-muted)]"
  };
}
