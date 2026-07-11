"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryTabs } from "@/components/public-menu/CategoryTabs";
import { CategorySection } from "@/components/public-menu/CategorySection";
import { EmptyMenuState } from "@/components/public-menu/EmptyMenuState";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import { MenuItemCard } from "@/components/public-menu/MenuItemCard";
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

type SearchSuggestion = {
  id: string;
  label: string;
  detail: string;
  categoryId: string;
};

const orderTypeLabels: Record<OrderType, string> = {
  dine_in: "Mesa",
  pickup: "Recojo",
  delivery: "Delivery"
};

export function PublicMenuExperience({ client, categories, tables, deliveryZones, promotions, paymentMethods, initialTableNumber }: PublicMenuExperienceProps) {
  const initialTable = tables.find((table) => table.table_number === initialTableNumber || table.label.toLowerCase() === `mesa ${initialTableNumber}`.toLowerCase());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"menu" | "checkout" | "payment">("menu");
  const [orderType, setOrderType] = useState<OrderType>(initialTable ? "dine_in" : "pickup");
  const [selectedTableId, setSelectedTableId] = useState(initialTable?.id || "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const idempotencyKeyRef = useRef("");

  const flatItems = useMemo(() => categories.flatMap((category) => category.items), [categories]);
  const promoItem = useMemo(() => flatItems.find((item) => item.id === client.promo_banner_item_id) || null, [client.promo_banner_item_id, flatItems]);
  const visibleCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;
    return categories
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(query);

        return {
          ...category,
          items: categoryMatches ? category.items : category.items.filter((item) => `${item.name} ${item.description || ""}`.toLowerCase().includes(query))
        };
      })
      .filter((category) => category.items.length > 0);
  }, [categories, searchQuery]);
  const hasProducts = visibleCategories.some((category) => category.items.length > 0);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const selectedDeliveryZone = deliveryZones.find((zone) => zone.id === deliveryZoneId);
  const deliveryFee = orderType === "delivery" ? Number(selectedDeliveryZone?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartQuantities = useMemo(() => Object.fromEntries(cart.map((item) => [item.menuItemId, item.quantity])), [cart]);
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const yapeMethod = paymentMethods.find((method) => method.method_type === "yape");
  const activePromotions = promotions.filter((promotion) => promotion.is_active);
  const featuredCategories = categories.filter((category) => category.items.length > 0).slice(0, 8);
  const fastestDelivery = deliveryZones.find((zone) => zone.estimated_time)?.estimated_time || "20-35 min";
  const lowestDeliveryFee = deliveryZones.length ? Math.min(...deliveryZones.map((zone) => Number(zone.delivery_fee || 0))) : 0;
  const recommendedItems = useMemo(() => {
    const priorityWords = ["combo", "pollo", "chaufa", "broaster", "familiar", "oferta"];
    return flatItems
      .filter((item) => item.is_available)
      .sort((first, second) => {
        const firstScore = priorityWords.filter((word) => `${first.name} ${first.description || ""}`.toLowerCase().includes(word)).length;
        const secondScore = priorityWords.filter((word) => `${second.name} ${second.description || ""}`.toLowerCase().includes(word)).length;
        return secondScore - firstScore || Number(first.price) - Number(second.price);
      })
      .slice(0, 4);
  }, [flatItems]);
  const quickFilters = useMemo(
    () => categories.filter((category) => category.items.length > 0).slice(0, 5).map((category) => ({ label: category.name, query: category.name })),
    [categories]
  );
  const searchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];

    const categorySuggestions: SearchSuggestion[] = categories
      .filter((category) => category.name.toLowerCase().includes(query))
      .map((category) => ({
        id: `category-${category.id}`,
        label: category.name,
        detail: `${category.items.length} productos`,
        categoryId: category.id
      }));

    const itemSuggestions: SearchSuggestion[] = categories.flatMap((category) =>
      category.items
        .filter((item) => `${item.name} ${item.description || ""}`.toLowerCase().includes(query))
        .slice(0, 4)
        .map((item) => ({
          id: `item-${item.id}`,
          label: item.name,
          detail: category.name,
          categoryId: category.id
        }))
    );

    return [...categorySuggestions, ...itemSuggestions].slice(0, 7);
  }, [categories, searchQuery]);

  useEffect(() => {
    if (!lastAdded) return;

    const timeoutId = window.setTimeout(() => setLastAdded(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [lastAdded]);

  function addItem(item: MenuItem) {
    setLastAdded(item.name);
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

  function openCheckout() {
    setStep("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToMenu() {
    setStep("menu");
    window.setTimeout(() => scrollToId("menu-results"), 50);
  }

  function browseMenu() {
    document.getElementById("menu-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function focusSearch() {
    scrollToId("menu-content");
    window.setTimeout(() => searchInputRef.current?.focus(), 120);
  }

  function applyQuickFilter(query: string) {
    setSearchQuery(query);
    scrollToId("menu-results");
  }

  function goToCategory(categoryId: string) {
    setSearchQuery("");
    window.setTimeout(() => {
      document.getElementById(categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function selectSearchSuggestion(suggestion: SearchSuggestion) {
    setSearchQuery(suggestion.label);
    setIsSearchFocused(false);
    window.setTimeout(() => {
      document.getElementById(suggestion.categoryId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function createOrder() {
    setMessage("");
    const normalizedPhone = customerPhone.replace(/\D/g, "");

    if (orderType !== "dine_in" && !/^(51)?9\d{8}$/.test(normalizedPhone)) {
      setMessage("Ingresa un WhatsApp válido de Perú para confirmar el pedido.");
      return;
    }

    if (whatsappOptIn && !/^(51)?9\d{8}$/.test(normalizedPhone)) {
      setMessage("Ingresa un WhatsApp válido para recibir actualizaciones automáticas.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!idempotencyKeyRef.current) idempotencyKeyRef.current = crypto.randomUUID();
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current
        },
        body: JSON.stringify({
          clientId: client.id,
          orderType,
          tableId: orderType === "dine_in" ? selectedTableId || null : null,
          tableLabel: orderType === "dine_in" ? selectedTable?.label || initialTableNumber || "" : null,
          customerName,
          customerPhone,
          whatsappOptIn,
          whatsappOptInSource: "public_checkout",
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
      if (data.notifications?.customer === "queued") {
        setMessage("Pedido registrado. La confirmación por WhatsApp quedó en cola.");
      } else if (data.notificationMode === "manual_fallback") {
        setMessage("Pedido registrado. Puedes usar el botón de WhatsApp como respaldo mientras se activa el envío automático.");
      } else {
        setMessage("Pedido registrado correctamente.");
      }
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
    <main className={`min-h-screen max-w-full overflow-x-clip bg-[var(--background)] ${step === "menu" ? "pb-44" : "pb-8"}`}>
      {step === "menu" ? <MenuHeader client={client} /> : null}
      <div id="menu-content" className={`mx-auto grid max-w-[1320px] gap-6 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:px-8 ${step !== "menu" ? "max-w-[760px] lg:block" : ""}`}>
        <div className="grid min-w-0 max-w-full grid-cols-1 gap-6">
          {step === "menu" ? <section className="grid min-w-0 max-w-full grid-cols-1 gap-3 rounded-[30px] border border-white/70 bg-[var(--surface)]/96 p-3 shadow-soft backdrop-blur-xl">
            <div className="grid min-w-0 grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
              <ServiceModeButton active={orderType === "delivery"} label="Delivery" detail={`${fastestDelivery} - desde ${formatPrice(lowestDeliveryFee)}`} onClick={() => setOrderType("delivery")} />
              <ServiceModeButton active={orderType === "pickup"} label="Recojo" detail="Pide y pasa por tienda" onClick={() => setOrderType("pickup")} />
              <ServiceModeButton active={orderType === "dine_in"} label="Mesa" detail="Escanea QR y ordena" onClick={() => setOrderType("dine_in")} />
            </div>
            <div className="relative min-w-0">
              <label className="focus-within:shadow-panel flex min-h-[52px] min-w-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1 text-sm transition">
                <SearchIcon className="h-5 w-5 text-[var(--text-muted)]" />
                <input
                  ref={searchInputRef}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--text-muted)]"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 140)}
                  placeholder={`Buscar en ${client.name}`}
                />
                {searchQuery ? (
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface)] text-sm font-medium text-[var(--text-muted)]" onClick={() => setSearchQuery("")} aria-label="Limpiar busqueda">
                    x
                  </button>
                ) : null}
              </label>
              {isSearchFocused && searchQuery.trim().length >= 2 ? (
                <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-soft">
                  {searchSuggestions.length > 0 ? (
                    <div className="grid gap-1">
                      {searchSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-[16px] px-3 text-left text-sm hover:bg-[var(--surface-muted)]"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectSearchSuggestion(suggestion)}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{suggestion.label}</span>
                            <span className="block truncate text-xs text-[var(--text-muted)]">{suggestion.detail}</span>
                          </span>
                          <span className="text-xs font-medium text-[var(--accent)]">Ver</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[16px] bg-[var(--surface-muted)] px-3 py-3 text-sm text-[var(--text-muted)]">No encontramos platos con esa palabra.</div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text)] shadow-panel transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                  onClick={() => applyQuickFilter(filter.query)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section> : null}

          {step === "menu" ? <QuickTrustInfo client={client} deliveryZones={deliveryZones} paymentMethods={paymentMethods} fastestDelivery={fastestDelivery} /> : null}

          {step === "menu" && featuredCategories.length > 0 ? (
            <section className="grid min-w-0 max-w-full grid-cols-1 gap-3">
              <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="text-lg font-medium">Explora por antojo</h2>
                {searchQuery ? <button type="button" className="text-sm font-medium text-[var(--accent)]" onClick={() => setSearchQuery("")}>Limpiar</button> : null}
              </div>
              <div className="flex min-w-0 max-w-full gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {featuredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => goToCategory(category.id)}
                    className="focus-ring grid min-h-24 min-w-[118px] shrink-0 content-center justify-items-center gap-2 rounded-[24px] border border-white/70 bg-[var(--surface)] px-3 text-center shadow-panel transition hover:-translate-y-0.5"
                  >
                    {category.image_url ? (
                      <img alt={category.name} src={category.image_url} className="h-11 w-11 rounded-[16px] object-cover" />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-[16px] text-lg" style={{ backgroundColor: `${client.primary_color}18`, color: client.primary_color }}>{getCategoryIcon(category.name)}</span>
                    )}
                    <span className="line-clamp-2 text-sm font-medium leading-tight">{category.name}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

        {step === "menu" && recommendedItems.length > 0 ? (
          <section id="recommended" className="grid min-w-0 max-w-full grid-cols-1 gap-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-medium">Mas pedidos para decidir rapido</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Opciones fuertes para quien quiere resolver en pocos taps.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recommendedItems.map((item) => (
                <MenuItemCard key={item.id} item={item} accentColor={client.primary_color} onAdd={addItem} quantity={cartQuantities[item.id] || 0} />
              ))}
            </div>
          </section>
        ) : null}

        {step === "menu" ? <PromoBanner client={client} promoItem={promoItem} onAddPromo={addItem} onBrowseMenu={browseMenu} /> : null}

        {step === "menu" && activePromotions.length > 0 ? (
          <section id="promotions" className="grid min-w-0 max-w-full grid-cols-1 gap-3 scroll-mt-24">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="text-lg font-medium">Promociones para hoy</h2>
              <span className="text-sm text-[var(--text-muted)]">{activePromotions.length} activas</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {activePromotions.slice(0, 3).map((promotion) => (
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
          <div id="menu-results" className="grid min-w-0 max-w-full gap-6 overflow-hidden scroll-mt-24">
            <CategoryTabs categories={visibleCategories} accentColor={client.primary_color} />
            {hasProducts ? visibleCategories.map((category) => <CategorySection key={category.id} category={category} accentColor={client.primary_color} onAdd={addItem} quantities={cartQuantities} />) : <EmptyMenuState client={client} />}
          </div>
        ) : null}

        {step === "checkout" ? (
          <section className="grid min-h-[calc(100vh-40px)] gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft lg:min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{client.name}</p>
                <h2 className="mt-1 text-2xl font-medium">Tu pedido</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Revisa cantidades, notas y confirma para pasar al pago.</p>
              </div>
              <button type="button" onClick={backToMenu} className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-lg text-[var(--text)]" aria-label="Volver al menu">
                x
              </button>
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

            <label className="grid gap-2 text-sm">
              <span className="font-medium">WhatsApp {orderType === "dine_in" ? <span className="font-normal text-[var(--text-muted)]">(opcional)</span> : null}</span>
              <input
                className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="999 999 999"
              />
            </label>

            <label className="flex items-start gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                checked={whatsappOptIn}
                onChange={(event) => setWhatsappOptIn(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Recibir confirmación por WhatsApp</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">Acepto recibir la confirmación y los cambios importantes de este pedido. No se usarán para publicidad.</span>
              </span>
            </label>

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
              <Button type="button" variant="secondary" onClick={backToMenu} className="w-full">
                Seguir viendo
              </Button>
              <Button type="button" onClick={createOrder} disabled={isSubmitting || cart.length === 0} className="w-full">
                {isSubmitting ? "Creando..." : `Confirmar ${formatPrice(total)}`}
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

        <aside id="cart-panel" className="sticky top-6 hidden rounded-[30px] border border-white/70 bg-[var(--surface)]/96 p-5 shadow-soft backdrop-blur-xl lg:grid lg:gap-4">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Tu pedido</p>
            <h2 className="mt-1 text-xl font-medium">{itemCount ? `${itemCount} producto${itemCount === 1 ? "" : "s"}` : "Listo para ordenar"}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-1">
            {(Object.keys(orderTypeLabels) as OrderType[]).map((type) => (
              <button key={type} type="button" onClick={() => setOrderType(type)} className={`rounded-full px-2 py-2 text-xs font-medium ${orderType === type ? "bg-[var(--surface)] shadow-panel" : "text-[var(--text-muted)]"}`}>
                {orderTypeLabels[type]}
              </button>
            ))}
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
            <Button type="button" onClick={openCheckout} className="w-full">
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
        <div className="fixed inset-x-3 bottom-[76px] z-40 mx-auto max-w-[480px] rounded-[26px] border border-white/70 bg-[var(--surface)]/96 p-3 shadow-soft backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-3">
            <button type="button" onClick={openCheckout} className="simi-gradient grid h-12 w-12 shrink-0 place-items-center rounded-[18px] text-white shadow-panel" aria-label="Abrir pedido">
              <CartIcon className="h-6 w-6" />
            </button>
            <button type="button" onClick={openCheckout} className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{itemCount} producto{itemCount === 1 ? "" : "s"} en tu pedido</p>
              <p className="text-sm text-[var(--text-muted)]">{formatPrice(total)}</p>
            </button>
            <button type="button" onClick={openCheckout} className="simi-gradient min-h-11 rounded-full px-4 text-sm font-medium text-white">
              Ver
            </button>
          </div>
        </div>
      ) : step === "menu" ? (
        <div className="fixed inset-x-0 bottom-[68px] z-40 flex justify-center border-t border-[var(--line)] bg-[var(--surface)]/94 px-3 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
          <a className="flex min-h-12 w-full max-w-[480px] items-center justify-center rounded-full bg-[#25D366] px-4 text-sm font-medium text-white" href={buildWhatsappUrl(client.whatsapp_number, "Hola, quiero hacer un pedido")} target="_blank" rel="noreferrer">
            Consultar por WhatsApp
          </a>
        </div>
      ) : null}

      {step === "menu" ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-[var(--line)] bg-[var(--surface)]/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden" aria-label="Navegacion de carta">
          <MobileNavButton label="Inicio" icon="home" onClick={() => scrollToId("menu-content")} />
          <MobileNavButton label="Buscar" icon="search" onClick={focusSearch} />
          <MobileNavButton label="Promos" icon="tag" onClick={() => scrollToId("promotions")} />
          <MobileNavButton label="Pedido" icon="cart" onClick={() => (cart.length > 0 ? openCheckout() : scrollToId("recommended"))} badge={itemCount || undefined} />
          <MobileNavButton label="Info" icon="info" onClick={() => scrollToId("quick-info")} />
        </nav>
      ) : null}

      {lastAdded ? (
        <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-[420px] rounded-[20px] border border-white/70 bg-[var(--surface)] px-4 py-3 text-sm shadow-soft lg:bottom-6 lg:left-auto lg:right-6" role="status">
          <p className="font-medium">Agregado a tu pedido</p>
          <p className="mt-0.5 truncate text-[var(--text-muted)]">{lastAdded}</p>
        </div>
      ) : null}
    </main>
  );
}

function QuickTrustInfo({ client, deliveryZones, paymentMethods, fastestDelivery }: { client: Client; deliveryZones: ClientDeliveryZone[]; paymentMethods: PaymentMethod[]; fastestDelivery: string }) {
  const activePaymentLabels = paymentMethods
    .filter((method) => method.is_active)
    .map((method) => method.label)
    .slice(0, 3);
  const paymentText = activePaymentLabels.length > 0 ? activePaymentLabels.join(", ") : client.yape_number ? "Yape disponible" : "Consulta al negocio";
  const deliveryText = deliveryZones.length > 0 ? `${deliveryZones.length} zonas registradas` : "Cobertura por confirmar";

  return (
    <section id="quick-info" className="grid scroll-mt-24 gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel md:grid-cols-4">
      <InfoPill label="Entrega" value={fastestDelivery} />
      <InfoPill label="Delivery" value={deliveryText} />
      <InfoPill label="Pagos" value={paymentText} />
      <InfoPill label="Confirmacion" value="Por WhatsApp" />
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--surface-muted)] px-3 py-3">
      <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium text-[var(--text)]">{value}</p>
    </div>
  );
}

function MobileNavButton({ label, icon, onClick, badge }: { label: string; icon: "home" | "search" | "tag" | "cart" | "info"; onClick: () => void; badge?: number }) {
  return (
    <button type="button" className="grid min-w-0 place-items-center content-center gap-1 rounded-[16px] px-1 text-[11px] font-medium text-[var(--text-muted)] active:scale-[0.97]" onClick={onClick}>
      <span className="relative">
        <MobileNavIcon name={icon} className="h-5 w-5 text-[var(--text)]" />
        {badge ? <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">{badge}</span> : null}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5h2l2 10h8l2-7H8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20h.01M17 20h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

function MobileNavIcon({ name, className }: { name: "home" | "search" | "tag" | "cart" | "info"; className?: string }) {
  const paths = {
    home: (
      <>
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.5 20v-5h5v5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    tag: (
      <>
        <path d="M4 12V5h7l9 9-7 7-9-9Z" />
        <path d="M8 8h.01" />
      </>
    ),
    cart: (
      <>
        <path d="M5 5h2l2 10h8l2-7H8" />
        <path d="M10 20h.01" />
        <path d="M17 20h.01" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}

function ServiceModeButton({ active, label, detail, onClick }: { active: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring grid min-h-16 min-w-0 content-center overflow-hidden rounded-[18px] border px-1 text-center transition sm:px-2 ${active ? "border-[var(--accent)] bg-[var(--surface)] shadow-panel" : "border-transparent bg-[var(--surface-muted)]"}`}
    >
      <span className="truncate text-sm font-medium text-[var(--text)]">{label}</span>
      <span className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--text-muted)]">{detail}</span>
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function getCategoryIcon(name: string) {
  const value = name.toLowerCase();
  if (value.includes("pollo") || value.includes("brasa")) return "PL";
  if (value.includes("combo") || value.includes("promo")) return "%";
  if (value.includes("bebida") || value.includes("gaseosa")) return "B";
  if (value.includes("postre") || value.includes("dulce")) return "*";
  if (value.includes("entrada") || value.includes("piqueo")) return "+";
  if (value.includes("menu")) return "M";
  return "D";
}
