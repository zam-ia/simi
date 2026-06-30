import { DeleteButton } from "@/components/admin/DeleteButton";
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
        <h2 className="text-lg font-medium">Categorías</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Organiza el menú por secciones como pollos, combos o bebidas.</p>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="Este negocio aún no tiene categorías." description="Agrega la primera categoría para organizar su menú." />
      ) : (
        <div className="grid gap-3">
          {categories.map((category) => {
            const updateAction = updateCategoryAction.bind(null, clientId, category.id);
            const deleteAction = deleteCategoryAction.bind(null, clientId, category.id);

            return (
              <div key={category.id} className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
                <form action={updateAction} className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto] md:items-end">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Nombre</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" defaultValue={category.name} required />
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Orden</span>
                    <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={category.display_order} />
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
                    Activa
                  </label>
                  <Button type="submit" variant="secondary">
                    Guardar
                  </Button>
                </form>
                <form action={deleteAction} className="flex justify-end">
                  <DeleteButton message="¿Eliminar esta categoría y sus productos?" />
                </form>
              </div>
            );
          })}
        </div>
      )}

      <form action={createAction} className="grid gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--line)] p-3 md:grid-cols-[1fr_120px_auto_auto] md:items-end">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Nueva categoría</span>
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
        <Button type="submit">Agregar categoría</Button>
      </form>
    </section>
  );
}
