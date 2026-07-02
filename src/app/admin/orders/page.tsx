import { ManualOrderDrawer } from "@/components/admin/ManualOrderDrawer";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { OrdersAutoRefresh } from "@/components/admin/OrdersAutoRefresh";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminClientOrders, getAdminManualOrderCatalog } from "@/lib/menu-data";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "orders");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, orders, manualCatalog] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminClientOrders(clientId),
    getAdminManualOrderCatalog(clientId)
  ]);
  const availableClients = ((clients || manualCatalog.clients) as Client[]) || [];

  return (
    <div className="grid gap-6">
      <OrdersAutoRefresh clientId={clientId} />
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-medium">Pedidos</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Controla pedidos, pagos y delivery desde una sola vista.</p>
          {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Pedido actualizado correctamente.</p> : null}
          {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ManualOrderDrawer
            clients={availableClients}
            categories={manualCatalog.categories}
            items={manualCatalog.items}
            tables={manualCatalog.tables}
            deliveryZones={manualCatalog.deliveryZones}
            defaultClientId={clientId}
          />
          <p className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">Se actualiza cada 5 segundos.</p>
        </div>
      </div>
      <OrdersBoard clients={availableClients} orders={orders} />
    </div>
  );
}
