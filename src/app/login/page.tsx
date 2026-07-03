import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const initialMessage = resolvedSearchParams.error === "unauthorized" ? "No tienes permisos para acceder al panel." : "";

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[var(--simi-carbon-parrilla)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-l from-[var(--accent)]/55 via-[var(--simi-aji-amarillo)]/18 to-transparent" />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-[16px] bg-white shadow-panel">
              <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="h-full w-full object-cover" />
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
            <div key={benefit} className="rounded-[18px] bg-white/10 px-4 py-3 text-sm text-white/82 ring-1 ring-white/10">{benefit}</div>
          ))}
        </div>
      </section>

      <section className="grid place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="mx-auto h-20 w-20 rounded-[22px] shadow-panel" />
            <h1 className="mt-3 text-3xl font-medium">SIMI</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Sistema inteligente para negocios gastronomicos.</p>
          </div>
          <div className="mb-5">
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
