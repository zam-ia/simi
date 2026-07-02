import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const initialMessage = resolvedSearchParams.error === "unauthorized" ? "No tienes permisos para acceder al panel." : "";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/simi/brand_app_icons/SIMI_icono.svg" alt="SIMI" className="mx-auto h-20 w-20 rounded-[22px] shadow-panel" />
          <p className="text-sm text-[var(--text-muted)]">Panel administrador</p>
          <h1 className="mt-2 text-3xl font-medium">SIMI</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Gestiona cartas digitales, QR y pedidos por WhatsApp desde un solo lugar.</p>
        </div>
        <LoginForm initialMessage={initialMessage} />
      </div>
    </main>
  );
}
