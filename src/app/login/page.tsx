import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const initialMessage = resolvedSearchParams.error === "unauthorized" ? "No tienes permisos para acceder al panel." : "";

  return (
    <main className="grid min-h-screen bg-[var(--background)] text-[var(--text)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0b111c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,106,0,0.24),transparent_28rem),linear-gradient(135deg,rgba(255,90,31,0.20),transparent_42%)]" />
        <div className="absolute -right-28 top-12 h-80 w-80 rounded-full bg-[var(--accent)]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[var(--simi-aji-amarillo)]/12 blur-3xl" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-[16px] bg-white shadow-panel">
              <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="h-full w-full object-cover" />
            </span>
            <span>
              <span className="block text-lg font-medium">SIMI</span>
              <span className="block text-sm text-white/68">Sistema inteligente para negocios gastronomicos.</span>
            </span>
          </Link>
          <div className="mt-20 max-w-xl">
            <p className="text-sm text-white/65">Panel privado</p>
            <h1 className="mt-3 text-5xl font-medium leading-[1.04]">Gestiona carta, pedidos, agenda y operaciones desde un solo lugar.</h1>
            <p className="mt-5 text-base leading-7 text-white/70">Acceso exclusivo para clientes y equipo autorizado de SIMI.</p>
          </div>
        </div>
        <div className="relative grid gap-3 sm:grid-cols-2">
          {["Carta digital con QR permanente", "Link para redes", "Pedidos online", "Reservas y agenda", "Delivery y recojo", "Panel administrativo"].map((benefit) => (
            <div key={benefit} className="rounded-[18px] bg-white/[0.08] px-4 py-3 text-sm text-white/82 shadow-[0_12px_34px_rgba(0,0,0,0.18)] ring-1 ring-white/10 backdrop-blur">{benefit}</div>
          ))}
        </div>
      </section>

      <section className="relative grid place-items-center px-4 py-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle compact />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_24rem)]" />
        <div className="relative w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <img src="/simi/brand_app_icons/simi-app-icon.png" alt="SIMI" className="mx-auto h-20 w-20 rounded-[22px] shadow-panel" />
            <h1 className="mt-3 text-3xl font-medium">SIMI</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Sistema inteligente para negocios gastronomicos.</p>
          </div>
          <div className="mb-5 rounded-[28px] border border-[var(--line)] bg-[var(--surface)]/78 p-5 shadow-panel backdrop-blur-xl">
            <p className="text-sm text-[var(--text-muted)]">Panel administrador</p>
            <h2 className="mt-1 text-3xl font-medium">Ingresar</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Usa tu correo autorizado para entrar al panel.</p>
          </div>
          <LoginForm initialMessage={initialMessage} />
        </div>
      </section>
    </main>
  );
}
