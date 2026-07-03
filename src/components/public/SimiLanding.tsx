"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { businessTypeOptions } from "@/constants/commercial";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const iconBase = "/simi/web_24_outline";

const benefits = [
  ["codigo_qr.svg", "QR permanente", "Actualiza tu carta sin volver a imprimir."],
  ["sitio_web.svg", "Link para redes", "Pon tu menu en Instagram, WhatsApp o Google Maps."],
  ["pedido_nuevo.svg", "Pedidos ordenados", "Recibe pedidos para mesa, recojo o delivery."],
  ["dashboard.svg", "Panel administrativo", "Gestiona tu carta y operacion desde un solo lugar."]
];

const mockups = [
  ["Carta digital en movil", "Categorias, productos, precios y promociones siempre actualizados."],
  ["Pedido guiado", "El cliente arma su pedido y el negocio lo recibe ordenado."],
  ["Panel de control", "Tu equipo revisa pedidos, pagos, reservas y agenda desde el panel."]
];

const steps = [
  ["01", "Configuramos tu carta digital", "Subimos productos, precios, fotos y categorias."],
  ["02", "Te entregamos tu QR y link propio", "Lo usas en mesas, redes, WhatsApp o Google Maps."],
  ["03", "Tus clientes ven el menu y hacen pedidos", "Mesa, recojo o delivery segun tu negocio."],
  ["04", "Tu gestionas todo desde tu panel", "Controlas carta, pedidos, pagos, reservas o agenda."]
];

