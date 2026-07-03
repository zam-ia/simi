"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { businessTypeOptions } from "@/constants/commercial";

const benefits = [
  "QR permanente y link para redes",
  "Carta digital actualizable",
  "Pedidos para mesa, recojo o delivery",
  "Reservas o agenda segun el negocio",
  "Panel administrativo para operar mejor",
  "Compatible con restaurantes, cafeterias, pastelerias y pollerias"
];

const segments = [
  ["Restaurantes", "Carta digital, pedidos en mesa, delivery, recojo y reservas."],
  ["Pastelerias", "Catalogo online, pedidos personalizados, agenda de entregas y adelantos."],
  ["Cafeterias", "Carta digital, venta rapida, recojo y delivery."],
  ["Pollerias", "Combos, carta actualizada, cocina, delivery y pagos."]
];

const steps = [
  "Creamos tu carta digital.",
  "Te damos un QR permanente y un link propio.",
  "Tus clientes ven el menu y hacen pedidos.",
  "Tu gestionas todo desde tu panel."
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
    <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[14px] shadow-panel">
              <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-sm font-medium">SIMI</span>
              <span className="block text-xs text-[var(--text-muted)]">Tu carta cambia. Tu QR no.</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <a href="#demo" className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <Link href="/login" className="focus-ring rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium">Ingresar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
        <div>
          <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">Para negocios gastronomicos en crecimiento</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-medium leading-[1.02] tracking-normal md:text-6xl">Moderniza tu carta y recibe pedidos desde un solo lugar.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
            SIMI permite que tu negocio tenga una carta digital con QR permanente, link para redes, pedidos online, reservas, delivery, recojo y control administrativo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#demo" className="focus-ring rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-6 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <a href="#beneficios" className="focus-ring rounded-full bg-[var(--surface)] px-6 py-3 text-sm font-medium shadow-panel">Ver beneficios</a>
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
          <div className="overflow-hidden rounded-[24px] bg-[var(--simi-carbon-parrilla)] text-white">
            <div className="bg-gradient-to-br from-[var(--accent)] via-[var(--simi-aji-amarillo)] to-[var(--simi-carbon-parrilla)] p-5">
              <p className="text-sm text-white/78">Ejemplo controlado</p>
              <h2 className="mt-2 text-3xl font-medium">Carta digital + pedidos + agenda</h2>
              <p className="mt-3 text-sm leading-6 text-white/76">Pensado para mostrar valor sin exponer el panel completo.</p>
            </div>
            <div className="grid gap-3 p-5">
              {["Combo familiar", "Pedido en mesa", "Reserva o agenda", "Control de pagos"].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-[18px] bg-white/10 px-4 py-3">
                  <span className="text-sm">{item}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--simi-carbon-parrilla)]">SIMI</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
              <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--accent-soft)] text-xs font-medium text-[var(--accent-strong)]">OK</span>
              <p className="mt-4 text-sm font-medium">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-panel">
          <h2 className="text-2xl font-medium">Como funciona</h2>
          <div className="mt-5 grid gap-3">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[18px] bg-[var(--background)] p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-sm font-medium text-white">{index + 1}</span>
                <p className="text-sm text-[var(--text-muted)]">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-panel">
          <h2 className="text-2xl font-medium">No es solo para comida rapida</h2>
          <div className="mt-5 grid gap-3">
            {segments.map(([title, text]) => (
              <div key={title} className="rounded-[18px] bg-[var(--background)] p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] bg-[var(--simi-carbon-parrilla)] p-6 text-white shadow-soft">
          <p className="text-sm text-white/70">Demo controlada</p>
          <h2 className="mt-2 text-3xl font-medium">Solicita una demo personalizada</h2>
          <p className="mt-3 text-sm leading-6 text-white/72">
            Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una reunion. La demo real se muestra por Zoom, Meet, WhatsApp o presencial, sin exponer el panel completo de forma publica.
          </p>
        </div>

        <form action={submitDemo} className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft md:grid-cols-2">
          <Field label="Nombre del negocio" name="business_name" required />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Rubro</span>
            <select name="business_type" className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3">
              {businessTypeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <Field label="Ciudad" name="city" defaultValue="Huancayo" required />
          <Field label="Nombre de contacto" name="contact_name" required />
          <Field label="WhatsApp" name="whatsapp" placeholder="+51 999 999 999" required />
          <Field label="Instagram o Facebook" name="social_url" placeholder="@tunegocio o enlace" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium">Comentario opcional</span>
            <textarea name="comment" rows={4} className="focus-ring rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Cuentanos que vendes o que necesitas mejorar." />
          </label>
          {message ? <p className={`rounded-[var(--radius-card)] p-3 text-sm md:col-span-2 ${isSuccess ? "bg-green-50 text-green-800 dark:bg-green-950/35 dark:text-green-100" : "bg-red-50 text-red-800 dark:bg-red-950/35 dark:text-red-100"}`}>{message}</p> : null}
          <button type="submit" disabled={isPending} className="focus-ring min-h-12 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel disabled:opacity-60 md:col-span-2">
            {isPending ? "Enviando..." : "Solicitar demo personalizada"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, name, required, defaultValue, placeholder }: { label: string; name: string; required?: boolean; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} required={required} defaultValue={defaultValue} placeholder={placeholder} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" />
    </label>
  );
}
