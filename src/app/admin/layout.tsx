import { hasModuleAccess, requireAdmin } from "@/lib/auth";
import { businessRoleLabels } from "@/lib/permissions";
import { AdminShell, type AdminShellItem } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAdmin();
  const { user, role, businessRole, client } = context;
  const isSuperAdmin = role === "super_admin";
  const items: AdminShellItem[] = [
    { label: isSuperAdmin ? "Clientes" : "Inicio", href: "/admin", icon: "home", isExact: true },
    ...(hasModuleAccess(context, "menu") && client ? [{ label: "Carta", href: `/admin/clients/${client.id}`, icon: "menu" as const }] : []),
    ...(hasModuleAccess(context, "kitchen") ? [{ label: "Cocina", href: "/admin/kitchen", icon: "kitchen" as const }] : []),
    ...(hasModuleAccess(context, "orders") ? [{ label: "Pedidos", href: "/admin/orders", icon: "orders" as const }] : []),
    ...(hasModuleAccess(context, "delivery") ? [{ label: "Delivery", href: "/admin/delivery", icon: "delivery" as const }] : []),
    ...(hasModuleAccess(context, "promotions") ? [{ label: "Promos", href: "/admin/promotions", icon: "promotions" as const }] : []),
    ...(hasModuleAccess(context, "reservations") ? [{ label: "Reservas", href: "/admin/reservations", icon: "reservations" as const }] : []),
    ...(hasModuleAccess(context, "payments") ? [{ label: "Pagos", href: "/admin/payments", icon: "payments" as const }] : []),
    ...(hasModuleAccess(context, "settings") ? [{ label: "Configuracion", href: "/admin/settings", icon: "settings" as const }] : []),
    ...(hasModuleAccess(context, "users") ? [{ label: "Usuarios", href: "/admin/users", icon: "users" as const }] : [])
  ];

  return (
    <AdminShell
      title={isSuperAdmin ? "Panel super administrador" : client?.name || "Panel del negocio"}
      subtitle={!isSuperAdmin && businessRole ? businessRoleLabels[businessRole] : "SIMI"}
      userEmail={user.email || ""}
      items={items}
      alertClientId={isSuperAdmin ? undefined : client?.id}
      primaryAction={isSuperAdmin ? { label: "Nuevo cliente", href: "/admin/clients/new" } : undefined}
    >
      {children}
    </AdminShell>
  );
}
