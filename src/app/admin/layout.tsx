import { hasModuleAccess, requireAdmin } from "@/lib/auth";
import { getBusinessModuleLabels } from "@/constants/commercial";
import { businessRoleLabels } from "@/lib/permissions";
import { AdminShell, type AdminShellItem } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAdmin();
  const { user, role, businessRole, client } = context;
  const isSuperAdmin = role === "super_admin";
  const moduleLabels = getBusinessModuleLabels(client?.business_type);
  const items: AdminShellItem[] = [
    { label: isSuperAdmin ? "Negocios" : "Inicio", href: "/admin", icon: "home", isExact: true },
    ...(isSuperAdmin ? [{ label: "Demos", href: "/admin/demos", icon: "demos" as const }] : []),
    ...(isSuperAdmin ? [{ label: "Blog", href: "/admin/blog", icon: "blog" as const }] : []),
    ...(hasModuleAccess(context, "menu") && client ? [{ label: moduleLabels.catalog, href: `/admin/clients/${client.id}`, icon: "menu" as const }] : []),
    ...(hasModuleAccess(context, "kitchen") ? [{ label: moduleLabels.kitchen, href: "/admin/kitchen", icon: "kitchen" as const }] : []),
    ...(hasModuleAccess(context, "orders") ? [{ label: "Pedidos", href: "/admin/orders", icon: "orders" as const }] : []),
    ...(hasModuleAccess(context, "delivery") ? [{ label: "Delivery", href: "/admin/delivery", icon: "delivery" as const }] : []),
    ...(hasModuleAccess(context, "promotions") ? [{ label: "Promos", href: "/admin/promotions", icon: "promotions" as const }] : []),
    ...(hasModuleAccess(context, "reservations") ? [{ label: moduleLabels.reservations, href: "/admin/reservations", icon: "reservations" as const }] : []),
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
