import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { createPromotionAction, deletePromotionAction, updatePromotionAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminGrowthModules } from "@/lib/menu-data";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

const promoTypes = [
  ["general", "General"],
  ["delivery", "Delivery"],
  ["coupon", "Cupon"],
  ["combo", "Combo"],
  ["product", "Producto"],
  ["category", "Categoria"]
];

const discountTypes = [
  ["none", "Sin descuento automatico"],
  ["amount", "Monto fijo"],
  ["percent", "Porcentaje"],
  ["free_delivery", "Delivery gratis"]
];

export default async function AdminPromotionsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "promotions");
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
        <h2 className="text-2xl font-medium">Promociones</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Publica ofertas visibles en la carta y prepara cupones para campanas futuras.</p>
        {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Promocion guardada correctamente.</p> : null}
        {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
        {growth.missingGrowthTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 009 en Supabase para habilitar este modulo.</p> : null}
      </div>

      <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <h3 className="text-lg font-medium">Nueva promocion</h3>
        <form action={createPromotionAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {role === "business_admin" ? <input type="hidden" name="client_id" value={client!.id} /> : <ClientSelect clients={clientRows} />}
          <Input name="title" label="Titulo" placeholder="Ej. Combo familiar" required />
          <Select name="promo_type" label="Tipo" options={promoTypes} defaultValue="general" />
          <Select name="discount_type" label="Descuento" options={discountTypes} defaultValue="none" />
          <Input name="discount_value" label="Valor" type="number" step="0.1" min="0" defaultValue="0" />
          <Input name="coupon_code" label="Codigo opcional" placeholder="Ej. SIMI10" />
          <Input name="display_order" label="Orden" type="number" defaultValue="0" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium text-[var(--text)]">Descripcion</span>
            <textarea name="description" className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" placeholder="Texto corto que vera el comensal." />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Activa
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Crear promocion</Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        {growth.promotions.length ? (
          growth.promotions.map((promotion) => (
            <div key={promotion.id} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <form action={updatePromotionAction.bind(null, promotion.id)} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="client_id" value={promotion.client_id} />
                <Input name="title" label="Titulo" defaultValue={promotion.title} required />
                <Select name="promo_type" label="Tipo" options={promoTypes} defaultValue={promotion.promo_type} />
                <Select name="discount_type" label="Descuento" options={discountTypes} defaultValue={promotion.discount_type} />
                <Input name="discount_value" label="Valor" type="number" step="0.1" min="0" defaultValue={promotion.discount_value} />
                <Input name="coupon_code" label="Codigo" defaultValue={promotion.coupon_code || ""} />
                <Input name="display_order" label="Orden" type="number" defaultValue={promotion.display_order} />
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="font-medium text-[var(--text)]">Descripcion</span>
                  <textarea name="description" defaultValue={promotion.description || ""} className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input name="is_active" type="checkbox" defaultChecked={promotion.is_active} />
                    Activa
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary">Guardar</Button>
                    <Button form={`delete-promotion-${promotion.id}`} type="submit" variant="danger">Eliminar</Button>
                  </div>
                </div>
              </form>
              <form id={`delete-promotion-${promotion.id}`} action={deletePromotionAction.bind(null, promotion.id)}>
                <input type="hidden" name="client_id" value={promotion.client_id} />
              </form>
            </div>
          ))
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay promociones configuradas.</p>
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

function Select({ name, label, options, defaultValue }: { name: string; label: string; options: string[][]; defaultValue: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--text)]">{label}</span>
      <select name={name} defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]">
        {options.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}
