"use client";

import { useMemo, useState } from "react";
import { CategoryTabs } from "@/components/public-menu/CategoryTabs";
import { CategorySection } from "@/components/public-menu/CategorySection";
import { EmptyMenuState } from "@/components/public-menu/EmptyMenuState";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import { PromoBanner } from "@/components/public-menu/PromoBanner";
import { Button } from "@/components/shared/Button";
import { buildWhatsappUrl, formatPrice } from "@/lib/utils";
import type { CategoryWithItems, Client, ClientDeliveryZone, ClientTable, MenuItem, OrderType, PaymentMethod, Promotion } from "@/types/menu";

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
};

type CreatedOrder = {
  id: string;
  order_code: string;
  total: number;
};

type PublicMenuExperienceProps = {
  client: Client;
  categories: CategoryWithItems[];
  tables: ClientTable[];
  deliveryZones: ClientDeliveryZone[];
  promotions: Promotion[];
  paymentMethods: PaymentMethod[];
  initialTableNumber?: string;
};

const orderTypeLabels: Record<OrderType, string> = {
  dine_in: "Mesa",
  pickup: "Recojo",
  delivery: "Delivery"
};

export function PublicMenuExperience({ client, categories, tables, deliveryZones, promotions, paymentMethods, initialTableNumber }: PublicMenuExperienceProps) {
  const initialTable = tables.find((table) => table.table_number === initialTableNumber || table.label.toLowerCase() === `mesa ${initialTableNumber}`.toLowerCase());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"menu" | "checkout" | "payment">("menu");
  const [orderType, setOrderType] = useState<OrderType>(initialTable ? "dine_in" : "pickup");
  const [selectedTableId, setSelectedTableId] = useState(initialTable?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryReference, setDeliveryReference] = useState("");
  const [deliveryZoneId, setDeliveryZoneId] = useState(deliveryZones[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [operationNumber, setOperationNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flatItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);
  const promoItem = useMemo(() => flatItems.find((item) => item.id === client.promo_banner_item_id) || null, [client.promo_banner_item_id, flatItems]);
  const visibleCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => `${item.name} ${item.description || ""}`.toLowerCase().includes(query))
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, searchQuery]);
  const hasProducts = visibleCategories.some((category) => category.items.length > 0);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const selectedDeliveryZone = deliveryZones.find((zone) => zone.id === deliveryZoneId);
  const deliveryFee = orderType === "delivery" ? Number(selectedDeliveryZone?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const yapeMethod = paymentMethods.find((method) => method.method_type === "yape");

  function addItem(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.menuItemId === item.id);
      if (existing) {
        return current.map((cartItem) => (cartItem.menuItemId === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem));
      }
      return [...current, { menuItemId: item.id, name: item.name, price: Number(item.price), quantity: 1, note: "" }];
    });
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    setCart((current) => current.map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: Math.max(1, quantity) } : item)));
  }

  function removeItem(menuItemId: string) {
    setCart((current) => current.filter((item) => item.menuItemId !== menuItemId));
  }

  function browseMenu() {
    document.getElementById("menu-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function createOrder() {
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          orderType,
          tableId: orderType === "dine_in" ? selectedTableId || null : null,
          tableLabel: orderType === "dine_in" ? selectedTable?.label || initialTableNumber || "" : null,
          customerName,
          customerPhone,
          pickupTime,
          deliveryAddress,
          deliveryReference,
          deliveryZoneId: orderType === "delivery" ? deliveryZoneId || null : null,
          notes,
          items: cart.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity, note: item.note }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo crear el pedido.");

      setCreatedOrder(data.order);
      setWhatsappUrl(data.whatsappUrl);
      setStatusUrl(data.statusUrl || `/pedido/${data.order.id}`);
      setStep("payment");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el pedido.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitProof() {
    if (!createdOrder) return;
    setMessage("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("operation_number", operationNumber);
      if (proofFile) formData.set("proof_image", proofFile);

      const response = await fetch(`/api/public/orders/${createdOrder.id}/proof`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el comprobante.");
      setMessage("Comprobante enviado. El negocio validará el pago en Yape.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el comprobante.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-32">
      <MenuHeader client={client} />
      <div id="menu-content" className="mx-auto grid max-w-[1320px] gap-6 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:px-8">
        <div className="grid min-w-0 gap-6">
        <div className="grid gap-3">
          <div className="flex gap-2">
            <input
              className="focus-ring min-h-12 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm shadow-panel"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar locales y platos"
            />
            <a href={`/reservar/${client.slug}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text)] shadow-panel">
              Reservar
            </a>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button type="button" onClick={browseMenu} className="shrink-0 rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium">Menu</button>
            <button type="button" onClick={() => setSearchQuery("pollo")} className="shrink-0 rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium">Pollos</button>
            <button type="button" onClick={() => setSearchQuery("combo")} className="shrink-0 rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium">Combos</button>
            <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium">Todos</button>
          </div>
        </div>

        <PromoBanner client={client} promoItem={promoItem} onAddPromo={addItem} onBrowseMenu={browseMenu} />

        {step === "menu" && promotions.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="px-1 text-sm font-medium text-[var(--text-muted)]">Promociones</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {promotions.slice(0, 3).map((promotion) => (
                <article key={promotion.id} className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium">{promotion.title}</h3>
                      {promotion.description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{promotion.description}</p> : null}
                    </div>
                    {promotion.coupon_code ? <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium">{promotion.coupon_code}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {step === "menu" ? (
          <>
            <CategoryTabs categories={visibleCategories} accentColor={client.primary_color} />
            {hasProducts ? visibleCategories.map((category) => <CategorySection key={category.id} category={category} accentColor={client.primary_color} onAdd={addItem} />) : <EmptyMenuState client={client} />}
          </>
        ) : null}

        {step === "checkout" ? (
          <section className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
            <div>
              <h2 className="text-xl font-medium">Confirma tu pedido</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Primero creamos el pedido. Luego te mostramos Yape.</p>
            </div>

            <div className="grid gap-3 rounded-[20px] bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Tu pedido</h3>
                <span className="text-sm text-[var(--text-muted)]">{itemCount} productos</span>
              </div>
              {cart.map((item) => (
                <div key={item.menuItemId} className="grid gap-2 rounded-[var(--radius-card)] bg-[var(--surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-8 w-8 rounded-full bg-[var(--surface-muted)] text-base" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button type="button" className="h-8 w-8 rounded-full bg-[var(--surface-muted)] text-base" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="focus-ring min-h-10 flex-1 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm"
                      value={item.note}
                      onChange={(event) =>
                        setCart((current) => current.map((cartItem) => (cartItem.menuItemId === item.menuItemId ? { ...cartItem, note: event.target.value } : cartItem)))
                      }
                      placeholder="Nota para este producto"
                    />
                    <button type="button" className="text-xs font-medium text-red-600" onClick={() => removeItem(item.menuItemId)}>
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-3">
                <span className="text-sm text-[var(--text-muted)]">Total</span>
                <strong className="text-lg font-medium">{formatPrice(total)}</strong>
              </div>
              {orderType === "delivery" && deliveryFee > 0 ? (
                <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
                  <span>Delivery</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-full bg-[var(--surface-muted)] p-1">
              {(Object.keys(orderTypeLabels) as OrderType[]).map((type) => (
                <button key={type} type="button" onClick={() => setOrderType(type)} className={`rounded-full px-3 py-2 text-sm font-medium ${orderType === type ? "bg-[var(--surface)] shadow-panel" : "text-[var(--text-muted)]"}`}>
                  {orderTypeLabels[type]}
                </button>
              ))}
            </div>

            {orderType === "dine_in" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Mesa</span>
                <select className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)}>
                  <option value="">Selecciona una mesa</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Nombre</span>
              <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Carlos" />
            </label>

            {orderType !== "dine_in" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Teléfono</span>
                <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="+51 999 999 999" />
              </label>
            ) : null}

            {orderType === "pickup" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Hora aproximada de recojo</span>
                <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} placeholder="8:30 pm" />
              </label>
            ) : null}

            {orderType === "delivery" ? (
              <>
                {deliveryZones.length > 0 ? (
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Zona de delivery</span>
                    <select className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={deliveryZoneId} onChange={(event) => setDeliveryZoneId(event.target.value)}>
                      <option value="">Selecciona tu zona</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name} - {formatPrice(zone.delivery_fee)}{zone.estimated_time ? ` - ${zone.estimated_time}` : ""}
                        </option>
                      ))}
                    </select>
                    {selectedDeliveryZone?.minimum_order ? <span className="text-xs text-[var(--text-muted)]">Pedido minimo para esta zona: {formatPrice(selectedDeliveryZone.minimum_order)}.</span> : null}
                  </label>
                ) : null}
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Dirección</span>
                  <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Av. Principal 123" />
                </label>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Referencia</span>
                  <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={deliveryReference} onChange={(event) => setDeliveryReference(event.target.value)} placeholder="Portón negro, piso 2" />
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Nota</span>
              <textarea className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Sin ají, con cremas aparte..." />
            </label>

            {message ? <p className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{message}</p> : null}

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep("menu")} className="w-full">
                Volver
              </Button>
              <Button type="button" onClick={createOrder} disabled={isSubmitting || cart.length === 0} className="w-full">
                {isSubmitting ? "Creando..." : "Confirmar pedido"}
              </Button>
            </div>
          </section>
        ) : null}

        {step === "payment" && createdOrder ? (
          <section className="grid gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Pedido #{createdOrder.order_code}</p>
              <h2 className="mt-1 text-2xl font-medium">Total a pagar: {formatPrice(createdOrder.total)}</h2>
            </div>
            <div className="rounded-[20px] bg-[var(--surface-muted)] p-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">Paga al Yape del negocio</p>
              {yapeMethod?.phone_number || client.yape_number ? <p className="mt-1 text-xl font-medium">{yapeMethod?.phone_number || client.yape_number}</p> : <p className="mt-1 text-sm text-[var(--text-muted)]">Este negocio aun no registro numero Yape.</p>}
              {yapeMethod?.qr_url || client.yape_qr_url ? <img alt="QR Yape" src={yapeMethod?.qr_url || client.yape_qr_url || ""} className="mx-auto mt-4 max-h-64 rounded-[20px] bg-white p-2" /> : null}
            </div>
            <p className="text-sm text-[var(--text-muted)]">Después de pagar, sube tu captura o escribe el número de operación.</p>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Número de operación</span>
              <input className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" value={operationNumber} onChange={(event) => setOperationNumber(event.target.value)} placeholder="458921" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Captura del comprobante</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="text-sm text-[var(--text-muted)]" onChange={(event) => setProofFile(event.target.files?.[0] || null)} />
            </label>
            {message ? <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">{message}</p> : null}
            <Button type="button" onClick={submitProof} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar comprobante"}
            </Button>
            {statusUrl ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--surface-muted)] px-4 text-sm font-medium text-[var(--text)]" href={statusUrl}>
                Ver estado del pedido
              </a>
            ) : null}
            {whatsappUrl ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white" href={whatsappUrl} target="_blank" rel="noreferrer">
                Enviar pedido por WhatsApp
              </a>
            ) : null}
          </section>
        ) : null}
        </div>

        <aside className="sticky top-6 hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft lg:grid lg:gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Tu pedido</p>
            <h2 className="mt-1 text-xl font-medium">{itemCount ? `${itemCount} producto${itemCount === 1 ? "" : "s"}` : "Listo para ordenar"}</h2>
          </div>

          {cart.length > 0 ? (
            <div className="grid gap-2 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">
              {cart.slice(0, 4).map((item) => (
                <div key={item.menuItemId} className="flex items-start justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{item.quantity} x </span>
                    <span>{item.name}</span>
                  </span>
                  <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              {cart.length > 4 ? <p className="text-xs text-[var(--text-muted)]">+ {cart.length - 4} productos mas</p> : null}
              <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-3">
                <span className="text-sm text-[var(--text-muted)]">Total</span>
                <span className="text-lg font-medium">{formatPrice(total)}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm leading-5 text-[var(--text-muted)]">Agrega platos desde la carta o consulta directamente por WhatsApp.</div>
          )}

          {cart.length > 0 ? (
            <Button type="button" onClick={() => setStep("checkout")} className="w-full">
              Ver pedido
            </Button>
          ) : null}
          <a className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white" href={buildWhatsappUrl(client.whatsapp_number, "Hola, quiero hacer un pedido")} target="_blank" rel="noreferrer">
            Consultar por WhatsApp
          </a>
          <a href={`/reservar/${client.slug}`} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--surface-muted)] px-4 text-sm font-medium text-[var(--text)]">
            Reservar mesa
          </a>
        </aside>
      </div>

      {step === "menu" && cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[var(--line)] bg-[var(--surface)]/94 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
          <div className="flex w-full max-w-[480px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{itemCount} producto{itemCount === 1 ? "" : "s"} en tu pedido</p>
              <p className="text-sm text-[var(--text-muted)]">{formatPrice(total)}</p>
            </div>
            <button type="button" onClick={() => setStep("checkout")} className="min-h-12 rounded-full px-5 text-sm font-medium text-white" style={{ backgroundColor: client.primary_color }}>
              Ver pedido
            </button>
          </div>
        </div>
      ) : step === "menu" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[var(--line)] bg-[var(--surface)]/94 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
          <a className="flex min-h-12 w-full max-w-[480px] items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white" href={buildWhatsappUrl(client.whatsapp_number, "Hola, quiero hacer un pedido")} target="_blank" rel="noreferrer">
            Consultar por WhatsApp
          </a>
        </div>
      ) : null}
    </main>
  );
}
