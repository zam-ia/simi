"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { sanitizeFileName, validateImageFile } from "@/lib/storage";

type ImageUploaderProps = {
  name: string;
  label: string;
  defaultValue?: string | null;
  storagePath: string;
  hint?: string;
  preview?: "square" | "wide";
  activateCheckboxName?: string;
};

export function ImageUploader({ name, label, defaultValue = "", storagePath, hint, preview = "square", activateCheckboxName }: ImageUploaderProps) {
  const [url, setUrl] = useState(defaultValue || "");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const previewClass = preview === "wide" ? "h-28 w-full sm:h-24 sm:w-40" : "h-16 w-16";

  function activateRelatedCheckbox(nextUrl: string) {
    if (!activateCheckboxName || !nextUrl.trim()) return;
    const checkbox = document.querySelector<HTMLInputElement>(`input[name="${activateCheckboxName}"]`);
    if (!checkbox || checkbox.checked) return;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function updateUrl(nextUrl: string) {
    setUrl(nextUrl);
    activateRelatedCheckbox(nextUrl);
    if (nextUrl.trim()) {
      setMessage("Imagen lista. Guarda los cambios para publicarla.");
    } else {
      setMessage("Imagen retirada. Guarda los cambios para aplicar el cambio.");
    }
  }

  async function handleUpload(file?: File) {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);
    setMessage("Subiendo imagen...");

    try {
      const supabase = createSupabaseBrowserClient();
      const filePath = `${storagePath}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("menu-images").upload(filePath, file, {
        upsert: true,
        cacheControl: "60",
        contentType: file.type
      });

      if (error) throw error;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(filePath);
      setUrl(data.publicUrl);
      activateRelatedCheckbox(data.publicUrl);
      setMessage("Imagen cargada correctamente. Guarda los cambios para verla en el menu publico.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo subir la imagen. Revisa Supabase Storage.");
    } finally {
      setIsUploading(false);
    }
  }

  const isSuccess = message.includes("correctamente") || message.includes("lista");

  return (
    <div className="grid min-w-0 gap-2 text-sm">
      <div>
        <span className="font-medium text-[var(--text)]">{label}</span>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          {hint || "Formatos: JPG, PNG o WebP. Peso maximo: 2 MB."}
        </p>
      </div>

      <input type="hidden" name={name} value={url} />

      <div className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        {url ? (
          <img alt={label} src={url} className={`${previewClass} shrink-0 rounded-[var(--radius-input)] object-cover`} />
        ) : (
          <div className={`${previewClass} shrink-0 rounded-[var(--radius-input)] bg-[var(--surface)]`} />
        )}

        <div className="grid min-w-0 gap-2">
          <input
            className="focus-ring min-w-0 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs"
            value={url}
            onChange={(event) => updateUrl(event.target.value)}
            placeholder="URL de imagen"
          />

          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
            <input
              className="min-w-0 flex-1 text-xs text-[var(--text-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--surface)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--text)]"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploading}
              onChange={(event) => handleUpload(event.target.files?.[0])}
            />
            {url ? (
              <Button type="button" variant="secondary" className="min-h-9 px-4" onClick={() => updateUrl("")}>
                Quitar
              </Button>
            ) : null}
          </div>

          <span className="text-xs text-[var(--text-muted)]">Tambien puedes pegar una URL si la imagen ya esta alojada.</span>
          {uploadedFileName ? <span className="truncate text-xs text-[var(--text-muted)]">Archivo: {uploadedFileName}</span> : null}
        </div>
      </div>

      {message ? (
        <span className={`rounded-[var(--radius-input)] px-3 py-2 text-xs ${isSuccess ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>
          {isUploading ? "Subiendo..." : message}
        </span>
      ) : null}
    </div>
  );
}
