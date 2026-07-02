"use client";

import { useMemo, useState } from "react";
import { createManualOrderAction } from "@/lib/actions";
import { cn, formatPrice } from "@/lib/utils";
import type { Client, ClientDeliveryZone, ClientTable, MenuCategory, MenuItem, OrderType, PaymentStatus } from "@/types/menu";

type ManualOrderDrawerProps = {
  clients: Client[];
  categories: MenuCategory[];
  items: MenuItem[];
  tables: ClientTable[];
  deliveryZones: ClientDeliveryZone[];
  defaultClientId?: string;
};

type CartItem = {
  item: MenuItem;
  quantity: number;
  note: string;
};

const orderTypes: Array<{ value: OrderType; label: string; helper: string }> = [
  { value: "dine_in", label: "Mesa", helper: "Consumo en salon" },
  { value: "pickup", label: "Recojo", helper: "Pide y pasa por tienda" },
  { value: "delivery", label: "Delivery", helper: "Enviar a domicilio" }
];

const paymentStatuses: Array<{ value: PaymentStatus; label: string }> = [
  { value: "pending_payment", label: "Pendiente" },
  { value: "validated", label: "Pagado" },
  { value: "proof_submitted", label: "Por validar" }
];

export function ManualOrderDrawer({ clients, categories, items, tables, deliveryZones, defaultClientId }: ManualOrderDrawerProps) {
  const firstClientId = defaultClientId || clients[0]?.id || "";
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(firstClientId);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending_payment");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [deliveryZoneId, setDeliveryZoneId] = useState("");

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.client_id === selectedClientId),
    [categories, selectedClientId]
  );
  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (item.client_id !== selectedClientId) return false;
      if (selectedCategoryId !== "all" && item.category_id !== selectedCategoryId) return false;
      if (!term) return true;
      return `${item.name} ${item.description || ""}`.toLowerCase().includes(term);
    });
  }, [items, search, selectedCategoryId, selectedClientId]);
  const visibleTables = useMemo(() => tables.filter((table) => table.client_id === selectedClientId), [tables, selectedClientId]);
  const visibleZones = useMemo(() => deliveryZones.filter((zone) => zone.client_id === selectedClientId), [deliveryZones, selectedClientId]);
  const currentClient = clients.find((client) => client.id === selectedClientId);
  const currentOrderType = orderTypes.find((type) => type.value === orderType);
  const selectedZone = visibleZones.find((zone) => zone.id === deliveryZoneId);
  const cartItems = Object.values(cart).filter((entry) => entry.item.client_id === selectedClientId);
  const subtotal = cartItems.reduce((sum, entry) => sum + Number(entry.item.price || 0) * entry.quantity, 0);
  const deliveryFee = orderType === "delivery" ? Number(selectedZone?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const itemsJson = JSON.stringify(cartItems.map((entry) => ({ menuItemId: entry.item.id, quantity: entry.quantity, note: entry.note })));

  function resetForClient(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedCategoryId("all");
    setDeliveryZoneId("");
    setCart({});
  }

  function addItem(item: MenuItem) {
    if (!item.is_available) return;
    setCart((current) => ({
      ...current,
      [item.id]: {
        item,
        quantity: (current[item.id]?.quantity || 0) + 1,
        note: current[item.id]?.note || ""
      }
    }));
  }

  function updateQuantity(itemId: string, quantity: number) {
    setCart((current) => {
      const entry = current[itemId];
      if (!entry) return current;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[itemId];
        return next;
      }
      return { ...current, [itemId]: { ...entry, quantity: Math.min(99, quantity) } };
    });
  }

  function updateNote(itemId: string, note: string) {
    setCart((current) => {
      const entry = current[itemId];
      if (!entry) return current;
      return { ...current, [itemId]: { ...entry, note } };
    });
  }

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-5 py-2 text-sm font-medium text-white shadow-panel">
        <span className="text-lg leading-none">+</span>
        Nuevo pedido
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-0 backdrop-blur-md md:p-3">
          <div className="absolute inset-0 flex w-full flex-col overflow-hidden bg-[var(--background)] shadow-soft md:inset-y-3 md:right-3 md:left-auto md:max-w-6xl md:rounded-[28px] md:border md:border-white/40">
            <div className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--simi-carbon-parrilla)] px-5 py-5 text-white">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[var(--accent)]/55 via-[var(--simi-aji-amarillo)]/15 to-transparent" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-white shadow-panel">
                    <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="h-full w-full object-cover" />
                  </span>
                  <div>
                    <p className="text-sm text-white/70">Venta manual</p>
                    <h2 className="text-2xl font-medium">Nuevo pedido</h2>
                    <p className="mt-1 max-w-2xl text-sm text-white/72">
                      {currentClient?.name || "Selecciona un negocio"} - {currentOrderType?.label || "Mesa"} - {cartItems.length} producto{cartItems.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} className="focus-ring rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 hover:bg-white/18">
                  Cerrar
                </button>
              </div>
            </div>

            <form action={createManualOrderAction} className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[1fr_390px]">
              <input type="hidden" name="client_id" value={selectedClientId} />
              <input type="hidden" name="order_type" value={orderType} />
              <input type="hidden" name="payment_status" value={paymentStatus} />
              <input type="hidden" name="items_json" value={itemsJson} />
              <input type="hidden" name="delivery_zone_id" value={deliveryZoneId} />

              <div className="min-h-0 overflow-y-auto p-4 md:p-5">
                <div className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
                  <div className="grid gap-3 md:grid-cols-[1fr_1.2fr]">
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Negocio</span>
                      <select value={selectedClientId} onChange={(event) => resetForClient(event.target.value)} disabled={Boolean(defaultClientId)} className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3">
                        {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                      </select>
                    </label>
                    <div className="grid gap-2">
                      <span className="text-sm text-[var(--text-muted)]">Tipo de venta</span>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {orderTypes.map((type) => (
                          <button key={type.value} type="button" onClick={() => setOrderType(type.value)} className={cn("rounded-[18px] border px-3 py-3 text-left text-sm transition hover:-translate-y-0.5", orderType === type.value ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)] shadow-panel" : "border-[var(--line)] bg-[var(--background)]")}>
                            <span className="block font-medium">{type.label}</span>
                            <span className="mt-1 block text-xs text-[var(--text-muted)]">{type.helper}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Cliente</span>
                      <input name="customer_name" placeholder={orderType === "dine_in" ? "Opcional" : "Nombre del cliente"} className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Telefono</span>
                      <input name="customer_phone" placeholder="WhatsApp" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Mozo / responsable</span>
                      <input name="waiter_name" placeholder="Opcional" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                    </label>
                  </div>

                  {orderType === "dine_in" ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-sm">
                        <span className="text-[var(--text-muted)]">Mesa registrada</span>
                        <select name="table_id" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3">
                          <option value="">Elegir mesa</option>
                          {visibleTables.map((table) => <option key={table.id} value={table.id}>{table.label || `Mesa ${table.table_number}`}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm">
                        <span className="text-[var(--text-muted)]">Mesa libre</span>
                        <input name="table_label" placeholder="Ej. Barra 2" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                      </label>
                      <label className="grid gap-2 text-sm">
                        <span className="text-[var(--text-muted)]">Personas</span>
                        <input name="party_size" type="number" min="1" max="99" placeholder="2" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                      </label>
                    </div>
                  ) : null}

                  {orderType === "pickup" ? (
                    <label className="grid gap-2 text-sm">
                      <span className="text-[var(--text-muted)]">Hora de recojo</span>
                      <input name="pickup_time" placeholder="Ej. 8:30 pm" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                    </label>
                  ) : null}

                  {orderType === "delivery" ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-sm md:col-span-2">
                        <span className="text-[var(--text-muted)]">Direccion</span>
                        <input name="delivery_address" placeholder="Direccion completa" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                      </label>
                      <label className="grid gap-2 text-sm">
                        <span className="text-[var(--text-muted)]">Zona</span>
                        <select value={deliveryZoneId} onChange={(event) => setDeliveryZoneId(event.target.value)} className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3">
                          <option value="">Sin zona</option>
                          {visibleZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} - {formatPrice(zone.delivery_fee)}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-2 text-sm md:col-span-3">
                        <span className="text-[var(--text-muted)]">Referencia</span>
                        <input name="delivery_reference" placeholder="Piso, color de puerta, indicaciones" className="focus-ring h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3" />
                      </label>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <label className="block">
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar plato, bebida o combo" className="focus-ring h-12 w-full rounded-full border border-[var(--line)] bg-[var(--background)] px-4 text-sm" />
                    </label>
                    <select value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)} className="focus-ring h-12 rounded-full border border-[var(--line)] bg-[var(--background)] px-4 text-sm">
                      <option value="all">Todas las categorias</option>
                      {visibleCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleItems.map((item) => (
                      <button key={item.id} type="button" onClick={() => addItem(item)} disabled={!item.is_available} className={cn("group grid min-h-[142px] gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--background)] p-3 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface)] hover:shadow-panel", !item.is_available && "cursor-not-allowed opacity-50")}>
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="line-clamp-2 text-sm font-medium">{item.name}</span>
                            <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{item.description || "Producto de carta"}</span>
                          </span>
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-lg font-medium text-white shadow-panel transition group-hover:scale-105">+</span>
                        </span>
                        <span className="mt-auto flex items-center justify-between gap-2">
                          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--text)]">{item.is_available ? "Disponible" : "Agotado"}</span>
                          <span className="text-base font-medium text-[var(--accent-strong)] dark:text-[var(--simi-aji-amarillo)]">{formatPrice(item.price)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  {visibleItems.length === 0 ? <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">No hay productos disponibles con ese filtro.</p> : null}
                </div>
              </div>

              <aside className="min-h-0 overflow-y-auto border-t border-[var(--line)] bg-[var(--surface)] p-4 lg:border-l lg:border-t-0 lg:p-5">
                <div className="sticky top-0 grid gap-4">
                  <div className="rounded-[24px] bg-[var(--simi-carbon-parrilla)] p-4 text-white shadow-panel">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-white/65">Resumen</p>
                        <h3 className="mt-1 text-xl font-medium">Tu pedido</h3>
                      </div>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/80">{cartItems.length} item{cartItems.length === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <span className="text-sm text-white/65">Total a cobrar</span>
                      <span className="text-3xl font-medium text-[var(--simi-aji-amarillo)]">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {cartItems.length ? cartItems.map((entry) => (
                      <div key={entry.item.id} className="rounded-[18px] border border-[var(--line)] bg-[var(--background)] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{entry.item.name}</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{formatPrice(entry.item.price)} c/u</p>
                          </div>
                          <div className="flex items-center rounded-full bg-[var(--surface)] shadow-panel">
                            <button type="button" onClick={() => updateQuantity(entry.item.id, entry.quantity - 1)} className="focus-ring h-8 w-8 rounded-full text-sm text-[var(--text-muted)]">-</button>
                            <span className="w-8 text-center text-sm font-medium">{entry.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(entry.item.id, entry.quantity + 1)} className="focus-ring h-8 w-8 rounded-full text-sm text-[var(--accent)]">+</button>
                          </div>
                        </div>
                        <input value={entry.note} onChange={(event) => updateNote(entry.item.id, event.target.value)} placeholder="Nota del producto" className="focus-ring mt-3 h-9 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-xs" />
                      </div>
                    )) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Agrega productos desde la carta.</p>}
                  </div>

                  <label className="grid gap-2 text-sm">
                    <span className="text-[var(--text-muted)]">Notas internas</span>
                    <textarea name="notes" rows={3} placeholder="Ej. sin aji, cliente espera en caja" className="focus-ring resize-none rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--background)] px-3 py-2" />
                  </label>

                  <input type="hidden" name="manual_channel" value={orderType === "dine_in" ? "salon" : orderType} />
                  <div className="grid gap-2">
                    <span className="text-sm text-[var(--text-muted)]">Pago</span>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentStatuses.map((status) => (
                        <button key={status.value} type="button" onClick={() => setPaymentStatus(status.value)} className={cn("rounded-full px-3 py-2 text-xs font-medium", paymentStatus === status.value ? "bg-[var(--accent)] text-white shadow-panel" : "bg-[var(--background)] text-[var(--text-muted)]")}>
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] bg-[var(--background)] p-4 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                    <div className="mt-2 flex justify-between"><span>Delivery</span><span>{formatPrice(deliveryFee)}</span></div>
                    <div className="mt-3 flex justify-between border-t border-[var(--line)] pt-3 text-lg font-medium"><span>Total</span><span className="text-[var(--accent-strong)] dark:text-[var(--simi-aji-amarillo)]">{formatPrice(total)}</span></div>
                  </div>

                  <label className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--background)] p-3 text-sm">
                    <input name="send_to_kitchen" type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
                    Enviar directo a cocina
                  </label>

                  <button type="submit" disabled={!selectedClientId || cartItems.length === 0} className="focus-ring min-h-12 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-5 py-3 text-sm font-medium text-white shadow-panel disabled:cursor-not-allowed disabled:opacity-50">
                    Crear pedido manual
                  </button>
                </div>
              </aside>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
