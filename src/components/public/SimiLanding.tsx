"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { businessTypeOptions } from "@/constants/commercial";

const painPoints = [
  "Cambias precios y vuelves a mandar la carta.",
  "Te escriben por WhatsApp solo para preguntar el menu.",
  "Los pedidos llegan mezclados entre chats, llamadas y redes."
];

const benefits = [
  ["QR permanente", "Actualiza precios, fotos, platos y promociones sin volver a imprimir."],
  ["Link para redes", "Ancla tu carta en Instagram, Facebook, TikTok, WhatsApp o Google Maps."],
  ["Pedidos ordenados", "Recibe pedidos para mesa, recojo o delivery desde el mismo menu."],
  ["Panel administrativo", "Gestiona carta, pedidos, pagos, reservas o agenda desde un solo lugar."]
];

const segments = [
  ["Restaurantes", "Pedidos en mesa, delivery, recojo y reservas."],
  ["Pastelerias", "Catalogo, pedidos personalizados, agenda de entregas y adelantos."],
  ["Cafeterias", "Carta digital, venta rapida, recojo y delivery."],
  ["Pollerias", "Combos, cocina, delivery, pagos y promociones."]
];

const steps = [
  ["Configuramos tu carta digital.", "Subimos productos, precios, fotos y categorias."],
  ["Te entregamos tu QR y link propio.", "Puedes ponerlo en mesas, redes, WhatsApp o Google Maps."],
  ["Tus clientes ven y piden desde el celular.", "Mesa, recojo o delivery segun como trabaje tu negocio."],
  ["Tu controlas todo desde el panel.", "Actualizas carta, pedidos, pagos, reservas o agenda."]
];

export function SimiLanding() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submitDemo(formData: FormData) {
    startTransition(async () => {
      setMessage("");
      setIsSuccess(false);
      const payload = {
        businessName: String(formData.get("business_name") || ""),
        businessType: String(formData.get("business_type") || "restaurant"),
        city: String(formData.get("city") || "Huancayo"),
        contactName: String(formData.get("contact_name") || ""),
        whatsapp: String(formData.get("whatsapp") || ""),
        socialUrl: String(formData.get("social_url") || ""),
        comment: String(formData.get("comment") || "")
      };

      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "No se pudo enviar la solicitud.");
        return;
      }

      setIsSuccess(true);
      setMessage("Gracias. Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una demo.");
    });
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-20 text-[var(--text)] sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] shadow-panel">
              <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">SIMI</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">Tu carta cambia. Tu QR no.</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <a href="#demo" className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <Link href="/login" className="focus-ring hidden rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium sm:inline-flex">Ingresar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">QR permanente + link para redes + pedidos ordenados</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.04] tracking-normal md:text-6xl">Deja de reenviar tu carta cada vez que cambias precios.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg md:leading-8">
            Con SIMI tienes una carta digital con QR permanente y link para redes. Tus clientes ven el menu actualizado y pueden hacer pedidos para mesa, recojo o delivery desde su celular.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#demo" className="focus-ring rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-6 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo de 2 minutos</a>
            <Link href="/menu/pollo-loco" className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-medium shadow-panel">Ver ejemplo</Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-soft">
          <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--background)]">
            <div className="bg-gradient-to-br from-[var(--accent)] via-[var(--simi-aji-amarillo)] to-[#101827] p-5 text-white">
              <p className="text-sm text-white/78">Mira una carta demo</p>
              <h2 className="mt-2 text-2xl font-medium md:text-3xl">Carta digital lista para vender</h2>
              <p className="mt-3 text-sm leading-6 text-white/78">Productos, categorias, promociones y pedido simulado desde el celular.</p>
            </div>
            <div className="grid gap-3 p-4">
              {["Menu actualizado", "Pedido para mesa", "Recojo o delivery", "Pago y confirmacion"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-[16px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <span className="text-sm font-medium">{item}</span>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">SIMI</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--line)] p-4">
              <Link href="/menu/pollo-loco" className="focus-ring flex min-h-11 items-center justify-center rounded-full bg-[var(--text)] px-5 py-3 text-sm font-medium text-[var(--background)]">Ver carta demo</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel md:p-6">
          <h2 className="text-2xl font-medium">Si tu carta cambia, tu QR no deberia cambiar.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-muted)] md:text-base">
            Muchos negocios pierden tiempo reenviando cartas, corrigiendo precios por WhatsApp o tomando pedidos desordenados. SIMI centraliza tu carta, pedidos y atencion en un solo enlace.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {painPoints.map((point) => (
              <div key={point} className="rounded-[16px] bg-[var(--background)] p-4 text-sm text-[var(--text-muted)]">{point}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([title, text]) => (
            <div key={title} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-xs font-medium text-[var(--accent-strong)]">OK</span>
              <p className="mt-4 text-base font-medium">{title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-panel">
          <h2 className="text-2xl font-medium">SIMI se adapta a tu tipo de negocio</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {segments.map(([title, text]) => (
              <div key={title} className="rounded-[18px] bg-[var(--background)] p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)] md:text-sm md:leading-6">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-panel md:block">
          <h2 className="text-2xl font-medium">Como funciona SIMI</h2>
          <div className="mt-5 grid gap-3">
            {steps.map(([title, text], index) => (
              <div key={title} className="flex gap-3 rounded-[18px] bg-[var(--background)] p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-medium text-white">{index + 1}</span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--text-muted)]">{text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-soft">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Demo personalizada</p>
          <h2 className="mt-2 text-3xl font-medium">Quieres ver como quedaria en tu negocio?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Solicita una demo personalizada. Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una reunion por WhatsApp, Zoom, Meet o presencial.
          </p>
        </div>

        <form action={submitDemo} className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft md:grid-cols-2">
          <Field label="Nombre del negocio" name="business_name" required />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Rubro</span>
            <select name="business_type" className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]">
              {businessTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Field label="Ciudad" name="city" defaultValue="Huancayo" required />
          <Field label="Nombre de contacto" name="contact_name" required />
          <Field label="WhatsApp" name="whatsapp" placeholder="+51 999 999 999" required />
          <Field label="Instagram o Facebook" name="social_url" placeholder="@tunegocio o enlace" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium">Comentario opcional</span>
            <textarea name="comment" rows={4} className="focus-ring rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" placeholder="Cuentanos que vendes o que necesitas mejorar." />
          </label>
          {message ? <p className={`rounded-[var(--radius-card)] p-3 text-sm md:col-span-2 ${isSuccess ? "bg-green-50 text-green-800 dark:bg-green-950/35 dark:text-green-100" : "bg-red-50 text-red-800 dark:bg-red-950/35 dark:text-red-100"}`}>{message}</p> : null}
          <button type="submit" disabled={isPending} className="focus-ring min-h-12 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel disabled:opacity-60 md:col-span-2">
            {isPending ? "Enviando..." : "Solicitar demo personalizada"}
          </button>
        </form>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/92 p-3 backdrop-blur-xl sm:hidden">
        <a href="#demo" className="focus-ring flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
      </div>
    </main>
  );
}

function Field({ label, name, required, defaultValue, placeholder }: { label: string; name: string; required?: boolean; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]" />
    </label>
  );
}
