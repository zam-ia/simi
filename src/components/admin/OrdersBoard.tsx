"use client";

import { useMemo, useState } from "react";
import { getStatusOptions, orderStatusLabels, orderTypeLabels, paymentStatusLabels } from "@/constants/order-status";
import { updateOrderStatusAction } from "@/lib/actions";
import { buildWhatsappUrl, cn, formatPrice } from "@/lib/utils";
import type { Client, OrderStatus, OrderWithDetails, PaymentStatus } from "@/types/menu";

type OrdersBoardProps = {
  clients: Client[];
  orders: OrderWithDetails[];
  surface?: "orders" | "kitchen";
};

type BoardGroup = "all" | "new" | "payment" | "validate" | "confirmed" | "kitchen" | "ready" | "delivery" | "closed" | "issues";
type ViewMode = "operational" | "kanban" | "list" | "history";

const boardColumns: Array<{ id: Exclude<BoardGroup, "all">; title: string; description: string }> = [
  { id: "new", title: "Nuevo", description: "Recien recibidos" },
  { id: "payment", title: "Pago", description: "Esperando pago" },
  { id: "validate", title: "Validar pago", description: "Listo para validar" },
  { id: "confirmed", title: "Confirmado", description: "Enviar a cocina" },
  { id: "kitchen", title: "Cocina", description: "En preparacion" },
  { id: "ready", title: "Listo", description: "Listo para entregar" },
  { id: "delivery", title: "Delivery", description: "En ruta o por llegar" },
  { id: "closed", title: "Entregado", description: "Flujo cerrado" },
  { id: "issues", title: "Problema", description: "Requiere revision" }
];

const kitchenColumns: Array<{ id: Exclude<BoardGroup, "all">; title: string; description: string }> = [
  { id: "confirmed", title: "Por preparar", description: "Pedidos aprobados para cocina." },
  { id: "kitchen", title: "En preparacion", description: "Pedidos que ya se estan preparando." },
  { id: "ready", title: "Listos", description: "Pedidos terminados para recojo o despacho." }
];

const groupLabels: Record<BoardGroup, string> = {
  all: "Todos",
  new: "Nuevo",
  payment: "Esperando pago",
  validate: "Validar pago",
  confirmed: "Confirmado",
  kitchen: "En cocina",
  ready: "Listo",
  delivery: "Delivery",
  closed: "Entregado",
  issues: "Problema"
};

