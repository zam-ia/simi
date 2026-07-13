import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { createPaymentMethodAction, deletePaymentMethodAction, updatePaymentMethodAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminGrowthModules } from "@/lib/menu-data";
import type { Client } from "@/types/menu";

export const dynamic = "force-dynamic";

const paymentTypes = [
  ["yape", "Yape"],
  ["plin", "Plin"],
  ["cash", "Efectivo"],
  ["card_on_delivery", "Tarjeta al recibir"],
  ["manual_transfer", "Transferencia manual"],
  ["gateway", "Pasarela futura"]
];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "payments");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, growth] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminGrowthModules(clientId)
  ]);
  const clientRows = (clients || []) as Client[];

  return (
    <div className="grid gap-4 lg:gap-5">
      <div>
        <h2 className="text-2xl font-medium">Metodos de pago</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Configura Yape, Plin, efectivo u opciones manuales por negocio.</p>
        {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Metodo guardado correctamente.</p> : null}
        {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
        {growth.missingGrowthTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 009 en Supabase para habilitar este modulo.</p> : null}
      </div>

      <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
        <h3 className="text-lg font-medium">Nuevo metodo</h3>
        <form action={createPaymentMethodAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {role === "business_admin" ? <input type="hidden" name="client_id" value={client!.id} /> : <ClientSelect clients={clientRows} />}
          <Select name="method_type" label="Tipo" options={paymentTypes} defaultValue="yape" />
          <Input name="label" label="Nombre visible" placeholder="Ej. Yape del local" required />
          <Input name="phone_number" label="Numero" placeholder="+51 999 999 999" />
          <Input name="qr_url" label="URL del QR" placeholder="https://..." hint="Ideal: imagen cuadrada JPG, PNG o WebP, minimo 800 x 800 px." />
          <Input name="display_order" label="Orden" type="number" defaultValue="0" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium text-[var(--text)]">Instrucciones</span>
            <textarea name="instructions" className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" placeholder="Ej. Luego de pagar, sube captura o escribe el numero de operacion." />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="is_active" type="checkbox" defaultChecked />
            Activo
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Crear metodo</Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        {growth.paymentMethods.length ? (
          growth.paymentMethods.map((method) => (
            <div key={method.id} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <form action={updatePaymentMethodAction.bind(null, method.id)} className="grid gap-4 md:grid-cols-2">
                <input type="hidden" name="client_id" value={method.client_id} />
                <Select name="method_type" label="Tipo" options={paymentTypes} defaultValue={method.method_type} />
                <Input name="label" label="Nombre visible" defaultValue={method.label} required />
                <Input name="phone_number" label="Numero" defaultValue={method.phone_number || ""} />
                <Input name="qr_url" label="URL del QR" defaultValue={method.qr_url || ""} hint="Ideal: JPG, PNG o WebP cuadrado, minimo 800 x 800 px." />
                <Input name="display_order" label="Orden" type="number" defaultValue={method.display_order} />
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span className="font-medium text-[var(--text)]">Instrucciones</span>
                  <textarea name="instructions" defaultValue={method.instructions || ""} className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input name="is_active" type="checkbox" defaultChecked={method.is_active} />
                    Activo
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" variant="secondary">Guardar</Button>
                    <Button form={`delete-payment-${method.id}`} type="submit" variant="danger">Eliminar</Button>
                  </div>
                </div>
              </form>
              <form id={`delete-payment-${method.id}`} action={deletePaymentMethodAction.bind(null, method.id)}>
                <input type="hidden" name="client_id" value={method.client_id} />
              </form>
            </div>
          ))
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay metodos de pago configurados.</p>
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
