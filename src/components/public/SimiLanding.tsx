"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { businessTypeOptions } from "@/constants/commercial";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const featureBlocks = [
  {
    eyebrow: "QR + link",
    title: "QR permanente + link para redes",
    text: "Pon tu carta en mesas, Instagram, WhatsApp o Google Maps sin volver a cambiar el QR.",
    visual: "qr"
  },
  {
    eyebrow: "Carta actualizable",
    title: "Actualiza tu menu en segundos",
    text: "Edita precios, productos, fotos o promociones desde tu panel y el cambio se refleja en tu carta digital.",
    visual: "sync"
  },
  {
    eyebrow: "Pedidos",
    title: "Pedidos mas ordenados",
    text: "Recibe pedidos para mesa, recojo o delivery desde el mismo menu, sin depender de chats desordenados.",
    visual: "orders"
  },
  {
    eyebrow: "Agenda",
    title: "Agenda y reservas segun tu negocio",
    text: "Organiza reservas, pedidos programados o entregas desde una vista mas clara.",
    visual: "calendar"
  },
  {
    eyebrow: "Panel",
    title: "Controla tu negocio desde un solo panel",
    text: "Gestiona carta, pedidos, pagos, agenda y operacion desde una interfaz clara.",
    visual: "dashboard"
  }
] as const;

const steps = [
  ["01", "Configuramos tu carta", "Productos, precios, fotos y categorias."],
  ["02", "Te damos tu QR y link", "Para mesas, redes, WhatsApp o Google Maps."],
  ["03", "Tus clientes ven y piden", "Mesa, recojo o delivery desde el celular."],
  ["04", "Tu gestionas el negocio", "Carta, pedidos, pagos, reservas o agenda."]
];

const segments = [
  ["Restaurantes", "Menu + pedido en mesa + reservas", "Mesa 12"],
  ["Pastelerias", "Catalogo + agenda de entregas", "Entrega sabado"],
  ["Cafeterias", "Recojo + delivery + venta rapida", "Recojo 15 min"],
  ["Pollerias", "Combos + cocina + delivery", "Combo familiar"]
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

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
        <div>
          <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">QR permanente + carta viva + pedidos ordenados</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-medium leading-[1.04] tracking-normal md:text-6xl">Tu carta cambia. Tu QR no.</h1>
          <p className="mt-4 max-w-2xl text-xl font-medium leading-8 text-[var(--text)] md:text-2xl md:leading-9">
            Deja de reenviar tu carta cada vez que cambias precios, platos o promociones.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)] md:text-lg md:leading-8">
            Con SIMI tienes una carta digital con QR permanente y un link para redes donde tus clientes ven el menu actualizado y hacen pedidos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#demo" className="focus-ring rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--simi-aji-amarillo)] px-6 py-3 text-sm font-medium text-white shadow-panel">Solicitar demo</a>
            <Link href="/menu/pollo-loco" className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-medium shadow-panel">Ver ejemplo</Link>
          </div>
        </div>

        <HeroProductMockup />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:px-8">
        {featureBlocks.map((feature, index) => (
          <FeatureBlock key={feature.title} feature={feature} reverse={index % 2 === 1} />
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-2 lg:p-6">
          <div>
            <p className="text-sm font-medium text-[var(--accent-strong)]">Experiencia real</p>
            <h2 className="mt-2 text-3xl font-medium">Asi lo ve tu cliente. Asi lo ves tu.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)]">Explora como se veria una carta digital moderna y como se gestiona desde el panel del negocio.</p>
            <Link href="/menu/pollo-loco" className="focus-ring mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white">Ver ejemplo</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <PhoneMockup compact />
            <AdminMockup compact />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow="Como funciona" title="Cuatro pasos. Sin complicar al cliente." text="Cada paso tiene una accion clara y una vista simple para el negocio." />
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
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <SectionHeading eyebrow="Rubros compatibles" title="SIMI se adapta al tipo de negocio." text="La misma base se adapta a carta, catalogo, agenda, pedidos o delivery segun el rubro." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map(([title, text, tag]) => (
            <article key={title} className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
              <div className="p-4">
                <SegmentVisual tag={tag} />
                <h3 className="mt-4 text-base font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p>
              </div>
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
          <h2 className="text-3xl font-medium">Que el cliente vea el menu. Que tu equipo vea el control.</h2>
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

function HeroProductMockup() {
  return (
    <div className="relative rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
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
      </div>
    </div>
  );
}

function FeatureBlock({ feature, reverse }: { feature: (typeof featureBlocks)[number]; reverse: boolean }) {
  return (
    <article className="grid gap-5 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-2 lg:items-center lg:p-6">
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="text-sm font-medium text-[var(--accent-strong)]">{feature.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-medium leading-tight">{feature.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)] md:text-base">{feature.text}</p>
      </div>
      <ProductVisual type={feature.visual} />
    </article>
  );
}

function ProductVisual({ type }: { type: (typeof featureBlocks)[number]["visual"] }) {
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

function SegmentVisual({ tag }: { tag: string }) {
  return (
    <div className="rounded-[18px] bg-[var(--background)] p-3">
      <div className="h-24 rounded-[16px] bg-gradient-to-br from-[var(--accent-soft)] via-[var(--surface-muted)] to-[var(--background)] p-3">
        <span className="inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium shadow-panel">{tag}</span>
      </div>
    </div>
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