const segments = [
  ["mesa_salon.svg", "Restaurantes", "Carta, pedidos en mesa, delivery y reservas."],
  ["promociones.svg", "Pastelerias", "Catalogo, personalizados, agenda y adelantos."],
  ["recojo_local.svg", "Cafeterias", "Carta digital, recojo, delivery y venta rapida."],
  ["cocina.svg", "Pollerias", "Combos, cocina, pagos y delivery."]
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
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl">
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
            <ThemeToggle compact />
            <a href="#demo" className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <Link href="/login" className="focus-ring hidden rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium sm:inline-flex">Ingresar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">QR permanente + link para redes + pedidos ordenados</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.04] tracking-normal md:text-6xl">Tu carta cambia. Tu QR no.</h1>
          <p className="mt-4 max-w-2xl text-xl font-medium leading-8 text-[var(--text)] md:text-2xl md:leading-9">
            Deja de reenviar tu carta cada vez que cambias precios, platos o promociones.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg md:leading-8">
            Con SIMI tienes una carta digital con QR permanente y un link para redes, donde tus clientes pueden ver el menu actualizado y hacer pedidos para mesa, recojo o delivery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#demo" className="focus-ring rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-6 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo de 2 minutos</a>
            <Link href="/menu/pollo-loco" className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-medium shadow-panel">Ver ejemplo</Link>
          </div>
        </div>

        <HeroPreview />
      </section>

      <section id="beneficios" className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {benefits.map(([icon, title, text]) => (
            <article key={title} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel md:p-5">
              <IconBadge icon={icon} />
              <h2 className="mt-4 text-base font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow="Vista rapida" title="Lo importante se entiende de un vistazo." text="Iconos para escanear rapido y mockups para visualizar como SIMI ordena la carta, el pedido y el panel." />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {mockups.map(([title, text], index) => (
            <MockupCard key={title} index={index} title={title} text={text} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
          <div className="rounded-[24px] bg-gradient-to-br from-[var(--accent)] via-[var(--simi-aji-amarillo)] to-[#101827] p-6 text-white">
            <p className="text-sm text-white/78">Mira un ejemplo de carta digital</p>
            <h2 className="mt-2 text-3xl font-medium">Explora una experiencia realista</h2>
            <p className="mt-3 text-sm leading-6 text-white/78">Visualiza un menu online con productos, categorias y pedido guiado.</p>
            <Link href="/menu/pollo-loco" className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-5 py-3 text-sm font-medium text-[#101827]">Ver ejemplo</Link>
          </div>
          <div className="grid content-center gap-3">
            {["Menu actualizado en un solo link", "Pedido guiado desde celular", "Promociones faciles de cambiar", "Listo para compartir por redes"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-[16px] border border-[var(--line)] bg-[var(--background)] px-4 py-3">
                <span className="text-sm font-medium">{item}</span>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent-strong)]">SIMI</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow="Como funciona" title="Cuatro pasos simples para empezar." text="La experiencia se mantiene corta para el cliente y ordenada para el negocio." />
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {steps.map(([number, title, text]) => (
            <article key={number} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
              <span className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent-strong)]">{number}</span>
              <h3 className="mt-4 text-base font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow="Rubros compatibles" title="SIMI se adapta a distintos negocios gastronomicos." text="Empieza con restaurantes, pastelerias, cafeterias y pollerias; luego se puede extender a mas rubros." />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {segments.map(([icon, title, text]) => (
            <article key={title} className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <IconBadge icon={icon} small />
              <h3 className="mt-4 text-sm font-medium">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)] md:text-sm md:leading-6">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-soft">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Demo personalizada</p>
          <h2 className="mt-2 text-3xl font-medium">Quieres ver como quedaria en tu negocio?</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Dejanos tus datos y te mostraremos una demo personalizada por WhatsApp, Zoom, Meet o presencial.
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
          <p className="text-center text-xs leading-5 text-[var(--text-muted)] md:col-span-2">Te contactaremos por WhatsApp para agendar una demo personalizada.</p>
        </form>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-soft md:p-8">
          <h2 className="text-3xl font-medium">Tu carta puede cambiar sin cambiar tu QR.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Empieza con una demo corta y revisa como se veria SIMI aplicado a tu negocio.</p>
          <a href="#demo" className="focus-ring mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-panel">Quiero ver como se veria en mi negocio</a>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>SIMI - Carta digital, pedidos y operacion para negocios gastronomicos.</span>
          <Link href="/login" className="font-medium text-[var(--text)]">Ingresar al panel</Link>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/92 p-3 backdrop-blur-xl sm:hidden">
        <a href="#demo" className="focus-ring flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
      </div>
    </main>
  );
}

function HeroPreview() {
  return (
    <div className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-soft">
      <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--background)]">
        <div className="bg-gradient-to-br from-[var(--accent)] via-[var(--simi-aji-amarillo)] to-[#101827] p-5 text-white">
          <p className="text-sm text-white/78">Vista previa SIMI</p>
          <h2 className="mt-2 text-2xl font-medium">Menu actualizado en segundos</h2>
          <p className="mt-3 text-sm leading-6 text-white/78">Carta, pedidos y promociones desde un solo enlace.</p>
        </div>
        <div className="grid gap-3 p-4">
          {["1/4 Pollo a la Brasa", "Combo familiar", "Chaufa de pollo"].map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-[var(--accent-soft)] text-sm font-medium text-[var(--accent-strong)]">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">Pedido listo para mesa, recojo o delivery</span>
              </span>
              <span className="rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IconBadge({ icon, small = false }: { icon: string; small?: boolean }) {
  return (
    <span className={`grid place-items-center rounded-[14px] bg-[var(--accent-soft)] ${small ? "h-9 w-9" : "h-11 w-11"}`}>
      <img src={`${iconBase}/${icon}`} alt="" className={small ? "h-5 w-5" : "h-6 w-6"} />
    </span>
  );
}

function MockupCard({ index, title, text }: { index: number; title: string; text: string }) {
  const isPhone = index < 2;
  return (
    <article className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className={`mx-auto overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--background)] ${isPhone ? "max-w-[250px]" : "max-w-full"}`}>
        <div className="flex items-center gap-1 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="grid gap-3 p-4">
          <div className="h-24 rounded-[18px] bg-gradient-to-br from-[var(--accent)] to-[var(--simi-aji-amarillo)]" />
          <div className="grid gap-2">
            <span className="h-3 w-2/3 rounded-full bg-[var(--line)]" />
            <span className="h-3 w-5/6 rounded-full bg-[var(--line)]" />
          </div>
          <div className="grid gap-2">
            {[0, 1, 2].map((item) => (
              <span key={item} className="h-10 rounded-[14px] border border-[var(--line)] bg-[var(--surface)]" />
            ))}
          </div>
        </div>
      </div>
      <h3 className="mt-5 text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium text-[var(--accent-strong)]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-medium leading-tight">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)] md:text-base">{text}</p>
    </div>
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
