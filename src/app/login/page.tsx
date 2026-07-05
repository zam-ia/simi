import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const initialMessage = resolvedSearchParams.error === "unauthorized" ? "No tienes permisos para acceder al panel." : "";
  const benefits = ["Carta digital QR", "Pedidos online", "Reservas y agenda", "Delivery y recojo", "Panel administrativo"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--login-bg)] text-[var(--login-text)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,color-mix(in_srgb,var(--login-blue)_24%,transparent),transparent_28rem),radial-gradient(circle_at_84%_18%,color-mix(in_srgb,var(--login-gold)_22%,transparent),transparent_24rem),linear-gradient(135deg,var(--login-bg)_0%,var(--login-bg-soft)_100%)]" />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle compact />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,3fr)_minmax(420px,2fr)]">
        <section className="hidden p-8 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-[16px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
              <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-lg font-medium">SIMI</span>
              <span className="block text-sm text-[var(--login-muted)]">Ecosistema privado para clientes</span>
            </span>
          </Link>

          <div className="grid gap-10">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--login-gold)_46%,transparent)] bg-[color-mix(in_srgb,var(--login-gold)_12%,transparent)] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--login-gold)]">
                Acceso privado para clientes SIMI
              </span>
              <h1 className="mt-6 max-w-2xl text-5xl font-medium leading-[1.02] tracking-[-0.02em] xl:text-6xl">
                Gestiona tu restaurante desde un solo panel inteligente
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--login-muted)]">
              Accede a tu carta digital, pedidos, reservas, delivery y operaciones en tiempo real.
              </p>
            </div>

            <div className="flex max-w-2xl flex-wrap gap-3">
              {benefits.map((benefit) => (
                <span key={benefit} className="rounded-full border border-[var(--login-line)] bg-[var(--login-panel)] px-4 py-2 text-sm text-[var(--login-text)] shadow-[0_12px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  {benefit}
                </span>
              ))}
            </div>
          </div>

          <MiniDashboardPreview />
        </section>

        <section className="grid min-h-screen place-items-center px-4 py-20 sm:px-6 lg:min-h-0 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="mx-auto h-20 w-20 rounded-[22px] shadow-[0_20px_60px_rgba(15,23,42,0.18)]" />
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-[var(--login-gold)]">Acceso privado para clientes SIMI</p>
              <h1 className="mt-3 text-3xl font-medium leading-tight">Gestiona tu restaurante desde un solo panel inteligente</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--login-muted)]">Pedidos, reservas y operaciones en tiempo real.</p>
            </div>

            <LoginForm initialMessage={initialMessage} />

            <p className="mt-5 text-center text-xs leading-5 text-[var(--login-muted)]">
              Acceso seguro - Sesion protegida - Usuarios autorizados
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniDashboardPreview() {
  const metrics = [
    { label: "Pedidos activos", value: "12", tone: "blue" },
    { label: "Reservas de hoy", value: "8", tone: "gold" },
    { label: "Carta QR activa", value: "100%", tone: "green" }
  ];

  return (
    <div className="relative mb-2 max-w-2xl rounded-[32px] border border-[var(--login-line)] bg-[var(--login-panel)] p-5 shadow-[0_30px_90px_rgba(15,23,42,0.20)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-[var(--login-line)] pb-4">
        <div>
          <p className="text-xs text-[var(--login-muted)]">Vista operativa</p>
          <h2 className="mt-1 text-xl font-medium">Panel SIMI</h2>
        </div>
        <span className="rounded-full bg-[color-mix(in_srgb,var(--login-success)_14%,transparent)] px-3 py-1 text-xs font-medium text-[var(--login-success)]">En vivo</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[20px] border border-[var(--login-line)] bg-[color-mix(in_srgb,var(--login-panel-solid)_78%,transparent)] p-4">
            <p className="text-xs text-[var(--login-muted)]">{metric.label}</p>
            <p className="mt-2 text-3xl font-medium">{metric.value}</p>
            <span className={`mt-3 block h-1.5 rounded-full ${metric.tone === "blue" ? "bg-[var(--login-blue)]" : metric.tone === "gold" ? "bg-[var(--login-gold)]" : "bg-[var(--login-success)]"}`} />
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {[
          { title: "Pedido #263220", meta: "Combo familiar - Pago validado", status: "Listo" },
          { title: "Reserva mesa 4", meta: "Hoy 8:30 p. m. - 4 personas", status: "Confirmada" },
          { title: "Carta digital", meta: "QR permanente - 32 productos activos", status: "Publicada" }
        ].map((item) => (
          <div key={item.title} className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--login-line)] bg-[color-mix(in_srgb,var(--login-panel-solid)_62%,transparent)] px-4 py-3">
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--login-muted)]">{item.meta}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--login-blue)_12%,transparent)] px-3 py-1 text-xs font-medium text-[var(--login-blue)]">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
