import { ClientTable } from "@/components/admin/ClientTable";
import { LinkButton } from "@/components/shared/Button";
import { hasModuleAccess, requireAdmin } from "@/lib/auth";
import { formatPrice, getPublicMenuUrl } from "@/lib/utils";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const context = await requireAdmin();
  const { supabase, role, client } = context;

  if (role === "business_admin" && client) {
    const [{ count: categoryCount }, { count: productCount }, { count: tableCount }, { data: recentOrders }] = await Promise.all([
      supabase.from("menu_categories").select("id", { count: "exact", head: true }).eq("client_id", client.id),
      supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("client_id", client.id),
      supabase.from("client_tables").select("id", { count: "exact", head: true }).eq("client_id", client.id).eq("is_active", true),
      supabase.from("orders").select("id,total,order_status,payment_status,created_at").eq("client_id", client.id).order("created_at", { ascending: false }).limit(3)
    ]);

    const publicUrl = getPublicMenuUrl(client.slug);

    return (
      <div className="grid gap-6">
        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <p className="text-sm text-[var(--text-muted)]">Panel del negocio</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-medium">{client.name}</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Gestiona tu carta, mesas, pedidos y numero de notificaciones.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasModuleAccess(context, "menu") ? <LinkButton href={`/admin/clients/${client.id}`} variant="secondary">Editar carta</LinkButton> : null}
              {hasModuleAccess(context, "kitchen") ? <LinkButton href="/admin/kitchen" variant="secondary">Cocina</LinkButton> : null}
              {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders">Pedidos</LinkButton> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            ["Categorias", categoryCount || 0],
            ["Productos", productCount || 0],
            ["Mesas activas", tableCount || 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <p className="text-sm text-[var(--text-muted)]">{label}</p>
              <p className="mt-2 text-2xl font-medium">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-medium">Accesos rapidos</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Todo lo que necesita el encargado para operar la carta.</p>
            </div>
            <LinkButton href={publicUrl} variant="secondary" target="_blank">Ver menu publico</LinkButton>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {hasModuleAccess(context, "menu") ? <LinkButton href={`/admin/clients/${client.id}`} variant="secondary" className="justify-start rounded-[var(--radius-card)] px-4 py-4">Carta y productos</LinkButton> : null}
            {hasModuleAccess(context, "kitchen") ? <LinkButton href="/admin/kitchen" variant="secondary" className="justify-start rounded-[var(--radius-card)] px-4 py-4">Cocina y reparto</LinkButton> : null}
            {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders" variant="secondary" className="justify-start rounded-[var(--radius-card)] px-4 py-4">Pedidos y pagos</LinkButton> : null}
            {hasModuleAccess(context, "settings") ? <LinkButton href="/admin/settings" variant="secondary" className="justify-start rounded-[var(--radius-card)] px-4 py-4">Configuracion</LinkButton> : null}
            {hasModuleAccess(context, "users") ? <LinkButton href="/admin/users" variant="secondary" className="justify-start rounded-[var(--radius-card)] px-4 py-4">Usuarios y roles</LinkButton> : null}
          </div>
        </section>

        <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-medium">Ultimos pedidos</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Vista rapida para revisar actividad reciente.</p>
            </div>
            {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders" variant="ghost">Ver todos</LinkButton> : null}
          </div>
          {recentOrders?.length ? (
            <div className="grid gap-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm">
                  <span>{new Date(order.created_at).toLocaleString("es-PE")}</span>
                  <span className="text-[var(--text-muted)]">{order.order_status} / {order.payment_status}</span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay pedidos registrados para este negocio.</p>
          )}
        </section>
      </div>
    );
  }

  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-medium">Clientes</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Gestiona negocios, enlaces publicos y QR permanentes.</p>
      </div>
      {error ? (
        <div className="rounded-[var(--radius-card)] bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">No se pudo cargar el listado de clientes.</div>
      ) : (
        <ClientTable clients={(data || []) as Client[]} />
      )}
    </div>
  );
}
