import { OrdersBoard } from "@/components/admin/OrdersBoard";
import { OrdersAutoRefresh } from "@/components/admin/OrdersAutoRefresh";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminClientOrders } from "@/lib/menu-data";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await requireAdmin();
  requireModuleAccess(context, "orders");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, orders] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminClientOrders(clientId)
  ]);

  return (
    <div className="grid gap-6">
      <OrdersAutoRefresh clientId={clientId} />
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-medium">Centro de pedidos</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Opera pedidos por estado, valida pagos, revisa cocina y atiende alertas sin salir del tablero.</p>
          {searchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Pedido actualizado correctamente.</p> : null}
          {searchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{searchParams.error}</p> : null}
        </div>
        <p className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">Se actualiza cada 5 segundos.</p>
      </div>
      <OrdersBoard clients={(clients || []) as Client[]} orders={orders} />
    </div>
  );
}
