"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { QRModal } from "@/components/admin/QRModal";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { createTableInlineAction, deleteTableInlineAction, updateTableInlineAction } from "@/lib/actions";
import { getPublicMenuUrl } from "@/lib/utils";
import type { Client, ClientTable } from "@/types/menu";
import { useState, useTransition, type FormEvent } from "react";

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
  const [visibleTables, setVisibleTables] = useState(tables);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const editingTable = visibleTables.find((table) => table.id === editingId) || null;

  function sortTables(nextTables: ClientTable[]) {
    return [...nextTables].sort((first, second) => first.table_number.localeCompare(second.table_number, "es", { numeric: true }));
  }

  function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setFeedback(null);
    setWorkingId("new");

    startTransition(() => {
      void createTableInlineAction(client.id, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleTables((current) => sortTables([...current, result.table as ClientTable]));
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
        setIsCreateOpen(false);
        form.reset();
      });
    });
  }

  function updateTable(event: FormEvent<HTMLFormElement>, tableId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);
    setWorkingId(tableId);

    startTransition(() => {
      void updateTableInlineAction(client.id, tableId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleTables((current) => sortTables(current.map((table) => (table.id === tableId ? result.table as ClientTable : table))));
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
        setEditingId(null);
      });
    });
  }

  function deleteTable(tableId: string) {
    if (!window.confirm("Eliminar esta mesa y su QR?")) return;
    setFeedback(null);
    setWorkingId(tableId);

    startTransition(() => {
      void deleteTableInlineAction(client.id, tableId).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleTables((current) => current.filter((table) => table.id !== tableId));
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
      });
    });
  }

  return (
    <section className="grid h-fit min-w-0 gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">Mesas y QR por mesa</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">Cada mesa genera un enlace listo para imprimir.</p>
        </div>
        <Button type="button" onClick={() => setIsCreateOpen(true)} className="shrink-0 px-4">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Nueva</span>
        </Button>
      </div>

      {feedback ? (
        <p aria-live="polite" className={`rounded-[var(--radius-input)] px-3 py-2 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
          {feedback.message}
        </p>
      ) : null}

      {visibleTables.length === 0 ? (
        <EmptyState title="Aun no hay mesas" description="Crea una mesa para obtener su QR individual." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {visibleTables.map((table) => {
            const tableUrl = `${getPublicMenuUrl(client.slug)}?mesa=${encodeURIComponent(table.table_number)}`;
            return (
              <article key={table.id} className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{table.label}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                      Mesa {table.table_number}
                      <span aria-hidden="true">·</span>
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {table.seats || 4}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${table.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                    {statusLabels[table.status] || table.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-2.5">
                  <QRModal url={tableUrl} slug={`${client.slug}-mesa-${table.table_number}`} logoUrl={client.logo_url} />
                  <button type="button" className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-input)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface)]" onClick={() => setEditingId(table.id)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button type="button" className="focus-ring ml-auto grid h-10 w-10 place-items-center rounded-[var(--radius-input)] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/35" onClick={() => deleteTable(table.id)} disabled={isPending && workingId === table.id} title="Eliminar mesa" aria-label={`Eliminar ${table.label}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal title="Nueva mesa" description="El QR se genera automaticamente al guardar." isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="lg">
        <form onSubmit={createTable} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Numero">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="table_number" placeholder="7" required autoFocus />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Nombre visible">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="label" placeholder="Mesa 7" />
              </Field>
            </div>
            <Field label="Sillas">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="seats" type="number" defaultValue={4} min={1} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending && workingId === "new"}>{isPending && workingId === "new" ? "Agregando..." : "Agregar mesa"}</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Editar mesa" description="Actualiza su capacidad, estado o disponibilidad." isOpen={Boolean(editingTable)} onClose={() => setEditingId(null)} size="lg">
        {editingTable ? (
          <form key={editingTable.id} onSubmit={(event) => updateTable(event, editingTable.id)} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Numero">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="table_number" defaultValue={editingTable.table_number} required autoFocus />
              </Field>
              <Field label="Nombre visible">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="label" defaultValue={editingTable.label} required />
              </Field>
              <Field label="Sillas">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="seats" type="number" defaultValue={editingTable.seats || 4} min={1} />
              </Field>
              <Field label="Estado">
                <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="status" defaultValue={editingTable.status}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={editingTable.is_active} />
              Mesa activa y disponible en el sistema
            </label>
            <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button type="submit" disabled={isPending && workingId === editingTable.id}>{isPending && workingId === editingTable.id ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
