import { DeleteButton } from "@/components/admin/DeleteButton";
import { QRModal } from "@/components/admin/QRModal";
import { Button } from "@/components/shared/Button";
import { createTableAction, deleteTableAction, updateTableAction } from "@/lib/actions";
import { getPublicMenuUrl } from "@/lib/utils";
import type { Client, ClientTable } from "@/types/menu";

type TableManagerProps = {
  client: Client;
  tables: ClientTable[];
};

const statusLabels = {
  available: "Disponible",
  occupied: "Ocupada",
  reserved: "Reservada",
  inactive: "Inactiva"
};

export function TableManager({ client, tables }: TableManagerProps) {
  const createAction = createTableAction.bind(null, client.id);

  return (
    <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div>
        <h2 className="text-lg font-medium">Mesas y QR por mesa</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Crea mesas para generar enlaces como /menu/{client.slug}?mesa=7.</p>
      </div>

      <form action={createAction} className="grid gap-3 rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4 md:grid-cols-[120px_1fr_120px_auto] md:items-end">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Número</span>
          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="table_number" placeholder="7" required />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Nombre visible</span>
          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="label" placeholder="Mesa 7" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Sillas</span>
          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="seats" type="number" defaultValue={4} min={1} />
        </label>
        <Button type="submit">Agregar mesa</Button>
      </form>

      {tables.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-muted)]">Aún no hay mesas registradas.</div>
      ) : (
        <div className="grid gap-3">
          {tables.map((table) => {
            const updateAction = updateTableAction.bind(null, client.id, table.id);
            const deleteAction = deleteTableAction.bind(null, client.id, table.id);
            const tableUrl = `${getPublicMenuUrl(client.slug)}?mesa=${encodeURIComponent(table.table_number)}`;

            return (
              <article key={table.id} className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <form action={updateAction} className="grid gap-3 md:grid-cols-[100px_1fr_100px_150px_auto_auto] md:items-end">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Número</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="table_number" defaultValue={table.table_number} required />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Nombre</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="label" defaultValue={table.label} required />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Sillas</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="seats" type="number" defaultValue={table.seats || 4} min={1} />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Estado</span>
                    <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="status" defaultValue={table.status}>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={table.is_active} />
                    Activa
                  </label>
                  <Button type="submit" variant="secondary">
                    Guardar
                  </Button>
                </form>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a className="text-sm text-[var(--accent)] hover:underline" href={tableUrl} target="_blank" rel="noreferrer">
                    Abrir QR de {table.label}
                  </a>
                  <div className="flex gap-2">
                    <QRModal url={tableUrl} slug={`${client.slug}-mesa-${table.table_number}`} logoUrl={client.logo_url} />
                    <form action={deleteAction}>
                      <DeleteButton message="¿Eliminar esta mesa?" />
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
