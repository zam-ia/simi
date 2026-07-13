"use client";

import { ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { createCategoryInlineAction, deleteCategoryInlineAction, updateCategoryInlineAction } from "@/lib/actions";
import type { MenuCategory } from "@/types/menu";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

type CategoryManagerProps = {
  clientId: string;
  categories: MenuCategory[];
};

export function CategoryManager({ clientId, categories }: CategoryManagerProps) {
  const [visibleCategories, setVisibleCategories] = useState(categories);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const createFormRef = useRef<HTMLFormElement>(null);
  const editingCategory = visibleCategories.find((category) => category.id === editingId) || null;

  useEffect(() => {
    setVisibleCategories(categories);
  }, [categories]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("simi:categories-updated", { detail: visibleCategories }));
  }, [visibleCategories]);

  function sortCategories(nextCategories: MenuCategory[]) {
    return [...nextCategories].sort((first, second) => first.display_order - second.display_order || first.name.localeCompare(second.name, "es"));
  }

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);
    setWorkingId("new");

    startTransition(() => {
      void createCategoryInlineAction(clientId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleCategories((current) => sortCategories([...current, result.category]));
        createFormRef.current?.reset();
        setFormVersion((current) => current + 1);
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
        setIsCreateOpen(false);
      });
    });
  }

  function updateCategory(event: FormEvent<HTMLFormElement>, categoryId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);
    setWorkingId(categoryId);

    startTransition(() => {
      void updateCategoryInlineAction(clientId, categoryId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleCategories((current) => sortCategories(current.map((category) => (category.id === categoryId ? result.category : category))));
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
        setEditingId(null);
      });
    });
  }

  function deleteCategory(categoryId: string) {
    if (!window.confirm("Eliminar esta categoria y sus productos?")) return;
    setFeedback(null);
    setWorkingId(categoryId);

    startTransition(() => {
      void deleteCategoryInlineAction(clientId, categoryId).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingId(null);
          return;
        }

        setVisibleCategories((current) => result.archived && result.category
          ? current.map((category) => (category.id === categoryId ? result.category : category))
          : current.filter((category) => category.id !== categoryId));
        setFeedback({ tone: "success", message: result.message });
        setWorkingId(null);
      });
    });
  }

  return (
    <section className="grid h-fit min-w-0 gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-medium">Categorias</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">Ordena los accesos que verá el cliente en la carta.</p>
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

      {visibleCategories.length === 0 ? (
        <EmptyState title="Aun no hay categorias" description="Agrega la primera categoria para organizar la carta." />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {visibleCategories.map((category) => (
            <article key={category.id} className="flex min-w-0 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              {category.image_url ? (
                <img alt={category.name} src={category.image_url} className="h-16 w-16 shrink-0 rounded-[var(--radius-input)] object-cover" />
              ) : (
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--radius-input)] bg-[var(--surface)] text-[var(--text-muted)]">
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{category.name}</h3>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">Orden {category.display_order}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${category.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200"}`}>
                    {category.is_active ? "Activa" : "Oculta"}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button type="button" className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-input)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface)]" onClick={() => setEditingId(category.id)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </button>
                  <button type="button" className="focus-ring grid h-9 w-9 place-items-center rounded-[var(--radius-input)] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/35" onClick={() => deleteCategory(category.id)} disabled={isPending && workingId === category.id} title="Eliminar categoria" aria-label={`Eliminar ${category.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal title="Nueva categoria" description="Crea un acceso visual para agrupar productos." isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="lg">
        <form key={formVersion} ref={createFormRef} onSubmit={createCategory} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Field label="Nombre">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" placeholder="Bebidas" required autoFocus />
            </Field>
            <Field label="Orden">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={visibleCategories.length + 1} />
            </Field>
          </div>
          <ImageUploader name="image_url" label="Imagen de categoria" storagePath={`clients/${clientId}/categories`} hint="Opcional. Puedes ajustar el recorte antes de subirla." />
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked />
            Categoria activa y visible
          </label>
          <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending && workingId === "new"}>{isPending && workingId === "new" ? "Agregando..." : "Agregar categoria"}</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Editar categoria" description="Actualiza el nombre, orden, visibilidad o imagen." isOpen={Boolean(editingCategory)} onClose={() => setEditingId(null)} size="lg">
        {editingCategory ? (
          <form key={editingCategory.id} onSubmit={(event) => updateCategory(event, editingCategory.id)} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
              <Field label="Nombre">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" defaultValue={editingCategory.name} required autoFocus />
              </Field>
              <Field label="Orden">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={editingCategory.display_order} />
              </Field>
            </div>
            <ImageUploader name="image_url" label="Imagen de categoria" defaultValue={editingCategory.image_url} storagePath={`clients/${clientId}/categories`} hint="Se muestra en la exploracion visual de la carta." />
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={editingCategory.is_active} />
              Categoria activa y visible
            </label>
            <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
              <Button type="submit" disabled={isPending && workingId === editingCategory.id}>{isPending && workingId === editingCategory.id ? "Guardando..." : "Guardar cambios"}</Button>
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
