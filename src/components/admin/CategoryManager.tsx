"use client";

import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
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
  const [isPending, startTransition] = useTransition();
  const createFormRef = useRef<HTMLFormElement>(null);

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
    <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div>
        <h2 className="text-lg font-medium">Categorias</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Organiza el catalogo en tarjetas. Cada imagen funciona como acceso visual en la carta publica.</p>
      </div>

      {feedback ? (
        <p aria-live="polite" className={`rounded-[var(--radius-input)] px-3 py-2 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
          {feedback.message}
        </p>
      ) : null}

      {visibleCategories.length === 0 ? (
        <EmptyState title="Este negocio aun no tiene categorias." description="Agrega la primera categoria para organizar su menu." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => {
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
                    <form onSubmit={(event) => updateCategory(event, category.id)} className="mt-3 grid gap-3">
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
                      <Button type="submit" variant="secondary" disabled={isPending && workingId === category.id}>
                        {isPending && workingId === category.id ? "Guardando..." : "Guardar categoria"}
                      </Button>
                    </form>
                    <div className="mt-3 flex justify-end">
                      <button type="button" className="focus-ring min-h-10 rounded-full px-3 text-sm font-medium text-red-600 disabled:opacity-50" onClick={() => deleteCategory(category.id)} disabled={isPending && workingId === category.id}>
                        {isPending && workingId === category.id ? "Procesando..." : "Eliminar"}
                      </button>
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <form key={formVersion} ref={createFormRef} onSubmit={createCategory} className="grid gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--line)] p-3">
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
          <Button type="submit" disabled={isPending && workingId === "new"}>{isPending && workingId === "new" ? "Agregando..." : "Agregar"}</Button>
        </div>
        <ImageUploader
          name="image_url"
          label="Imagen de categoria"
          storagePath={`clients/${clientId}/categories`}
          hint="Opcional. Puedes ajustar el recorte antes de subirla."
        />
      </form>
    </section>
  );
}
