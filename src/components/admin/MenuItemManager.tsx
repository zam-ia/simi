import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MenuItemCreateForm } from "@/components/admin/MenuItemCreateForm";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { deleteMenuItemAction, updateMenuItemAction } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import type { CategoryWithItems, MenuCategory } from "@/types/menu";
import type { ReactNode } from "react";

type MenuItemManagerProps = {
  clientId: string;
  categories: CategoryWithItems[];
};

function CategorySelect({ categories, defaultValue }: { categories: MenuCategory[]; defaultValue?: string }) {
  return (
    <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="category_id" defaultValue={defaultValue} required>
      <option value="">Elegir categoria</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function MenuItemManager({ clientId, categories }: MenuItemManagerProps) {
  const flatCategories = categories.map(({ items: _items, ...category }) => category);

  return (
    <section className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div>
        <h2 className="text-lg font-medium">Productos</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Vista tipo galeria para revisar mas articulos sin bajar tanto.</p>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Este negocio aun no tiene categorias." description="Primero crea una categoria para poder agregar productos." />
      ) : (
        <div className="grid gap-5">
          <MenuItemCreateForm clientId={clientId} categories={flatCategories} />

          {categories.map((category) => (
            <div key={category.id} className="grid gap-3">
              <div className="flex items-end justify-between gap-3">
                <h3 className="text-base font-medium">{category.name}</h3>
                <span className="text-xs text-[var(--text-muted)]">{category.items.length} productos</span>
              </div>

              {category.items.length === 0 ? (
                <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-muted)]">Esta categoria aun no tiene productos.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {category.items.map((item) => {
                    const updateAction = updateMenuItemAction.bind(null, clientId, item.id);
                    const deleteAction = deleteMenuItemAction.bind(null, clientId, item.id);

                    return (
                      <article key={item.id} className="grid min-h-[360px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] shadow-panel">
                        {item.image_url ? (
                          <img alt={item.name} src={item.image_url} className="h-36 w-full object-cover" />
                        ) : (
                          <div className="grid h-36 place-items-center bg-[var(--surface)] text-sm text-[var(--text-muted)]">Sin foto</div>
                        )}

                        <div className="grid content-start gap-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="line-clamp-2 font-medium">{item.name}</h4>
                              <p className="mt-1 text-sm text-[var(--text-muted)]">{formatPrice(item.price)}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${item.is_available ? "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200"}`}>
                              {item.is_available ? "Disponible" : "Agotado"}
                            </span>
                          </div>

                          {item.description ? <p className="line-clamp-3 text-sm leading-5 text-[var(--text-muted)]">{item.description}</p> : <p className="text-sm leading-5 text-[var(--text-muted)]">Sin descripcion.</p>}

                          <details className="mt-auto border-t border-[var(--line)] pt-3">
                            <summary className="cursor-pointer text-sm font-medium">Editar producto</summary>
                            <form action={updateAction} className="mt-3 grid gap-3">
                              <Field label="Producto">
                                <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" defaultValue={item.name} required />
                              </Field>
                              <Field label="Categoria">
                                <CategorySelect categories={flatCategories} defaultValue={item.category_id} />
                              </Field>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Precio">
                                  <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="price" type="number" step="0.01" min="0" defaultValue={item.price} required />
                                </Field>
                                <Field label="Orden">
                                  <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={item.display_order} />
                                </Field>
                              </div>
                              <Field label="Descripcion">
                                <textarea className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" name="description" defaultValue={item.description || ""} />
                              </Field>
                              <ImageUploader
                                name="image_url"
                                label={`Imagen de ${item.name}`}
                                defaultValue={item.image_url}
                                storagePath={`clients/${clientId}/items`}
                                hint="Ideal: JPG o WebP cuadrado. Tamano recomendado: 900 x 900 px. Usa fondo claro y el plato centrado. Maximo 2 MB."
                              />
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" name="is_available" defaultChecked={item.is_available} />
                                  Disponible
                                </label>
                                <Button type="submit" variant="secondary">
                                  Guardar
                                </Button>
                              </div>
                            </form>
                            <form action={deleteAction} className="mt-3 flex justify-end">
                              <DeleteButton message="Eliminar este producto?" />
                            </form>
                          </details>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
