"use client";

import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
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
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setFeedback(null);

    startTransition(() => {
      void createMenuItemInlineAction(clientId, formData).then((result) => {
        if (!result.ok) {
          setFeedback({ tone: "error", message: result.error });
          return;
        }

        formRef.current?.reset();
        setFormVersion((current) => current + 1);
        onCreated(result.item);
        setIsOpen(false);
      });
    });
  }

  return (
    <>
      <Button type="button" onClick={() => { setFeedback(null); setIsOpen(true); }} className="shrink-0 px-4">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Nuevo producto
      </Button>
      <Modal title="Nuevo producto" description="Completa la informacion principal y publica sin salir de la galeria." isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
        <form key={formVersion} ref={formRef} onSubmit={submit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="name" required autoFocus />
            </Field>
            <Field label="Categoria">
              <select className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="category_id" required>
                <option value="">Elegir categoria</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </Field>
            <Field label="Precio">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="price" type="number" step="0.01" min="0" required />
            </Field>
            <Field label="Orden">
              <input className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3" name="display_order" type="number" defaultValue={1} />
            </Field>
          </div>
          <Field label="Descripcion">
            <textarea className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" name="description" />
          </Field>
          <ImageUploader name="image_url" label="Imagen del producto" storagePath={`clients/${clientId}/items`} submitAfterUpload hint="JPG o WebP cuadrado, maximo 2 MB. Puedes ajustar el recorte." />
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" name="is_available" defaultChecked />
            Disponible en la carta
          </label>
          {feedback ? (
            <p className={`rounded-[var(--radius-input)] px-3 py-2 text-sm ${feedback.tone === "success" ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-red-50 text-red-700 dark:bg-red-950/35 dark:text-red-200"}`}>
              {feedback.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Agregar producto"}</Button>
          </div>
        </form>
      </Modal>
    </>
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
