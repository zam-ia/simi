import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/lib/actions";
import type { MenuCategory } from "@/types/menu";

type CategoryManagerProps = {
  clientId: string;
  categories: MenuCategory[];
};

export function CategoryManager({ clientId, categories }: CategoryManagerProps) {
  const createAction = createCategoryAction.bind(null, clientId);

  return (
    <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div>
        <h2 className="text-lg font-medium">Categorias</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Organiza el catalogo en tarjetas. Cada imagen funciona como acceso visual en la carta publica.</p>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Este negocio aun no tiene categorias." description="Agrega la primera categoria para organizar su menu." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const updateAction = updateCategoryAction.bind(null, clientId, category.id);
            const deleteAction = deleteCategoryAction.bind(null, clientId, category.id);

            return (
              <article key={category.id} className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] shadow-panel">
                {category.image_url ? (
                  <img alt={category.name} src={category.image_url} className="h-32 w-full object-cover" />
                ) : (
                  <div className="grid h-32 place-items-center bg-[var(--surface)] text-sm text-[var(--text-muted)]">Sin imagen</div>
                )}

                <div className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-medium">{category.name}</h3>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Orden {category.display_order}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${category.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/35 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-900/35 dark:text-red-200"}`}>
                      {category.is_active ? "Activa" : "Oculta"}
                    </span>
                  </div>

                  <details className="border-t border-[var(--line)] pt-3">
                    <summary className="cursor-pointer text-sm font-medium">Editar categoria</summary>
                    <form action={updateAction} className="mt-3 grid gap-3">
                      <label className="grid gap-2 text-sm">
                        <span className="font-medium">Nombre</span>
                        <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" defaultValue={category.name} required />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[120px_1fr] sm:items-end">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Orden</span>
                          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={category.display_order} />
                        </label>
                        <label className="flex min-h-10 items-center gap-2 text-sm">
                          <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
                          Activa
                        </label>
                      </div>
                      <ImageUploader
                        name="image_url"
                        label="Imagen de categoria"
                        defaultValue={category.image_url}
                        storagePath={`clients/${clientId}/categories`}
                        hint="Opcional. Se vera en Explora las categorias. Ideal cuadrada y con el producto o servicio centrado."
                      />
                      <Button type="submit" variant="secondary">
                        Guardar categoria
                      </Button>
                    </form>
                    <form action={deleteAction} className="mt-3 flex justify-end">
                      <DeleteButton message="Eliminar esta categoria y sus productos?" />
                    </form>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <form action={createAction} className="grid gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--line)] p-3">
        <h3 className="text-base font-medium">Nueva categoria</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto] md:items-end">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Nombre</span>
            <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" placeholder="Bebidas" required />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Orden</span>
            <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={categories.length + 1} />
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked />
            Activa
          </label>
          <Button type="submit">Agregar</Button>
        </div>
        <ImageUploader
          name="image_url"
          label="Imagen de categoria"
          storagePath={`clients/${clientId}/categories`}
          hint="Opcional. Puedes ajustar recorte antes de subirla."
        />
      </form>
    </section>
  );
}
