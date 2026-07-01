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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    const [{ count: categoryCount }, { count: productCount }, { count: tableCount }, { data: recentOrders }, { data: todayOrders }, { count: pendingPaymentCount }] = await Promise.all([
      supabase.from("menu_categories").select("id", { count: "exact", head: true }).eq("client_id", client.id),
      supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("client_id", client.id),
      supabase.from("client_tables").select("id", { count: "exact", head: true }).eq("client_id", client.id).eq("is_active", true),
      supabase.from("orders").select("id,total,order_status,payment_status,created_at,order_type,customer_name,delivery_address,table_label").eq("client_id", client.id).order("created_at", { ascending: false }).limit(6),
      supabase.from("orders").select("id,total,order_status,payment_status,created_at").eq("client_id", client.id).gte("created_at", todayIso),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("client_id", client.id).in("payment_status", ["pending_payment", "proof_submitted"])
    ]);

    const publicUrl = getPublicMenuUrl(client.slug);
    const ordersToday = todayOrders || [];
    const activeOrders = ordersToday.filter((order) => order.order_status !== "delivered" && order.order_status !== "cancelled");
    const revenueToday = ordersToday.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageTicket = ordersToday.length > 0 ? revenueToday / ordersToday.length : 0;
    const newOrders = activeOrders.filter((order) => order.order_status === "new" || order.order_status === "payment_pending");
    const preparingOrders = activeOrders.filter((order) => ["received", "payment_validated", "preparing"].includes(order.order_status));
    const readyOrders = activeOrders.filter((order) => ["ready", "handed_to_courier", "on_the_way", "arriving"].includes(order.order_status));
    const problemOrders = ordersToday.filter((order) => order.payment_status === "proof_submitted" || order.order_status === "new" || order.order_status === "payment_pending");

    return (
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-soft">
          <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Panel del negocio</p>
              <h2 className="mt-2 text-3xl font-medium">{client.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-[var(--text-muted)]">Controla pedidos, pagos, carta y reservas desde una vista preparada para operar en hora punta.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasModuleAccess(context, "menu") ? <LinkButton href={`/admin/clients/${client.id}`} variant="secondary">Editar carta</LinkButton> : null}
              {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders">Pedidos</LinkButton> : null}
              <LinkButton href={publicUrl} variant="secondary" target="_blank">Ver carta publica</LinkButton>
            </div>
          </div>
          {problemOrders.length > 0 ? (
            <div className="border-t border-[var(--line)] bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:bg-amber-950/35 dark:text-amber-100">
              Hay {problemOrders.length} pedido{problemOrders.length === 1 ? "" : "s"} que necesitan revision: pagos enviados o pedidos nuevos sin avanzar.
            </div>
          ) : (
            <div className="border-t border-[var(--line)] bg-green-50 px-5 py-3 text-sm text-green-800 dark:bg-green-950/35 dark:text-green-100">Operacion estable: no hay alertas criticas en los pedidos de hoy.</div>
          )}
        </section>

        <section className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Estado operativo</p>
                <h3 className="mt-1 text-2xl font-medium">Local activo</h3>
                <p className="mt-2 max-w-xl text-sm leading-5 text-[var(--text-muted)]">Prioriza aceptar pedidos nuevos, validar comprobantes y mover cocina sin dejar pedidos detenidos.</p>
              </div>
              {hasModuleAccess(context, "orders") ? <LinkButton href="/admin/orders">Ver pedidos</LinkButton> : null}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <OperationStep label="Nuevos" value={newOrders.length} tone="amber" />
              <OperationStep label="Preparando" value={preparingOrders.length} tone="blue" />
              <OperationStep label="Listos / camino" value={readyOrders.length} tone="green" />
            </div>
          </div>

          <div className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
            <p className="text-sm text-[var(--text-muted)]">Regla de hora punta</p>
            <h3 className="mt-1 text-xl font-medium">Responder antes de 5 min</h3>
            <div className="mt-4 grid gap-2 text-sm text-[var(--text-muted)]">
              <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">1. Acepta o revisa cada pedido nuevo.</p>
              <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">2. Marca agotados para evitar cancelaciones.</p>
              <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3">3. Mueve cocina a listo apenas termine.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Pedidos activos", activeOrders.length, "Ahora"],
            ["Ingresos hoy", formatPrice(revenueToday), "Venta del dia"],
            ["Ticket promedio", formatPrice(averageTicket), "Pedidos de hoy"],
            ["Productos", productCount || 0, `${categoryCount || 0} categorias`]
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <p className="text-sm text-[var(--text-muted)]">{label}</p>
              <p className="mt-2 text-2xl font-medium">{value}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{helper}</p>
            </div>
          ))}
        </section>

        {pendingPaymentCount ? (
          <div className="rounded-[var(--radius-card)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-panel dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
            Hay {pendingPaymentCount} pago{pendingPaymentCount === 1 ? "" : "s"} por revisar. Validarlos rapido reduce dudas del comensal y evita retrasos en cocina.
          </div>
        ) : null}

        <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-medium">Accesos rapidos</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Acciones pensadas para el encargado durante la operacion diaria.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {hasModuleAccess(context, "orders") ? <QuickAction href="/admin/orders" title="Validar pedidos y pagos" description="Revisa comprobantes, cambia estados y contacta al cliente." /> : null}
            {hasModuleAccess(context, "kitchen") ? <QuickAction href="/admin/kitchen" title="Cocina y reparto" description="Avanza pedidos desde recibido hasta entregado." /> : null}
            {hasModuleAccess(context, "menu") ? <QuickAction href={`/admin/clients/${client.id}`} title="Carta y productos" description="Actualiza precios, fotos, stock, promociones y portada." /> : null}
            {hasModuleAccess(context, "delivery") ? <QuickAction href="/admin/delivery" title="Zonas de delivery" description="Configura cobertura, costo minimo y tiempos estimados." /> : null}
            {hasModuleAccess(context, "reservations") ? <QuickAction href="/admin/reservations" title="Reservas" description="Confirma mesas y evita cruces de horario." /> : null}
            {hasModuleAccess(context, "settings") ? <QuickAction href="/admin/settings" title="Configuracion" description="Datos del negocio, horarios y metodos operativos." /> : null}
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
                <div key={order.id} className="grid gap-2 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-medium">{order.customer_name || order.table_label || order.delivery_address || "Cliente sin nombre"}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(order.created_at).toLocaleString("es-PE")}</p>
                  </div>
                  <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">{order.order_status} / {order.payment_status}</span>
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

function OperationStep({ label, value, tone }: { label: string; value: number; tone: "amber" | "blue" | "green" }) {
  const tones = {
    amber: "bg-amber-100 text-amber-900 dark:bg-amber-950/35 dark:text-amber-100",
    blue: "bg-blue-100 text-blue-900 dark:bg-blue-950/35 dark:text-blue-100",
    green: "bg-green-100 text-green-900 dark:bg-green-950/35 dark:text-green-100"
  };

  return (
    <div className={`rounded-[var(--radius-card)] p-3 ${tones[tone]}`}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-medium">{value}</p>
    </div>
  );
}

function QuickAction({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <LinkButton href={href} variant="secondary" className="grid h-auto justify-start rounded-[var(--radius-card)] px-4 py-4 text-left">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs font-normal leading-5 text-[var(--text-muted)]">{description}</span>
    </LinkButton>
  );
}
