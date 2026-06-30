import { ClientForm } from "@/components/admin/ClientForm";
import { createClientAction } from "@/lib/actions";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewClientPage({ searchParams }: { searchParams: { error?: string } }) {
  const context = await requireAdmin();
  requireSuperAdmin(context);

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-medium">Nuevo cliente</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Crea un negocio y deja listo su enlace público para QR.</p>
      </div>
      <ClientForm action={createClientAction} error={searchParams.error} />
    </div>
  );
}
