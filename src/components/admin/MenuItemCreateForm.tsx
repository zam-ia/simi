"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { createMenuItemInlineAction } from "@/lib/actions";
import type { MenuCategory, MenuItem } from "@/types/menu";

type MenuItemCreateFormProps = {
  clientId: string;
  categories: MenuCategory[];
  onCreated: (item: MenuItem) => void;
};

export function MenuItemCreateForm({ clientId, categories, onCreated }: MenuItemCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [formVersion, setFormVersion] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setFeedback(null);

    startTransition(() => {
      void createMenuItemInlineAction(clientId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          return;
        }

        formRef.current?.reset();
        setFormVersion((current) => current + 1);
        setFeedback({ tone: "success", message: result.message });
        onCreated(result.item);
      });
    });
  }

  return (
    <form key={formVersion} ref={formRef} onSubmit={submit} className="grid gap-3 rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-medium">Agregar producto</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Se guarda sin salir de esta sección.</p>
        </div>
        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">Alta rápida</span>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_120px_auto] md:items-end">
        <Field label="Nombre">
          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" required />
        </Field>
        <Field label="Categoría">
          <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="category_id" required>
            <option value="">Elegir categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Precio">
          <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="price" type="number" step="0.01" min="0" required />
        </Field>
        <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Agregar"}</Button>
      </div>

      <details className="border-t border-[var(--line)] pt-3">
        <summary className="cursor-pointer text-sm font-medium">Foto y más opciones</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Descripción">
            <textarea className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" name="description" />
          </Field>
          <Field label="Orden">
            <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={1} />
          </Field>
          <div className="md:col-span-2">
            <ImageUploader
              name="image_url"
              label="Imagen del producto"
              storagePath={`clients/${clientId}/items`}
              hint="Ideal: JPG o WebP cuadrado, 900 x 900 px y máximo 2 MB. Puedes ajustar el recorte antes de subir."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_available" defaultChecked />
            Disponible
          </label>
        </div>
      </details>

      {feedback ? (
        <p className={`rounded-[var(--radius-input)] px-3 py-2 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
