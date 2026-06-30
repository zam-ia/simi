import { signOutAction } from "@/lib/actions";
import { hasModuleAccess, requireAdmin } from "@/lib/auth";
import { businessRoleLabels } from "@/lib/permissions";
import { Button, LinkButton } from "@/components/shared/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAdmin();
  const { user, role, businessRole } = context;
  const isSuperAdmin = role === "super_admin";

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--text-muted)]">SIMI</p>
            <h1 className="text-xl font-medium">{isSuperAdmin ? "Panel super administrador" : "Panel del negocio"}</h1>
            {!isSuperAdmin && businessRole ? <p className="mt-1 text-sm text-[var(--text-muted)]">{businessRoleLabels[businessRole]}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--text-muted)]">{user.email}</span>
            <ThemeToggle />
            <LinkButton href="/admin" variant="secondary">Inicio</LinkButton>
            {hasModuleAccess(context, "kitchen") ? <LinkButton href="/admin/kitchen" variant="secondary">Cocina</LinkButton> : null}
            {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders" variant="secondary">Pedidos</LinkButton> : null}
            {hasModuleAccess(context, "delivery") ? <LinkButton href="/admin/delivery" variant="secondary">Delivery</LinkButton> : null}
            {hasModuleAccess(context, "promotions") ? <LinkButton href="/admin/promotions" variant="secondary">Promos</LinkButton> : null}
            {hasModuleAccess(context, "reservations") ? <LinkButton href="/admin/reservations" variant="secondary">Reservas</LinkButton> : null}
            {hasModuleAccess(context, "payments") ? <LinkButton href="/admin/payments" variant="secondary">Pagos</LinkButton> : null}
            {hasModuleAccess(context, "users") ? <LinkButton href="/admin/users" variant="secondary">Usuarios</LinkButton> : null}
            {isSuperAdmin ? <LinkButton href="/admin/clients/new">Nuevo cliente</LinkButton> : hasModuleAccess(context, "settings") ? <LinkButton href="/admin/settings">Configuracion</LinkButton> : null}
            <form action={signOutAction}>
              <Button type="submit" variant="secondary">
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
