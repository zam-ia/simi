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
};

export function ImageUploader({ name, label, defaultValue = "", storagePath, hint, preview = "square" }: ImageUploaderProps) {
  const [url, setUrl] = useState(defaultValue || "");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const previewClass = preview === "wide" ? "h-24 w-full sm:h-20 sm:w-36" : "h-16 w-16";

  async function handleUpload(file?: File) {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsUploading(true);
    setMessage("Subiendo imagen...");

    try {
      const supabase = createSupabaseBrowserClient();
      const filePath = `${storagePath}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("menu-images").upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(filePath);
      setUrl(data.publicUrl);
      setMessage("Imagen cargada correctamente.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo subir la imagen. Revisa Supabase Storage.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="grid gap-2 text-sm">
      <div>
        <span className="font-medium text-[var(--text)]">{label}</span>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
          {hint || "Formatos: JPG, PNG o WebP. Peso máximo: 2 MB."}
        </p>
      </div>
      <input type="hidden" name={name} value={url} />
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 sm:flex-row sm:items-center">
        {url ? (
          <img alt={label} src={url} className={`${previewClass} shrink-0 rounded-[var(--radius-input)] object-cover`} />
        ) : (
          <div className={`${previewClass} shrink-0 rounded-[var(--radius-input)] bg-[var(--surface)]`} />
        )}
        <div className="grid flex-1 gap-2">
          <input
            className="focus-ring rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="URL de imagen"
          />
          <input
            className="text-xs text-[var(--text-muted)]"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={(event) => handleUpload(event.target.files?.[0])}
          />
          <span className="text-xs text-[var(--text-muted)]">También puedes pegar una URL si la imagen ya está alojada.</span>
        </div>
        {url ? (
          <Button type="button" variant="secondary" onClick={() => setUrl("")}>
            Quitar
          </Button>
        ) : null}
      </div>
      {message ? <span className="text-xs text-[var(--text-muted)]">{message}</span> : null}
    </div>
  );
}
