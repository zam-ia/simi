import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { createDeliveryZoneAction, deleteDeliveryZoneAction, updateDeliveryZoneAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminGrowthModules } from "@/lib/menu-data";
import { formatPrice } from "@/lib/utils";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminDeliveryPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, growth] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminGrowthModules(clientId)
  ]);
  const clientRows = (clients || []) as Client[];

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-medium">Delivery por zonas</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Define costos, pedidos minimos y tiempos estimados sin usar mapas pagados todavia.</p>
        {searchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Zona guardada correctamente.</p> : null}
        {searchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{searchParams.error}</p> : null}
        {growth.missingGrowthTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 009 en Supabase para habilitar este modulo.</p> : null}
      </div>

      <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <h3 className="text-lg font-medium">Nueva zona</h3>
        <form action={createDeliveryZoneAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {role === "business_admin" ? <input type="hidden" name="client_id" value={client!.id} /> : <ClientSelect clients={clientRows} />}
          <Input name="name" label="Nombre de zona" placeholder="Ej. Cercado, Miraflores, Zona 1" required />
          <Input name="delivery_fee" label="Costo de delivery" type="number" step="0.1" min="0" defaultValue="0" />
          <Input name="minimum_order" label="Pedido minimo" type="number" step="0.1" min="0" defaultValue="0" />
          <Input name="estimated_time" label="Tiempo estimado" placeholder="Ej. 30 a 45 min" />
          <Input name="display_order" label="Orden" type="number" defaultValue="0" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium text-[var(--text)]">Descripcion</span>
            <textarea name="description" className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" placeholder="Distritos, referencias o condiciones de cobertura." />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Zona activa
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Crear zona</Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        {growth.zones.length ? (
          growth.zones.map((zone) => (
            <div key={zone.id} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <form action={updateDeliveryZoneAction.bind(null, zone.id)} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="client_id" value={zone.client_id} />
                <Input name="name" label="Zona" defaultValue={zone.name} required />
                <Input name="delivery_fee" label="Costo" type="number" step="0.1" min="0" defaultValue={zone.delivery_fee} />
                <Input name="minimum_order" label="Pedido minimo" type="number" step="0.1" min="0" defaultValue={zone.minimum_order} />
                <Input name="estimated_time" label="Tiempo" defaultValue={zone.estimated_time || ""} />
                <Input name="display_order" label="Orden" type="number" defaultValue={zone.display_order} />
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="font-medium text-[var(--text)]">Descripcion</span>
                  <textarea name="description" defaultValue={zone.description || ""} className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input name="is_active" type="checkbox" defaultChecked={zone.is_active} />
                    Activa
                  </label>
                  <p className="text-sm text-[var(--text-muted)]">{formatPrice(zone.delivery_fee)} · minimo {formatPrice(zone.minimum_order)}</p>
                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary">Guardar</Button>
                    <Button form={`delete-zone-${zone.id}`} type="submit" variant="danger">Eliminar</Button>
                  </div>
                </div>
              </form>
              <form id={`delete-zone-${zone.id}`} action={deleteDeliveryZoneAction.bind(null, zone.id)}>
                <input type="hidden" name="client_id" value={zone.client_id} />
              </form>
            </div>
          ))
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay zonas de delivery configuradas.</p>
        )}
      </section>
    </div>
  );
}

function ClientSelect({ clients }: { clients: Client[] }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--text)]">Negocio</span>
      <select name="client_id" required className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]">
        <option value="">Selecciona un negocio</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>{client.name}</option>
        ))}
      </select>
    </label>
  );
}