export function OrdersBoard({ clients, orders, surface = "orders" }: OrdersBoardProps) {
  const isKitchenSurface = surface === "kitchen";
  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const [viewMode, setViewMode] = useState<ViewMode>(surface === "kitchen" ? "kanban" : "operational");
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState("all");
  const [group, setGroup] = useState<BoardGroup>("all");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "all">("all");
  const [orderType, setOrderType] = useState<OrderWithDetails["order_type"] | "all">("all");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(() => (shouldSuppressOrderDrawer() ? null : orders[0]?.id || null));

  const enrichedOrders = useMemo(
    () =>
      orders.map((order) => {
        const client = clientById.get(order.client_id);
        const boardGroup = getBoardGroup(order);
        const alert = getOrderAlert(order);

        return {
          order,
          client,
          boardGroup,
          alert,
          ageMinutes: getAgeMinutes(order.created_at),
          ageLabel: formatAgeLabel(order.created_at),
          priority: getOrderPriority(order),
          itemCount: order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
        };
      }),
    [clientById, orders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const baseOrders = isKitchenSurface
      ? enrichedOrders.filter(({ boardGroup }) => ["confirmed", "kitchen", "ready"].includes(boardGroup))
      : enrichedOrders;

    return baseOrders.filter(({ order, client, boardGroup, alert }) => {
      if (clientId !== "all" && order.client_id !== clientId) return false;
      if (group !== "all" && boardGroup !== group) return false;
      if (paymentStatus !== "all" && order.payment_status !== paymentStatus) return false;
      if (orderType !== "all" && order.order_type !== orderType) return false;
      if (onlyUrgent && alert.level === "normal") return false;

      if (!normalizedQuery) return true;

      const searchable = [
        order.order_code,
        order.customer_name,
        order.customer_phone,
        order.delivery_address,
        order.delivery_zone_name,
        order.table_label,
        client?.name,
        order.items.map((item) => item.item_name).join(" ")
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [clientId, enrichedOrders, group, isKitchenSurface, onlyUrgent, orderType, paymentStatus, query]);

  const sortedFilteredOrders = useMemo(() => [...filteredOrders].sort((first, second) => first.priority - second.priority || new Date(second.order.created_at).getTime() - new Date(first.order.created_at).getTime()), [filteredOrders]);
  const operationalOrders = useMemo(() => sortedFilteredOrders.filter((item) => item.boardGroup !== "closed"), [sortedFilteredOrders]);
  const historyOrders = useMemo(() => sortedFilteredOrders.filter((item) => item.boardGroup === "closed" || item.alert.label === "Vencido"), [sortedFilteredOrders]);
  const selectedOrder = selectedOrderId ? enrichedOrders.find(({ order }) => order.id === selectedOrderId) || null : null;
  const activeSelectedOrder = selectedOrder || sortedFilteredOrders[0] || null;

  const summary = useMemo(() => {
    const sourceOrders = isKitchenSurface ? enrichedOrders.filter(({ boardGroup }) => ["confirmed", "kitchen", "ready"].includes(boardGroup)) : enrichedOrders;
    const activeOrders = sourceOrders.filter(({ boardGroup }) => boardGroup !== "closed");
    const revenue = sourceOrders.reduce((sum, item) => sum + Number(item.order.total || 0), 0);

    return {
      new: sourceOrders.filter((item) => item.boardGroup === "new").length,
      validate: sourceOrders.filter((item) => item.boardGroup === "validate").length,
      confirmed: sourceOrders.filter((item) => item.boardGroup === "confirmed").length,
      kitchen: sourceOrders.filter((item) => item.boardGroup === "kitchen").length,
      ready: sourceOrders.filter((item) => item.boardGroup === "ready").length,
      delivery: sourceOrders.filter((item) => item.boardGroup === "delivery").length,
      issues: sourceOrders.filter((item) => item.boardGroup === "issues").length,
      urgent: sourceOrders.filter((item) => item.alert.level !== "normal").length,
      active: activeOrders.length,
      total: sourceOrders.length,
      revenue
    };
  }, [enrichedOrders, isKitchenSurface]);

  const columns = isKitchenSurface ? kitchenColumns : boardColumns;

  function closeOrderPanel() {
    suppressOrderDrawerOnce();
    setSelectedOrderId(null);
  }

  return (
    <div className="grid gap-5">
      <section className={cn("grid gap-2 sm:grid-cols-2", isKitchenSurface ? "xl:grid-cols-4" : "xl:grid-cols-6")}>
        {isKitchenSurface ? (
          <>
            <SummaryCard label="Por preparar" value={summary.confirmed} detail="Aprobados" tone="amber" />
            <SummaryCard label="En preparacion" value={summary.kitchen} detail="Cocina activa" tone="blue" />
            <SummaryCard label="Listos" value={summary.ready} detail="Para recojo o delivery" tone="green" />
            <SummaryCard label="Alertas" value={summary.urgent} detail={`${summary.total} pedidos visibles`} tone={summary.urgent > 0 ? "red" : "gray"} />
          </>
        ) : (
          <>
            <SummaryCard label="Activos" value={summary.active} detail={`${summary.total} pedidos`} />
            <SummaryCard label="Nuevos" value={summary.new} detail="Por aceptar" tone="blue" />
            <SummaryCard label="Validar pago" value={summary.validate} detail="Listo para validar" tone="amber" />
            <SummaryCard label="En cocina" value={summary.kitchen} detail="Preparacion" tone="purple" />
            <SummaryCard label="Listos / delivery" value={summary.ready + summary.delivery} detail="Despacho" tone="green" />
            <SummaryCard label="Alertas" value={summary.urgent} detail={formatPrice(summary.revenue)} tone={summary.issues > 0 || summary.urgent > 0 ? "red" : "gray"} />
          </>
        )}
      </section>

      <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)]/92 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="min-w-0 flex-1 text-sm">
            <input
              className="focus-ring min-h-11 w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-4"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar pedido, cliente, telefono o plato"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:items-center">
            <select className="focus-ring min-h-11 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm" value={clientId} onChange={(event) => setClientId(event.target.value)} aria-label="Negocio">
              <option value="all">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <select className="focus-ring min-h-11 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm" value={group} onChange={(event) => setGroup(event.target.value as BoardGroup)} aria-label="Estado">
              {Object.entries(groupLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {!isKitchenSurface ? (
              <select className="focus-ring min-h-11 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus | "all")} aria-label="Pago">
                <option value="all">Todos los pagos</option>
                {Object.entries(paymentStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : null}

            <select className="focus-ring min-h-11 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm" value={orderType} onChange={(event) => setOrderType(event.target.value as OrderWithDetails["order_type"] | "all")} aria-label="Tipo">
              <option value="all">Todos los tipos</option>
              {Object.entries(orderTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={cn(
                "min-h-11 rounded-full px-4 text-sm font-medium transition active:scale-[0.97]",
                onlyUrgent ? "bg-red-600 text-white" : "bg-[var(--surface-muted)] text-[var(--text)]"
              )}
              onClick={() => setOnlyUrgent((current) => !current)}
            >
              Urgentes
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!isKitchenSurface ? (
            <button type="button" className={viewButtonClass(viewMode === "operational")} onClick={() => setViewMode("operational")}>
              Operativo
            </button>
          ) : null}
          <button type="button" className={viewButtonClass(viewMode === "kanban")} onClick={() => setViewMode("kanban")}>
            Kanban
          </button>
          <button type="button" className={viewButtonClass(viewMode === "list")} onClick={() => setViewMode("list")}>
            Lista
          </button>
          {!isKitchenSurface ? (
            <button type="button" className={viewButtonClass(viewMode === "history")} onClick={() => setViewMode("history")}>
              Historial
            </button>
          ) : null}
        </div>
      </section>

      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">Todavia no hay pedidos.</div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">No hay pedidos con esos filtros.</div>
      ) : viewMode === "operational" && !isKitchenSurface ? (
        <OperationalView items={operationalOrders} selectedItem={activeSelectedOrder} onSelect={(orderId) => setSelectedOrderId(orderId)} />
      ) : viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
          <div className={cn("grid gap-4", isKitchenSurface ? "min-w-[900px] grid-cols-3" : "grid-flow-col auto-cols-[minmax(300px,320px)]")}>
            {columns.map((column) => {
              const columnOrders = filteredOrders.filter((item) => item.boardGroup === column.id);

              return (
                <section key={column.id} className="grid h-fit gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium">{column.title}</h3>
                      <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-medium">{columnOrders.length}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-4 text-[var(--text-muted)]">{column.description}</p>
                  </div>
                  <div className="grid gap-3">
                    {columnOrders.length ? (
                      columnOrders.map((item) => <OrderKanbanCard key={item.order.id} item={item} surface={surface} onOpen={() => setSelectedOrderId(item.order.id)} />)
                    ) : (
                      <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-3 text-xs text-[var(--text-muted)]">Sin pedidos.</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <OrdersList items={viewMode === "history" ? historyOrders : sortedFilteredOrders} surface={surface} onOpen={(orderId) => setSelectedOrderId(orderId)} />
      )}

      {selectedOrder && viewMode !== "operational" ? <OrderDetailPanel item={selectedOrder} surface={surface} onClose={closeOrderPanel} /> : null}
    </div>
  );
}

function OperationalView({ items, selectedItem, onSelect }: { items: EnrichedOrder[]; selectedItem: EnrichedOrder | null; onSelect: (orderId: string) => void }) {
  return (
    <section className="grid min-h-[620px] gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="grid content-start gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.05)]">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h3 className="text-lg font-medium">Pedidos activos</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Ordenados por urgencia.</p>
          </div>
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium">{items.length}</span>
        </div>

        <div className="grid max-h-[calc(100vh-360px)] min-h-[420px] gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {items.length ? (
            items.map((item) => <OrderPriorityCard key={item.order.id} item={item} isActive={selectedItem?.order.id === item.order.id} onSelect={() => onSelect(item.order.id)} />)
          ) : (
            <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">No hay pedidos activos con esos filtros.</p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        {selectedItem ? (
          <OrderInlineDetail item={selectedItem} />
        ) : (
          <div className="grid min-h-[520px] place-items-center rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
            Selecciona un pedido para ver el detalle.
          </div>
        )}
      </div>
    </section>
  );
}

function OrderPriorityCard({ item, isActive, onSelect }: { item: EnrichedOrder; isActive: boolean; onSelect: () => void }) {
  const { order, client, alert, ageLabel, itemCount } = item;

  return (
    <button
      type="button"
      className={cn(
        "grid gap-3 rounded-[18px] border p-4 text-left transition active:scale-[0.99]",
        isActive ? "border-[var(--accent)] bg-[var(--surface)] shadow-[0_16px_34px_rgba(0,122,255,0.12)]" : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)]/40 hover:shadow-panel"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">#{order.order_code}</p>
          <p className="mt-1 truncate text-sm text-[var(--text)]">{order.customer_name || order.table_label || "Cliente sin nombre"}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{client?.name || "Negocio"}</p>
        </div>
        <p className="shrink-0 text-sm font-medium">{formatPrice(order.total)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("rounded-full px-2.5 py-1 font-medium", alert.className)}>{alert.label}</span>
        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--text-muted)]">{orderTypeLabels[order.order_type]}</span>
        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--text-muted)]">{paymentStatusLabels[order.payment_status]}</span>
      </div>

      <div className="grid gap-1 text-xs text-[var(--text-muted)]">
        <p>{ageLabel} · {itemCount} producto{itemCount === 1 ? "" : "s"}</p>
        {order.order_type === "delivery" && order.order_status === "ready" && !order.courier_name ? <p className="text-[#FF9500]">Listo · Sin repartidor</p> : <p>{orderStatusLabels[order.order_status]}</p>}
        {order.notes ? <p className="line-clamp-2">Nota: {order.notes}</p> : null}
      </div>
    </button>
  );
}

function OrderInlineDetail({ item }: { item: EnrichedOrder }) {
  const { order, client, alert, ageLabel, itemCount } = item;
  const isDelivery = order.order_type === "delivery";

  return (
    <article className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{client?.name || "Negocio"} · {orderTypeLabels[order.order_type]} · {ageLabel}</p>
          <h3 className="mt-1 text-2xl font-medium">Pedido #{order.order_code}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{order.customer_name || order.table_label || order.delivery_address || "Sin cliente registrado"}{order.customer_phone ? ` · ${order.customer_phone}` : ""}</p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-3xl font-medium">{formatPrice(order.total)}</p>
          <span className={cn("mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium", alert.className)}>{alert.label}</span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <InfoTile label="Estado" value={orderStatusLabels[order.order_status]} />
        <InfoTile label="Pago" value={paymentStatusLabels[order.payment_status]} />
        <InfoTile label="Productos" value={String(itemCount)} />
        <InfoTile label="Creado" value={formatDateTime(order.created_at)} />
      </div>

      <section className="grid gap-3 rounded-[20px] border border-[var(--line)] p-4">
        <h4 className="text-sm font-medium">Acciones sugeridas</h4>
        <div className="grid gap-2 sm:grid-cols-3">
          {getSmartActions(order).map((action) => (
            <QuickStatusForm key={`${action.label}-${action.orderStatus}-${action.paymentStatus || ""}`} order={order} label={action.label} orderStatus={action.orderStatus} paymentStatus={action.paymentStatus} />
          ))}
          <WhatsAppButton order={order} className="min-h-10 rounded-full bg-[#25D366] px-3 text-sm font-medium text-white" />
        </div>
      </section>

      <section className="grid gap-3 rounded-[20px] border border-[var(--line)] p-4">
        <h4 className="text-sm font-medium">Productos</h4>
        <div className="grid gap-2">
          {order.items.map((product) => (
            <div key={product.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-[14px] bg-[var(--surface-muted)] p-3 text-sm">
              <div>
                <p className="font-medium">{product.quantity} x {product.item_name}</p>
                {product.item_note ? <p className="mt-1 text-xs text-[var(--text-muted)]">Nota: {product.item_note}</p> : null}
              </div>
              <span className="font-medium">{formatPrice(product.subtotal)}</span>
            </div>
          ))}
        </div>
        {order.notes ? <p className="rounded-[14px] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">Nota: {order.notes}</p> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="grid gap-2 rounded-[20px] border border-[var(--line)] p-4">
          <h4 className="text-sm font-medium">Pago</h4>
          <InfoTile label="Estado" value={paymentStatusLabels[order.payment_status]} />
          <InfoTile label="Monto" value={formatPrice(order.total)} />
          {order.payment_proofs[0]?.proof_image_url ? (
            <a className="text-sm font-medium text-[var(--accent)] hover:underline" href={order.payment_proofs[0].proof_image_url} target="_blank" rel="noreferrer">
              Ver comprobante
            </a>
          ) : null}
        </section>

        {isDelivery ? (
          <section className="grid gap-2 rounded-[20px] border border-[var(--line)] p-4">
            <h4 className="text-sm font-medium">Delivery</h4>
            <InfoTile label="Zona" value={order.delivery_zone_name || "Sin zona"} />
            <InfoTile label="Repartidor" value={order.courier_name || "Sin asignar"} />
            <InfoTile label="Direccion" value={order.delivery_address || "Sin direccion"} />
          </section>
        ) : null}
      </div>

      {order.status_events?.length ? (
        <section className="grid gap-3 rounded-[20px] border border-[var(--line)] p-4">
          <h4 className="text-sm font-medium">Historial</h4>
          <div className="grid gap-2">
            {order.status_events.slice(0, 5).map((event) => (
              <div key={event.id} className="grid gap-1 rounded-[14px] bg-[var(--surface-muted)] p-3 text-sm">
                <p className="font-medium">{orderStatusLabels[event.status]}{event.payment_status ? ` · ${paymentStatusLabels[event.payment_status]}` : ""}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDateTime(event.created_at)}{event.created_by ? ` · ${event.created_by}` : ""}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function SummaryCard({ label, value, detail, tone = "gray" }: { label: string; value: number; detail: string; tone?: "gray" | "amber" | "blue" | "purple" | "green" | "red" }) {
  const dotClass = {
    gray: "bg-[var(--text-muted)]",
    amber: "bg-[#FF9500]",
    blue: "bg-[#007AFF]",
    purple: "bg-[#AF52DE]",
    green: "bg-[#34C759]",
    red: "bg-[#FF3B30]"
  }[tone];

  return (
    <article className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
      <p className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
        <span className={cn("h-2 w-2 rounded-full", dotClass)} />
        {label}
      </p>
      <p className="mt-2 text-3xl font-medium tracking-normal">{value}</p>
      <p className="mt-1 truncate text-xs text-[var(--text-muted)]">{detail}</p>
    </article>
  );
}

function OrderKanbanCard({ item, surface, onOpen }: { item: EnrichedOrder; surface: "orders" | "kitchen"; onOpen: () => void }) {
  const { order, client, alert, ageLabel, itemCount } = item;
  const nextAction = getNextAction(order, surface);

  return (
    <article className={cn("grid gap-3 rounded-[var(--radius-card)] border bg-[var(--surface)] p-3 shadow-panel", alert.borderClass)}>
      <button type="button" className="grid gap-2 text-left" onClick={onOpen}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">#{order.order_code}</span>
          <span className={cn("rounded-full px-2 py-1 text-[11px] font-medium", alert.className)}>{alert.label}</span>
        </div>
        <div>
          <p className="truncate text-sm font-medium">{client?.name || "Negocio"}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{order.customer_name || order.table_label || order.delivery_address || "Cliente sin nombre"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{ageLabel}</span>
          <span>{orderTypeLabels[order.order_type]}</span>
          <span>{itemCount} producto{itemCount === 1 ? "" : "s"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{formatPrice(order.total)}</span>
          <span className="truncate text-xs text-[var(--text-muted)]">{paymentStatusLabels[order.payment_status]}</span>
        </div>
        {order.notes ? <p className="line-clamp-2 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-2 text-xs text-[var(--text-muted)]">Nota: {order.notes}</p> : null}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="min-h-9 rounded-full bg-[var(--surface-muted)] px-3 text-xs font-medium" onClick={onOpen}>
          Ver
        </button>
        {nextAction ? <QuickStatusForm order={order} label={nextAction.label} orderStatus={nextAction.orderStatus} paymentStatus={nextAction.paymentStatus} /> : <WhatsAppButton order={order} />}
      </div>
    </article>
  );
}

function OrdersList({ items, surface, onOpen }: { items: EnrichedOrder[]; surface: "orders" | "kitchen"; onOpen: (orderId: string) => void }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-xs font-medium text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              {surface === "orders" ? <th className="px-4 py-3">Pago</th> : null}
              <th className="px-4 py-3">Tiempo</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ order, client, alert, ageLabel }) => (
              <tr key={order.id} className="border-t border-[var(--line)]">
                <td className="px-4 py-3">
                  <button type="button" className="font-medium hover:text-[var(--accent)]" onClick={() => onOpen(order.id)}>
                    #{order.order_code}
                  </button>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(order.created_at)}</p>
                </td>
                <td className="px-4 py-3">{client?.name || "Negocio"}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customer_name || order.table_label || "Sin nombre"}</p>
                  <p className="mt-1 max-w-[220px] truncate text-xs text-[var(--text-muted)]">{order.delivery_address || order.customer_phone || order.delivery_zone_name || "Sin detalle"}</p>
                </td>
                <td className="px-4 py-3">{orderTypeLabels[order.order_type]}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", alert.className)}>{orderStatusLabels[order.order_status]}</span>
                </td>
                {surface === "orders" ? <td className="px-4 py-3">{paymentStatusLabels[order.payment_status]}</td> : null}
                <td className="px-4 py-3">{ageLabel}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-medium" onClick={() => onOpen(order.id)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetailPanel({ item, surface, onClose }: { item: EnrichedOrder; surface: "orders" | "kitchen"; onClose: () => void }) {
  const { order, client, alert, ageLabel, itemCount } = item;
  const action = updateOrderStatusAction.bind(null, order.id);
  const statusOptions = getStatusOptions(order.order_type);
  const isDelivery = order.order_type === "delivery";

  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm">
      <aside className="ml-auto grid h-full w-full max-w-[560px] grid-rows-[auto_1fr] overflow-hidden border-l border-[var(--line)] bg-[var(--surface)] shadow-soft">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] p-5">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{client?.name || "Negocio"} - {orderTypeLabels[order.order_type]} - {ageLabel}</p>
            <h2 className="mt-1 text-2xl font-medium">Pedido #{order.order_code}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{order.customer_name || order.table_label || order.delivery_address || "Sin cliente registrado"}</p>
          </div>
          <button type="button" className="focus-ring inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--surface-muted)] px-4 text-sm font-medium text-[var(--text)]" onClick={onClose} aria-label="Cerrar detalle">
            <CloseIcon className="h-4 w-4" />
            Cerrar
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid gap-4">
            <section className="grid gap-3 rounded-[var(--radius-panel)] bg-[var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", alert.className)}>{alert.label}</span>
                <strong className="text-2xl font-medium">{formatPrice(order.total)}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <InfoTile label="Estado" value={orderStatusLabels[order.order_status]} />
                {surface === "orders" ? <InfoTile label="Pago" value={paymentStatusLabels[order.payment_status]} /> : null}
                <InfoTile label="Productos" value={String(itemCount)} />
                <InfoTile label="Creado" value={formatDateTime(order.created_at)} />
              </div>
            </section>

            <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
              <h3 className="text-sm font-medium">Acciones rapidas</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {surface === "orders" ? <QuickStatusForm order={order} label="Aceptar" orderStatus="payment_validated" paymentStatus={order.payment_status === "validated" ? "validated" : order.payment_status} onSubmitted={onClose} /> : null}
                <QuickStatusForm order={order} label={surface === "kitchen" ? "Empezar" : "Enviar a cocina"} orderStatus="preparing" onSubmitted={onClose} />
                <QuickStatusForm order={order} label="Marcar listo" orderStatus="ready" onSubmitted={onClose} />
                {isDelivery ? <QuickStatusForm order={order} label="En camino" orderStatus="on_the_way" onSubmitted={onClose} /> : null}
                <QuickStatusForm order={order} label="Entregado" orderStatus="delivered" onSubmitted={onClose} />
                {surface === "orders" ? <QuickStatusForm order={order} label="Cancelar" orderStatus="cancelled" onSubmitted={onClose} /> : null}
              </div>
              {surface === "orders" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <QuickStatusForm order={order} label="Validar pago" orderStatus={order.order_status} paymentStatus="validated" onSubmitted={onClose} />
                    <QuickStatusForm order={order} label="Rechazar pago" orderStatus={order.order_status} paymentStatus="rejected" onSubmitted={onClose} />
                  </div>
                  <WhatsAppButton order={order} className="min-h-10 rounded-full bg-[#25D366] px-3 text-sm font-medium text-white" />
                </>
              ) : null}
            </section>

            <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
              <h3 className="text-sm font-medium">Productos</h3>
              <div className="grid gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm">
                    <div>
                      <p className="font-medium">{item.quantity} x {item.item_name}</p>
                      {item.item_note ? <p className="mt-1 text-xs text-[var(--text-muted)]">Nota: {item.item_note}</p> : null}
                    </div>
                    <span className="font-medium">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              {order.notes ? <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">Nota del cliente: {order.notes}</p> : null}
            </section>

            {surface === "orders" ? (
              <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
                <h3 className="text-sm font-medium">Pago</h3>
                <div className="grid gap-2">
                  <InfoTile label="Estado de pago" value={paymentStatusLabels[order.payment_status]} />
                  <InfoTile label="Monto esperado" value={formatPrice(order.total)} />
                  {order.payment_proofs.length ? (
                    order.payment_proofs.map((proof) => (
                      <div key={proof.id} className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm">
                        <p className="font-medium">Comprobante {proof.status}</p>
                        {proof.operation_number ? <p className="mt-1 text-[var(--text-muted)]">Operacion: {proof.operation_number}</p> : null}
                        {proof.proof_image_url ? (
                          <a className="mt-2 inline-flex text-[var(--accent)] hover:underline" href={proof.proof_image_url} target="_blank" rel="noreferrer">
                            Ver captura
                          </a>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">Sin comprobante registrado.</p>
                  )}
                </div>
              </section>
            ) : null}

            {isDelivery ? (
              <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
                <h3 className="text-sm font-medium">Delivery</h3>
                <div className="grid gap-2 text-sm">
                  <InfoTile label="Direccion" value={order.delivery_address || "Sin direccion"} />
                  <InfoTile label="Referencia" value={order.delivery_reference || "Sin referencia"} />
                  <InfoTile label="Zona" value={order.delivery_zone_name || "Sin zona"} />
                  <InfoTile label="Repartidor" value={order.courier_name || "Sin asignar"} />
                  <InfoTile label="Telefono" value={order.courier_phone || "Sin telefono"} />
                </div>
              </section>
            ) : null}

            <form action={action} onSubmit={onClose} className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
              <h3 className="text-sm font-medium">Editar seguimiento</h3>
              <div className="grid gap-3 sm:grid-cols-2">
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
                {surface === "orders" ? (
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
                ) : (
                  <input type="hidden" name="payment_status" value={order.payment_status} />
                )}
              </div>

              {isDelivery ? (
                <div className="grid gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 sm:grid-cols-3">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Repartidor</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="courier_name" defaultValue={order.courier_name || ""} placeholder="Nombre" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Telefono</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="courier_phone" defaultValue={order.courier_phone || ""} placeholder="+51 999 888 777" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Tiempo</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="estimated_delivery_time" defaultValue={order.estimated_delivery_time || ""} placeholder="20 min" />
                  </label>
                </div>
              ) : (
                <>
                  <input type="hidden" name="courier_name" value={order.courier_name || ""} />
                  <input type="hidden" name="courier_phone" value={order.courier_phone || ""} />
                  <input type="hidden" name="estimated_delivery_time" value={order.estimated_delivery_time || ""} />
                </>
              )}

              <label className="grid gap-2 text-sm">
                <span className="font-medium">Nota visible en seguimiento</span>
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="tracking_note" defaultValue={order.tracking_note || ""} placeholder="Tu pedido ya esta saliendo del local." />
              </label>

              <button className="sticky bottom-0 min-h-11 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-white shadow-panel" type="submit">
                Guardar cambios
              </button>
            </form>

            {order.status_events?.length ? (
              <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] p-4">
                <h3 className="text-sm font-medium">Historial</h3>
                <div className="grid gap-2">
                  {order.status_events.map((event) => (
                    <div key={event.id} className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm">
                      <p className="font-medium">{orderStatusLabels[event.status]}{event.payment_status ? ` - ${paymentStatusLabels[event.payment_status]}` : ""}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(event.created_at)}{event.created_by ? ` - ${event.created_by}` : ""}</p>
                      {event.note ? <p className="mt-1 text-xs text-[var(--text-muted)]">{event.note}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">
      <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function QuickStatusForm({ order, label, orderStatus, paymentStatus, onSubmitted }: { order: OrderWithDetails; label: string; orderStatus: OrderStatus; paymentStatus?: PaymentStatus; onSubmitted?: () => void }) {
  const action = updateOrderStatusAction.bind(null, order.id);

  return (
    <form action={action} onSubmit={onSubmitted}>
      <input type="hidden" name="order_status" value={orderStatus} />
      <input type="hidden" name="payment_status" value={paymentStatus || order.payment_status} />
      <input type="hidden" name="courier_name" value={order.courier_name || ""} />
      <input type="hidden" name="courier_phone" value={order.courier_phone || ""} />
      <input type="hidden" name="estimated_delivery_time" value={order.estimated_delivery_time || ""} />
      <input type="hidden" name="tracking_note" value={order.tracking_note || ""} />
      <button type="submit" className="min-h-9 w-full rounded-full bg-[var(--accent)] px-3 text-xs font-medium text-white transition active:scale-[0.97]">
        {label}
      </button>
    </form>
  );
}

function suppressOrderDrawerOnce() {
  try {
    window.sessionStorage.setItem("simi-suppress-order-drawer", String(Date.now()));
  } catch {
    // La UI puede seguir funcionando aunque storage no este disponible.
  }
}

function shouldSuppressOrderDrawer() {
  try {
    const value = window.sessionStorage.getItem("simi-suppress-order-drawer");
    if (!value) return false;
    return Date.now() - Number(value) < 10000;
  } catch {
    return false;
  }
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppButton({ order, className }: { order: OrderWithDetails; className?: string }) {
  if (!order.customer_phone) {
    return (
      <button type="button" className={cn("min-h-9 rounded-full bg-[var(--surface-muted)] px-3 text-xs font-medium text-[var(--text-muted)]", className)} disabled>
        WhatsApp
      </button>
    );
  }

  return (
    <a className={cn("inline-flex min-h-9 items-center justify-center rounded-full bg-[#25D366] px-3 text-xs font-medium text-white", className)} href={buildWhatsappUrl(order.customer_phone, `Hola, te escribimos por tu pedido #${order.order_code}.`)} target="_blank" rel="noreferrer">
      WhatsApp
    </a>
  );
}

function getBoardGroup(order: OrderWithDetails): Exclude<BoardGroup, "all"> {
  if (order.order_status === "cancelled" || order.payment_status === "rejected") return "issues";
  if (order.order_status === "delivered") return "closed";
  if (order.payment_status === "proof_submitted" || order.order_status === "payment_submitted") return "validate";
  if (order.order_status === "payment_pending" || order.payment_status === "pending_payment") return "payment";
  if (order.order_status === "preparing") return "kitchen";
  if (order.order_status === "ready") return "ready";
  if (["handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) return "delivery";
  if (order.order_status === "payment_validated") return "confirmed";
  return "new";
}

function getNextAction(order: OrderWithDetails, surface: "orders" | "kitchen"): { label: string; orderStatus: OrderStatus; paymentStatus?: PaymentStatus } | null {
  if (surface === "kitchen") {
    if (order.order_status === "payment_validated") return { label: "Empezar", orderStatus: "preparing" };
    if (order.order_status === "preparing") return { label: "Listo", orderStatus: "ready" };
    if (order.order_status === "ready") return { label: "Cerrar", orderStatus: "delivered" };
    return null;
  }

  if (order.payment_status === "proof_submitted") return { label: "Validar", orderStatus: "payment_validated", paymentStatus: "validated" };
  if (order.order_status === "new" || order.order_status === "received") return { label: "Aceptar", orderStatus: "payment_validated" };
  if (order.order_status === "payment_validated") return { label: "Cocina", orderStatus: "preparing" };
  if (order.order_status === "preparing") return { label: "Listo", orderStatus: "ready" };
  if (order.order_status === "ready" && order.order_type === "delivery") return { label: "Ruta", orderStatus: "on_the_way" };
  if (order.order_status === "ready") return { label: "Entregar", orderStatus: "delivered" };
  if (["handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) return { label: "Entregar", orderStatus: "delivered" };
  return null;
}

function getSmartActions(order: OrderWithDetails): Array<{ label: string; orderStatus: OrderStatus; paymentStatus?: PaymentStatus }> {
  if (order.order_status === "cancelled") return [{ label: "Ver resumen", orderStatus: order.order_status, paymentStatus: order.payment_status }];
  if (order.payment_status === "proof_submitted") {
    return [
      { label: "Validar pago", orderStatus: "payment_validated", paymentStatus: "validated" },
      { label: "Rechazar pago", orderStatus: order.order_status, paymentStatus: "rejected" }
    ];
  }
  if (order.payment_status === "pending_payment" || order.order_status === "payment_pending") {
    return [
      { label: "Recordar pago", orderStatus: order.order_status, paymentStatus: order.payment_status },
      { label: "Cancelar", orderStatus: "cancelled" }
    ];
  }
  if (order.order_status === "new" || order.order_status === "received") {
    return [
      { label: "Aceptar pedido", orderStatus: "payment_validated", paymentStatus: order.payment_status },
      { label: "Rechazar", orderStatus: "cancelled" }
    ];
  }
  if (order.order_status === "payment_validated") return [{ label: "Enviar a cocina", orderStatus: "preparing" }];
  if (order.order_status === "preparing") return [{ label: "Marcar listo", orderStatus: "ready" }];
  if (order.order_status === "ready" && order.order_type === "delivery") return [{ label: "Asignar delivery", orderStatus: "ready" }, { label: "En ruta", orderStatus: "on_the_way" }];
  if (order.order_status === "ready") return [{ label: "Marcar entregado", orderStatus: "delivered" }];
  if (["handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) return [{ label: "Marcar entregado", orderStatus: "delivered" }];
  if (order.order_status === "delivered") return [{ label: "Ver resumen", orderStatus: "delivered" }];
  return [{ label: "Actualizar", orderStatus: order.order_status }];
}

function getOrderAlert(order: OrderWithDetails) {
  const ageMinutes = getAgeMinutes(order.created_at);

  if (!["delivered", "cancelled"].includes(order.order_status) && ageMinutes > 180) {
    return {
      label: "Vencido",
      level: "critical" as const,
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200",
      borderClass: "border-red-200 dark:border-red-900/70"
    };
  }

  if (order.order_status === "cancelled" || order.payment_status === "rejected") {
    return {
      label: "Problema",
      level: "critical" as const,
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200",
      borderClass: "border-red-200 dark:border-red-900/70"
    };
  }

  if (order.payment_status === "proof_submitted") {
    return {
      label: "Validar pago",
      level: "warning" as const,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
      borderClass: "border-amber-200 dark:border-amber-900/70"
    };
  }

  if ((order.order_status === "new" || order.order_status === "received") && ageMinutes >= 10) {
    return {
      label: "Sin atender",
      level: "critical" as const,
      className: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-200",
      borderClass: "border-red-200 dark:border-red-900/70"
    };
  }

  if ((order.order_status === "new" || order.order_status === "received") && ageMinutes >= 5) {
    return {
      label: "Atender pronto",
      level: "warning" as const,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
      borderClass: "border-amber-200 dark:border-amber-900/70"
    };
  }

  if (order.order_type === "delivery" && !order.courier_name && ["ready", "handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) {
    return {
      label: "Sin repartidor",
      level: "warning" as const,
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
      borderClass: "border-amber-200 dark:border-amber-900/70"
    };
  }

  if (order.order_status === "delivered") {
    return {
      label: "Entregado",
      level: "normal" as const,
      className: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-200",
      borderClass: "border-[var(--line)]"
    };
  }

  return {
    label: "En curso",
    level: "normal" as const,
    className: "bg-[var(--surface-muted)] text-[var(--text-muted)]",
    borderClass: "border-[var(--line)]"
  };
}

function viewButtonClass(isActive: boolean) {
  return cn("rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.97]", isActive ? "bg-[var(--accent)] text-white shadow-[0_10px_22px_rgba(0,122,255,0.18)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]");
}

function getAgeMinutes(date: string) {
  return Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
}

function formatAgeLabel(date: string) {
  const minutes = getAgeMinutes(date);
  if (minutes <= 1) return "Ahora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Hace 1 dia" : `Hace ${days} dias`;
}

function getOrderPriority(order: OrderWithDetails) {
  const ageMinutes = getAgeMinutes(order.created_at);
  if (order.order_status === "cancelled" || order.payment_status === "rejected") return 95;
  if (ageMinutes > 180 && order.order_status !== "delivered") return 5;
  if (order.payment_status === "proof_submitted" || order.order_status === "payment_submitted") return 10;
  if ((order.order_status === "new" || order.order_status === "received") && ageMinutes >= 10) return 15;
  if (order.order_status === "new" || order.order_status === "received") return 20;
  if (order.order_type === "delivery" && order.order_status === "ready" && !order.courier_name) return 25;
  if (order.order_status === "preparing" && ageMinutes > 45) return 30;
  if (order.order_status === "ready") return 35;
  if (["handed_to_courier", "on_the_way", "arriving"].includes(order.order_status)) return 45;
  if (order.order_status === "delivered") return 100;
  return 60;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

type EnrichedOrder = {
  order: OrderWithDetails;
  client: Client | undefined;
  boardGroup: Exclude<BoardGroup, "all">;
  alert: ReturnType<typeof getOrderAlert>;
  ageMinutes: number;
  ageLabel: string;
  priority: number;
  itemCount: number;
};
