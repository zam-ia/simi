"use client";

import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MenuItemCreateForm } from "@/components/admin/MenuItemCreateForm";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Modal } from "@/components/shared/Modal";
import { deleteMenuItemInlineAction, updateMenuItemInlineAction } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import type { CategoryWithItems, MenuCategory, MenuItem } from "@/types/menu";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";

type MenuItemManagerProps = {
  clientId: string;
  categories: CategoryWithItems[];
};

function CategorySelect({ categories, defaultValue }: { categories: MenuCategory[]; defaultValue?: string }) {
  return (
    <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="category_id" defaultValue={defaultValue} required>
      <option value="">Elegir categoria</option>
      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function MenuItemManager({ clientId, categories }: MenuItemManagerProps) {
  const [visibleCategories, setVisibleCategories] = useState(categories);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [workingItemId, setWorkingItemId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const flatCategories = visibleCategories.map(({ items: _items, ...category }) => category);

  useEffect(() => {
    setVisibleCategories(categories);
  }, [categories]);

  useEffect(() => {
    function syncCategories(event: Event) {
      const nextCategories = (event as CustomEvent<MenuCategory[]>).detail;
      if (!Array.isArray(nextCategories)) return;

      setVisibleCategories((current) => nextCategories.map((category) => {
        const existingCategory = current.find((currentCategory) => currentCategory.id === category.id);
        return { ...category, items: existingCategory?.items || [] };
      }));
    }

    window.addEventListener("simi:categories-updated", syncCategories);
    return () => window.removeEventListener("simi:categories-updated", syncCategories);
  }, []);

  function sortItems(items: MenuItem[]) {
    return [...items].sort((first, second) => first.display_order - second.display_order || first.name.localeCompare(second.name, "es"));
  }

  function addCreatedItem(item: MenuItem) {
    setVisibleCategories((current) => current.map((category) => (
      category.id === item.category_id ? { ...category, items: sortItems([...category.items, item]) } : category
    )));
    setFeedback({ tone: "success", message: "Producto agregado. La galeria ya esta actualizada." });
  }

  function updateItem(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setWorkingItemId(itemId);
    setFeedback(null);

    startTransition(() => {
      void updateMenuItemInlineAction(clientId, itemId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingItemId(null);
          return;
        }

        setVisibleCategories((current) => current.map((category) => {
          const remainingItems = category.items.filter((item) => item.id !== itemId);
          if (category.id !== result.item.category_id) return { ...category, items: remainingItems };
          return { ...category, items: sortItems([...remainingItems, result.item]) };
        }));
        setFeedback({ tone: "success", message: result.message });
        setWorkingItemId(null);
        setEditingItem(null);
      });
    });
  }

  function deleteItem(itemId: string) {
    if (!window.confirm("Eliminar este producto?")) return;
    setWorkingItemId(itemId);
    setFeedback(null);

    startTransition(() => {
      void deleteMenuItemInlineAction(clientId, itemId).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          setWorkingItemId(null);
          return;
        }

        setVisibleCategories((current) => current.map((category) => ({ ...category, items: category.items.filter((item) => item.id !== itemId) })));
        setFeedback({ tone: "success", message: result.message });
        setWorkingItemId(null);
      });
    });
  }

  return (
    <section className="grid min-w-0 gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Productos</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">Galeria compacta para revisar y editar sin bajar de más.</p>
        </div>
        {flatCategories.length ? <MenuItemCreateForm clientId={clientId} categories={flatCategories} onCreated={addCreatedItem} /> : null}
      </div>

      {feedback ? (
        <p aria-live="polite" className={`rounded-[var(--radius-input)] px-3 py-2 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
          {feedback.message}
        </p>
      ) : null}

      {visibleCategories.length === 0 ? (
        <EmptyState title="Aun no hay categorias" description="Primero crea una categoria para poder agregar productos." />
      ) : (
        <div className="grid gap-5">
          {visibleCategories.map((category) => (
            <div key={category.id} className="grid min-w-0 gap-3">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
                <h3 className="text-base font-medium">{category.name}</h3>
                <span className="text-xs text-[var(--text-muted)]">{category.items.length} productos</span>
              </div>

              {category.items.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Esta categoria aun no tiene productos.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {category.items.map((item) => (
                    <article key={item.id} className="grid min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)]">
                      {item.image_url ? (
                        <img alt={item.name} src={item.image_url} className="aspect-[16/9] w-full object-cover" />
                      ) : (
                        <div className="grid aspect-[16/9] w-full place-items-center bg-[var(--surface)] text-[var(--text-muted)]">
                          <ImageIcon className="h-6 w-6" aria-hidden="true" />
                        </div>
                      )}
                      <div className="grid gap-2.5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="line-clamp-2 text-sm font-medium">{item.name}</h4>
                            <p className="mt-1 text-sm font-medium text-[var(--accent-strong)]">{formatPrice(item.price)}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${item.is_available ? "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200"}`}>
                            {item.is_available ? "Disponible" : "Agotado"}
                          </span>
                        </div>
                        {item.description ? <p className="line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">{item.description}</p> : null}
                        <div className="flex items-center gap-1.5 border-t border-[var(--line)] pt-2.5">
                          <button type="button" className="focus-ring inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-input)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface)]" onClick={() => { setFeedback(null); setEditingItem(item); }}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Editar
                          </button>
                          <button type="button" className="focus-ring ml-auto grid h-10 w-10 place-items-center rounded-[var(--radius-input)] text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/35" onClick={() => deleteItem(item.id)} disabled={isPending && workingItemId === item.id} title="Eliminar producto" aria-label={`Eliminar ${item.name}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal title="Editar producto" description="Actualiza la informacion sin perder tu posicion en la galeria." isOpen={Boolean(editingItem)} onClose={() => setEditingItem(null)} size="lg">
        {editingItem ? (
          <form key={editingItem.id} onSubmit={(event) => updateItem(event, editingItem.id)} className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Producto">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" defaultValue={editingItem.name} required autoFocus />
              </Field>
              <Field label="Categoria">
                <CategorySelect categories={flatCategories} defaultValue={editingItem.category_id} />
              </Field>
              <Field label="Precio">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="price" type="number" step="0.01" min="0" defaultValue={editingItem.price} required />
              </Field>
              <Field label="Orden">
                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={editingItem.display_order} />
              </Field>
            </div>
            <Field label="Descripcion">
              <textarea className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" name="description" defaultValue={editingItem.description || ""} />
            </Field>
            <ImageUploader name="image_url" label={`Imagen de ${editingItem.name}`} defaultValue={editingItem.image_url} storagePath={`clients/${clientId}/items`} submitAfterUpload hint="JPG o WebP cuadrado, maximo 2 MB. Puedes ajustar el recorte." />
            <label className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" name="is_available" defaultChecked={editingItem.is_available} />
              Disponible en la carta
            </label>
            {feedback?.tone === "error" ? <p className="rounded-[var(--radius-input)] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{feedback.message}</p> : null}
            <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingItem(null)}>Cancelar</Button>
              <Button type="submit" disabled={isPending && workingItemId === editingItem.id}>{isPending && workingItemId === editingItem.id ? "Guardando..." : "Guardar cambios"}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </section>
  );
}
