import { OrdersAutoRefresh } from "@/components/admin/OrdersAutoRefresh";
import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminClientOrders } from "@/lib/menu-data";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "kitchen");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, orders] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminClientOrders(clientId)
  ]);

  const activeOrders = orders.filter((order) => order.order_status !== "delivered" && order.order_status !== "cancelled");

  return (
    <div className="grid gap-4 lg:gap-5">
      <OrdersAutoRefresh clientId={clientId} />
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-medium">Cocina y reparto</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Controla preparacion, salida del repartidor, camino, llegada y entrega.</p>
          {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Estado actualizado correctamente.</p> : null}
          {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
        </div>
        <p className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">Realtime + refresco automatico.</p>
      </div>
      <OrdersBoard clients={(clients || []) as Client[]} orders={activeOrders} surface="kitchen" />
    </div>
  );
}
