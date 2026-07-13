"use client";

import { BrandColorPicker } from "@/components/admin/BrandColorPicker";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button, LinkButton } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { businessTypeOptions } from "@/constants/commercial";
import { updateClientInlineAction } from "@/lib/actions";
import { getClientServiceModes } from "@/lib/service-modes";
import { formatPrice } from "@/lib/utils";
import type { BusinessType, Client, ClientServiceModes, MenuItem } from "@/types/menu";
import { Bike, CalendarDays, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";

type ClientFormProps = {
  client?: Client;
  action: (formData: FormData) => void;
  error?: string;
  promoItems?: Pick<MenuItem, "id" | "name" | "price">[];
  initialServiceModes?: ClientServiceModes;
};

export function ClientForm({ client, action, error, promoItems = [], initialServiceModes }: ClientFormProps) {
  const storageBase = client ? `clients/${client.id}` : "clients/pending";
  const hasSecondaryColor = Boolean(client?.secondary_color);
  const [businessType, setBusinessType] = useState<BusinessType>(client?.business_type || "restaurant");
  const [businessName, setBusinessName] = useState(client?.name || "");
  const [serviceModes, setServiceModes] = useState(() => initialServiceModes || getClientServiceModes(client));
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateServiceMode(mode: keyof typeof serviceModes, enabled: boolean) {
    setServiceModes((current) => {
      if (mode === "dineIn" && !enabled) return { ...current, dineIn: false, reservations: false };
      if (mode === "reservations" && enabled) return { ...current, dineIn: true, reservations: true };
      return { ...current, [mode]: enabled };
    });
  }

  function submitExistingClient(event: FormEvent<HTMLFormElement>) {
    if (!client) return;
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);

    startTransition(() => {
      void updateClientInlineAction(client.id, formData).then((result) => {
        setFeedback(result.ok ? { tone: "success", message: result.message } : { tone: "error", message: result.error });
      });
    });
  }

  return (
    <form action={client ? undefined : action} onSubmit={client ? submitExistingClient : undefined} className="grid min-w-0 gap-4">
      {error ? <div className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{error}</div> : null}
      {feedback ? (
        <div aria-live="polite" className={`rounded-[var(--radius-card)] p-3 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Datos del negocio</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Lo básico para identificar la carta y recibir pedidos.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <Input label="Nombre del negocio" name="name" required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Mi negocio" />
          <Input label="Slug del enlace" name="slug" required defaultValue={client?.slug} placeholder="mi-negocio" hint="Este enlace se imprime en el QR. Evita cambiarlo después." />
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--text)]">Rubro del negocio</span>
            <select
              name="business_type"
              value={businessType}
              onChange={(event) => setBusinessType(event.target.value as BusinessType)}
            className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3"
            >
              {businessTypeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <span className="text-xs leading-5 text-[var(--text-muted)]">Ajusta etiquetas como carta, agenda o produccion segun el negocio.</span>
          </label>
          <Input label="Dirección" name="address" defaultValue={client?.address || ""} placeholder="Av. Principal 123, Lima" />
          <Input label="WhatsApp público" name="whatsapp_number" required defaultValue={client?.whatsapp_number || "+51 987 088 359"} placeholder="+51 987 088 359" hint="Aparece en la carta para contacto general." />
          <Input label="WhatsApp de notificaciones" name="notification_whatsapp_number" defaultValue={client?.notification_whatsapp_number || ""} placeholder="+51 999 888 777" hint="Aquí llegarán los pedidos por WhatsApp. Si lo dejas vacío, se usa el WhatsApp público." />
          <Input label="Número Yape" name="yape_number" defaultValue={client?.yape_number || ""} placeholder="987088359" />
        </div>
        <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={client?.is_active ?? true} />
          <span>Negocio activo y visible públicamente</span>
        </label>
      </section>

      <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg font-medium">Canales de atención</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Activa solo las opciones que realmente ofrece el negocio. La carta y el checkout se ajustarán automáticamente.</p>
          </div>
          <span className="text-xs font-medium text-[var(--text-muted)]">Al menos un canal de pedido</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "delivery" as const, name: "service_delivery", label: "Delivery", detail: "Entrega a domicilio", icon: Bike },
            { key: "pickup" as const, name: "service_pickup", label: "Recojo", detail: "El cliente recoge su pedido", icon: ShoppingBag },
            { key: "dineIn" as const, name: "service_dine_in", label: "Atención en mesa", detail: "Pedidos desde el local o QR", icon: UtensilsCrossed },
            { key: "reservations" as const, name: "service_reservations", label: "Reservas de mesa", detail: "Agenda fecha, hora y personas", icon: CalendarDays }
          ].map((option) => {
            const Icon = option.icon;
            const checked = serviceModes[option.key];
            const disabled = option.key === "reservations" && !serviceModes.dineIn;
            return (
              <label
                key={option.key}
                className={`focus-within:ring-2 focus-within:ring-[var(--accent)]/30 flex min-h-[82px] cursor-pointer items-center gap-3 rounded-[18px] border p-3 transition ${checked ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--surface-muted)]"} ${disabled ? "cursor-not-allowed opacity-55" : ""}`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${checked ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--text-muted)]"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--text)]">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-[var(--text-muted)]">{option.detail}</span>
                </span>
                <input
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  type="checkbox"
                  name={option.name}
                  checked={checked}
                  disabled={disabled}
                  onChange={(event) => updateServiceMode(option.key, event.target.checked)}
                />
              </label>
            );
          })}
        </div>
        {!serviceModes.dineIn ? <p className="text-xs text-[var(--text-muted)]">Las reservas de mesa se desactivan cuando el negocio no atiende en local.</p> : null}
      </section>

      <div className="grid min-w-0 items-start gap-4 2xl:grid-cols-2">
      <section className="grid min-w-0 gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Identidad visual</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Elige una propuesta según el rubro o ajusta libremente los colores. La vista rápida muestra cómo se sentirán en la carta.</p>
        </div>
        <BrandColorPicker
          initialPrimary={client?.primary_color || "#2463EB"}
          initialSecondary={client?.secondary_color || "#F06449"}
          initialUseSecondary={hasSecondaryColor}
          businessType={businessType}
          businessName={businessName || "Tu negocio"}
        />
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          <ImageUploader
            name="logo_url"
            label="Logo del negocio"
            defaultValue={client?.logo_url}
            storagePath={`${storageBase}/logo`}
            hint="Ideal: PNG o WebP con fondo transparente o limpio. Tamaño recomendado: 512 x 512 px. Máximo 2 MB."
          />
          <ImageUploader
            name="yape_qr_url"
            label="QR de Yape"
            defaultValue={client?.yape_qr_url}
            storagePath={`${storageBase}/yape`}
            hint="Ideal: PNG nítido y cuadrado. Tamaño recomendado: 800 x 800 px para que se escanee bien. Máximo 2 MB."
          />
        </div>
        <ImageUploader
          name="hero_banner_image_url"
          label="Portada del negocio"
          defaultValue={client?.hero_banner_image_url}
          storagePath={`${storageBase}/hero`}
          preview="wide"
          hint="Imagen para la parte superior de la carta, estilo portada de app. Ideal: producto, servicio o ambiente del negocio, horizontal 1400 x 700 px. Maximo 2 MB."
        />
      </section>

      <section className="grid min-w-0 gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Banner de promoción</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Opcional. Aparece arriba de las categorías en la carta pública.</p>
        </div>
        <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
          <input type="checkbox" name="promo_banner_is_active" defaultChecked={Boolean(client?.promo_banner_is_active || client?.promo_banner_image_url || client?.promo_banner_title || client?.promo_banner_description)} />
          <span>Mostrar banner promocional</span>
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Título del banner" name="promo_banner_title" defaultValue={client?.promo_banner_title || ""} placeholder="Producto destacado de la semana" />
          <Input label="Texto corto" name="promo_banner_description" defaultValue={client?.promo_banner_description || ""} placeholder="Disponible por tiempo limitado" />
        </div>
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--text)]">Producto para el boton "Lo quiero"</span>
          <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="promo_banner_item_id" defaultValue={client?.promo_banner_item_id || ""}>
            <option value="">Solo llevar a la carta</option>
            {promoItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {formatPrice(item.price)}
              </option>
            ))}
          </select>
          <span className="text-xs leading-5 text-[var(--text-muted)]">Si eliges un producto, el boton del banner lo agrega directo al pedido.</span>
        </label>
        <ImageUploader
          name="promo_banner_image_url"
          label="Imagen del banner"
          defaultValue={client?.promo_banner_image_url}
          storagePath={`${storageBase}/promo`}
          preview="wide"
          activateCheckboxName="promo_banner_is_active"
          hint="Ideal para banner superior del menú: JPG o WebP horizontal. Tamaño recomendado: 1200 x 480 px. En móvil se recorta al centro. Máximo 2 MB."
        />
      </section>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--line)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-end gap-3">
          <LinkButton href="/admin" variant="secondary">
            Volver
          </LinkButton>
          <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : client ? "Guardar cambios" : "Crear cliente"}</Button>
        </div>
      </div>
    </form>
  );
}
