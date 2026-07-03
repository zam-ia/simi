"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { businessTypeOptions } from "@/constants/commercial";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import type { LandingContent, LandingSection } from "@/lib/landing-content";

const steps = [
  ["01", "Configuramos tu carta", "Productos, precios, fotos y categorias."],
  ["02", "Te damos tu QR y link", "Para mesas, redes, WhatsApp o Google Maps."],
  ["03", "Tus clientes ven y piden", "Mesa, recojo o delivery desde el celular."],
  ["04", "Tu gestionas el negocio", "Carta, pedidos, pagos, reservas o agenda."]
];

type SimiLandingProps = {
  content: LandingContent;
  previewMode?: boolean;
  forcedTheme?: "light" | "dark";
};

const featureVisuals = ["qr", "sync", "orders", "calendar", "dashboard"] as const;
const featureKeys = ["qr_link", "menu_update", "orders", "agenda", "dashboard"] as const;

export function SimiLanding({ content, previewMode = false, forcedTheme }: SimiLandingProps) {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { sectionMap } = content;
  const hero = sectionMap.hero;
  const demoForm = sectionMap.demo_form;
  const finalCta = sectionMap.final_cta;
  const footer = sectionMap.footer;
  const featureBlocks = featureKeys
    .map((key, index) => ({ section: sectionMap[key], visual: featureVisuals[index] }))
    .filter((item) => item.section?.is_visible);

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
      setMessage(String(demoForm.metadata.successMessage || "Gracias. Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una demo."));
    });
  }

  return (
    <main className={`min-h-screen bg-[var(--background)] text-[var(--text)] ${previewMode ? "pb-0" : "pb-20 sm:pb-0"}`}>
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-[14px] shadow-panel">
              <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">SIMI</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">{String(hero.metadata.badge || "Tu carta cambia. Tu QR no.")}</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <a href="#demo" className="focus-ring rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <Link href="/login" className="focus-ring hidden rounded-full bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium sm:inline-flex">Ingresar</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">{String(hero.metadata.badge || "QR permanente + carta viva + pedidos ordenados")}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.04] tracking-normal md:text-6xl">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-xl font-medium leading-8 text-[var(--text)] md:text-2xl md:leading-9">
            {hero.subtitle}
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg md:leading-8">
            {hero.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hero.primary_cta_label && hero.primary_cta_url ? <a href={hero.primary_cta_url} className="focus-ring rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-6 py-3 text-sm font-medium text-white shadow-panel">{hero.primary_cta_label}</a> : null}
            {hero.secondary_cta_label && hero.secondary_cta_url ? <Link href={hero.secondary_cta_url} className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-medium shadow-panel">{hero.secondary_cta_label}</Link> : null}
          </div>
        </div>

        <HeroProductMockup section={hero} forcedTheme={forcedTheme} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:px-8">
        {featureBlocks.map(({ section, visual }, index) => (
          <FeatureBlock key={section.section_key} section={section} visual={visual} reverse={index % 2 === 1} forcedTheme={forcedTheme} />
        ))}
      </section>

      {sectionMap.experience.is_visible ? <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-2 lg:p-6">
          <div>
            <p className="text-sm font-medium text-[var(--accent-strong)]">{sectionMap.experience.subtitle}</p>
            <h2 className="mt-2 text-3xl font-medium">{sectionMap.experience.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)]">{sectionMap.experience.description}</p>
            {sectionMap.experience.primary_cta_label && sectionMap.experience.primary_cta_url ? <Link href={sectionMap.experience.primary_cta_url} className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white">{sectionMap.experience.primary_cta_label}</Link> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PhoneMockup compact />
            <AdminMockup compact />
          </div>
        </div>
      </section> : null}

      {sectionMap.how_it_works.is_visible ? <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow={sectionMap.how_it_works.subtitle || "Como funciona"} title={sectionMap.how_it_works.title} text={sectionMap.how_it_works.description || ""} />
        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {steps.map(([number, title, text], index) => (
            <article key={number} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <MiniVisual index={index} />
              <span className="mt-4 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--accent-strong)]">{number}</span>
              <h3 className="mt-3 text-base font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
            </article>
          ))}
        </div>
      </section> : null}

      {sectionMap.business_types.is_visible ? <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow={sectionMap.business_types.subtitle || "Rubros compatibles"} title={sectionMap.business_types.title} text={sectionMap.business_types.description || ""} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {content.businessTypes.filter((item) => item.is_visible).map((item) => (
            <article key={item.name} className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
              <div className="p-4">
                <SegmentVisual tag={item.name} imageLightUrl={item.image_light_url} imageDarkUrl={item.image_dark_url} altText={item.alt_text || item.name} forcedTheme={forcedTheme} />
                <h3 className="mt-4 text-base font-medium">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section> : null}

      {demoForm.is_visible ? <section id="demo" className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-soft">
          <p className="text-sm font-medium text-[var(--accent-strong)]">{demoForm.subtitle}</p>
          <h2 className="mt-2 text-3xl font-medium">{demoForm.title}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            {demoForm.description}
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
            {isPending ? "Enviando..." : demoForm.primary_cta_label || "Solicitar demo personalizada"}
          </button>
          <p className="text-center text-xs leading-5 text-[var(--text-muted)] md:col-span-2">{String(demoForm.metadata.legalText || "Te contactaremos por WhatsApp para agendar una demo personalizada.")}</p>
        </form>
      </section> : null}

      {finalCta.is_visible ? <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-soft md:p-8">
          <h2 className="text-3xl font-medium">{finalCta.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{finalCta.description}</p>
          {finalCta.primary_cta_label && finalCta.primary_cta_url ? <a href={finalCta.primary_cta_url} className="focus-ring mt-6 inline-flex min-h-12 items-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white shadow-panel">{finalCta.primary_cta_label}</a> : null}
        </div>
      </section> : null}

      {footer.is_visible ? <footer className="border-t border-[var(--line)] bg-[var(--surface)] px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>{footer.title}</span>
          {footer.primary_cta_label && footer.primary_cta_url ? <Link href={footer.primary_cta_url} className="font-medium text-[var(--text)]">{footer.primary_cta_label}</Link> : null}
        </div>
      </footer> : null}

      {!previewMode ? <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/92 p-3 backdrop-blur-xl sm:hidden">
        <a href={hero.primary_cta_url || "#demo"} className="focus-ring flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel">{hero.primary_cta_label || "Solicitar demo"}</a>
      </div> : null}
    </main>
  );
}

function HeroProductMockup({ section, forcedTheme }: { section: LandingSection; forcedTheme?: "light" | "dark" }) {
  const hasImage = Boolean(section.image_light_url);
  return (
    <div className="relative rounded-[32px] border border-white/70 bg-[var(--surface)] p-4 shadow-soft">
      {hasImage ? (
        <LandingImage section={section} forcedTheme={forcedTheme} className="min-h-[360px] rounded-[26px]" />
      ) : <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <div className="mx-auto w-full max-w-[280px]">
          <PhoneMockup />
        </div>
        <div className="grid content-center gap-4">
          <AdminMockup />
          <div className="grid gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--background)] p-4 sm:grid-cols-[110px_1fr]">
            <QrVisual />
            <div>
              <p className="text-sm font-medium">Un QR. Un link. Una carta siempre actualizada.</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">El cliente escanea, ve el menu y hace el pedido. El negocio actualiza desde el panel.</p>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}

function FeatureBlock({ section, visual, reverse, forcedTheme }: { section: LandingSection; visual: (typeof featureVisuals)[number]; reverse: boolean; forcedTheme?: "light" | "dark" }) {
  return (
    <article className="grid gap-5 rounded-[30px] border border-white/70 bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-2 lg:items-center lg:p-6">
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="text-sm font-medium text-[var(--accent-strong)]">{section.subtitle}</p>
        <h2 className="mt-2 text-3xl font-medium leading-tight">{section.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)] md:text-base">{section.description}</p>
      </div>
      <ProductVisual section={section} type={visual} forcedTheme={forcedTheme} />
    </article>
  );
}

function ProductVisual({ section, type, forcedTheme }: { section: LandingSection; type: (typeof featureVisuals)[number]; forcedTheme?: "light" | "dark" }) {
  if (section.image_light_url) {
    return <LandingImage section={section} forcedTheme={forcedTheme} className="min-h-[280px] rounded-[26px]" />;
  }

  if (type === "qr") {
    return (
      <div className="grid gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--background)] p-4 sm:grid-cols-[150px_1fr]">
        <QrVisual />
        <PhoneMockup compact />
      </div>
    );
  }

  if (type === "sync") {
    return (
      <div className="grid gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--background)] p-4 md:grid-cols-[1fr_auto_1fr]">
        <EditPanelMini />
        <span className="hidden h-10 w-10 place-items-center self-center rounded-full bg-[var(--accent)] text-white md:grid">OK</span>
        <PhoneMockup compact />
      </div>
    );
  }

  if (type === "orders") {
    return (
      <div className="grid gap-4 rounded-[26px] border border-[var(--line)] bg-[var(--background)] p-4 md:grid-cols-[0.85fr_1.15fr]">
        <CartMini />
        <OrdersPanelMini />
      </div>
    );
  }

  if (type === "calendar") {
    return (
      <div className="rounded-[26px] border border-[var(--line)] bg-[var(--background)] p-4">
        <CalendarMini />
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-[var(--line)] bg-[var(--background)] p-4">
      <DashboardMini />
    </div>
  );
}

function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mx-auto rounded-[34px] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-panel ${compact ? "max-w-[230px]" : "max-w-[280px]"}`}>
      <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--background)]">
        <div className="bg-gradient-to-br from-[var(--accent)] via-[var(--simi-aji-amarillo)] to-[#101827] p-4 text-white">
          <p className="text-xs text-white/78">Pollo Loco</p>
          <h3 className="mt-1 text-xl font-medium">Menu digital</h3>
          <div className="mt-3 rounded-full bg-white/18 px-3 py-2 text-xs">Buscar platos y combos</div>
        </div>
        <div className="grid gap-3 p-3">
          {["Combo familiar", "1/4 Pollo a la Brasa", "Chaufa de pollo"].map((item, index) => (
            <div key={item} className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-2">
              <span className="h-14 rounded-[14px] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface-muted)]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item}</span>
                <span className="block text-xs text-[var(--text-muted)]">S/ {index === 0 ? "56.00" : index === 1 ? "16.50" : "12.00"}</span>
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-medium text-white">+</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-panel ${compact ? "" : ""}`}>
      <div className="flex items-center gap-1 border-b border-[var(--line)] pb-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-3 rounded-full bg-[var(--background)] px-3 py-1 text-xs text-[var(--text-muted)]">Panel SIMI</span>
      </div>
      <div className="grid gap-3 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {["Activos", "Pagos", "Listos"].map((item, index) => (
            <span key={item} className="rounded-[14px] bg-[var(--background)] p-3 text-xs">
              <span className="block text-[var(--text-muted)]">{item}</span>
              <span className="mt-1 block text-lg font-medium">{index + 2}</span>
            </span>
          ))}
        </div>
        <div className="grid gap-2">
          {["Pedido #263220", "Pedido #263221", "Reserva 8:30 pm"].map((item) => (
            <span key={item} className="flex items-center justify-between rounded-[14px] border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-xs">
              <span>{item}</span>
              <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent-strong)]">Nuevo</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QrVisual() {
  const cells = [
    0, 1, 2, 4, 5, 7, 8, 9, 11, 13, 14, 16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 32, 34, 35,
    37, 38, 40, 42, 43, 45, 47, 48, 50, 52, 53, 55, 56, 58, 60, 61, 63
  ];
  return (
    <div className="grid aspect-square w-full max-w-[150px] grid-cols-8 gap-1 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-3">
      {Array.from({ length: 64 }).map((_, index) => (
        <span key={index} className={`rounded-[3px] ${cells.includes(index) ? "bg-[var(--text)]" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

function EditPanelMini() {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <p className="text-sm font-medium">Editar producto</p>
      <div className="mt-4 grid gap-3">
        <span className="rounded-[12px] bg-[var(--background)] p-3 text-xs text-[var(--text-muted)]">Precio: S/ 16.50</span>
        <span className="rounded-[12px] bg-[var(--background)] p-3 text-xs text-[var(--text-muted)]">Foto actualizada</span>
        <span className="rounded-full bg-[var(--accent)] px-4 py-3 text-center text-xs font-medium text-white">Guardar cambios</span>
      </div>
    </div>
  );
}

function CartMini() {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <p className="text-sm font-medium">Tu pedido</p>
      <div className="mt-4 grid gap-2 text-xs">
        <span className="flex justify-between rounded-[12px] bg-[var(--background)] p-3"><span>1x Combo</span><span>S/56</span></span>
        <span className="flex justify-between rounded-[12px] bg-[var(--background)] p-3"><span>Delivery</span><span>S/0</span></span>
        <span className="rounded-full bg-[var(--success)] px-4 py-3 text-center font-medium text-white">Enviar pedido</span>
      </div>
    </div>
  );
}

function OrdersPanelMini() {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <p className="text-sm font-medium">Centro de pedidos</p>
      <div className="mt-4 grid gap-2">
        {["Nuevo pedido", "Pago validado", "Listo para cocina"].map((item) => (
          <span key={item} className="rounded-[12px] bg-[var(--background)] px-3 py-2 text-xs text-[var(--text-muted)]">{item}</span>
        ))}
      </div>
    </div>
  );
}

function CalendarMini() {
  return (
    <div className="grid gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Agenda de hoy</p>
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-[var(--accent-strong)]">4 eventos</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 14 }).map((_, index) => (
          <span key={index} className={`grid h-10 place-items-center rounded-[12px] text-xs ${[2, 5, 10].includes(index) ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{index + 1}</span>
        ))}
      </div>
    </div>
  );
}

function DashboardMini() {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
        <div className="grid gap-2">
          {["Carta", "Pedidos", "Pagos", "Agenda"].map((item, index) => (
            <span key={item} className={`rounded-[12px] px-3 py-2 text-xs ${index === 1 ? "bg-[var(--accent)] text-white" : "bg-[var(--background)] text-[var(--text-muted)]"}`}>{item}</span>
          ))}
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-2">
            {["12", "5", "3"].map((value, index) => (
              <span key={value} className="rounded-[14px] bg-[var(--background)] p-3 text-center">
                <span className="block text-lg font-medium">{value}</span>
                <span className="text-xs text-[var(--text-muted)]">{["Pedidos", "Pagos", "Reservas"][index]}</span>
              </span>
            ))}
          </div>
          <span className="h-24 rounded-[16px] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--background)]" />
        </div>
      </div>
    </div>
  );
}

function MiniVisual({ index }: { index: number }) {
  return (
    <div className="rounded-[18px] border border-[var(--line)] bg-[var(--background)] p-3">
      <div className="grid gap-2">
        <span className="h-12 rounded-[14px] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface-muted)]" />
        <span className="h-3 w-2/3 rounded-full bg-[var(--line)]" />
        <span className={`h-8 rounded-[12px] ${index === 1 ? "bg-[var(--text)]" : "bg-[var(--surface)]"} border border-[var(--line)]`} />
      </div>
    </div>
  );
}

function SegmentVisual({ tag, imageLightUrl, imageDarkUrl, altText, forcedTheme }: { tag: string; imageLightUrl?: string | null; imageDarkUrl?: string | null; altText?: string | null; forcedTheme?: "light" | "dark" }) {
  const theme = useLandingTheme(forcedTheme);
  const src = theme === "dark" && imageDarkUrl ? imageDarkUrl : imageLightUrl;

  if (src) {
    return <img src={src} alt={altText || tag} className="h-32 w-full rounded-[18px] object-cover" loading="lazy" />;
  }

  return (
    <div className="rounded-[18px] bg-[var(--background)] p-3">
      <div className="h-24 rounded-[16px] bg-gradient-to-br from-[var(--accent-soft)] via-[var(--surface-muted)] to-[var(--background)] p-3">
        <span className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium shadow-panel">{tag}</span>
      </div>
    </div>
  );
}

function LandingImage({ section, className, forcedTheme }: { section: LandingSection; className?: string; forcedTheme?: "light" | "dark" }) {
  const theme = useLandingTheme(forcedTheme);
  const src = theme === "dark" && section.image_dark_url ? section.image_dark_url : section.image_light_url;
  if (!src) return null;
  return <img src={src} alt={section.alt_text || section.title} className={`w-full bg-[var(--accent-soft)] object-contain shadow-panel ${className || ""}`} loading="lazy" />;
}

function useLandingTheme(forcedTheme?: "light" | "dark") {
  const [theme, setTheme] = useState<"light" | "dark">(forcedTheme || "light");

  useEffect(() => {
    if (forcedTheme) {
      setTheme(forcedTheme);
      return;
    }

    function readTheme() {
      setTheme((document.documentElement.dataset.theme as "light" | "dark" | undefined) || "light");
    }

    readTheme();
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [forcedTheme]);

  return theme;
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
