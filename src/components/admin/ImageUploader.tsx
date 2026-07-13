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

type PendingImage = {
  file: File;
  dataUrl: string;
};

export function ImageUploader({ name, label, defaultValue = "", storagePath, hint, preview = "square", activateCheckboxName }: ImageUploaderProps) {
  const [url, setUrl] = useState(defaultValue || "");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const previewClass = preview === "wide" ? "h-14 w-24" : "h-14 w-14";
  const cropRatio = preview === "wide" ? 16 / 9 : 1;

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

  function resetCrop() {
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
  }

  function handleFileSelection(file?: File) {
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ file, dataUrl: String(reader.result || "") });
      resetCrop();
      setMessage("Ajusta el recorte y luego sube la imagen.");
    };
    reader.onerror = () => setMessage("No se pudo leer la imagen seleccionada.");
    reader.readAsDataURL(file);
  }

  async function uploadFile(file: File) {
    setIsUploading(true);
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
      setPendingImage(null);
      setMessage("Imagen cargada correctamente. Guarda los cambios para verla en el menu publico.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo subir la imagen. Revisa Supabase Storage.");
    } finally {
      setIsUploading(false);
    }
  }

  async function applyCropAndUpload() {
    if (!pendingImage) return;

    try {
      setMessage("Preparando recorte...");
      const croppedFile = await cropImageFile(pendingImage.file, pendingImage.dataUrl, cropRatio, zoom, offsetX, offsetY);
      await uploadFile(croppedFile);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo recortar la imagen. Intenta con otra imagen.");
    }
  }

  const isSuccess = message.includes("correctamente") || message.includes("lista");

  return (
    <div className="grid min-w-0 gap-2 text-sm">
      <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <span className="font-medium text-[var(--text)]">{label}</span>
        <p className="text-xs leading-4 text-[var(--text-muted)] sm:text-right">
          {hint || "Formatos: JPG, PNG o WebP. Peso maximo: 2 MB."}
        </p>
      </div>

      <input type="hidden" name={name} value={url} />

      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2.5">
        {url ? (
          <img alt={label} src={url} className={`${previewClass} shrink-0 rounded-[var(--radius-input)] object-cover`} />
        ) : (
          <div className={`${previewClass} grid shrink-0 place-items-center rounded-[var(--radius-input)] bg-[var(--surface)] text-[var(--text-muted)]`}>
            <UploadIcon className="h-5 w-5" />
          </div>
        )}

        <div className="grid min-w-0 gap-0.5">
          <span className="truncate text-xs font-medium text-[var(--text)]">{isUploading ? "Subiendo..." : url ? "Imagen lista" : "Sin imagen"}</span>
          <span className={`line-clamp-2 text-[11px] leading-4 ${isSuccess ? "text-green-700 dark:text-green-300" : "text-[var(--text-muted)]"}`}>
            {message || (url ? "Puedes cambiarla o quitarla." : "Selecciona una imagen y ajusta el recorte.")}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
            <label className="focus-ring grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition hover:shadow-panel" title={url ? "Cambiar imagen" : "Cargar imagen"} aria-label={url ? "Cambiar imagen" : "Cargar imagen"}>
              <UploadIcon className="h-4 w-4" />
              <span className="sr-only">{url ? "Cambiar imagen" : "Cargar imagen"}</span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading}
                onChange={(event) => handleFileSelection(event.target.files?.[0])}
              />
            </label>
            {url ? (
              <button type="button" className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-red-600 hover:shadow-panel" onClick={() => updateUrl("")} title="Quitar imagen" aria-label="Quitar imagen">
                <CloseIcon className="h-4 w-4" />
              </button>
            ) : null}
        </div>
      </div>

      {pendingImage ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/48 px-4 py-6 backdrop-blur-sm">
          <div className="grid max-h-[92vh] w-full max-w-2xl gap-4 overflow-y-auto rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft">
            <div>
              <h3 className="text-lg font-medium text-[var(--text)]">Ajustar imagen</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Acerca, aleja y mueve la imagen antes de subirla.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-start">
              <div className="overflow-hidden rounded-[var(--radius-panel)] bg-[var(--surface-muted)]" style={{ aspectRatio: String(cropRatio) }}>
                <img
                  alt="Vista previa del recorte"
                  src={pendingImage.dataUrl}
                  className="h-full w-full object-cover"
                  style={{
                    transform: `scale(${zoom}) translate(${offsetX / 2}%, ${offsetY / 2}%)`,
                    transformOrigin: "center",
                    transition: "transform 120ms ease-out"
                  }}
                />
              </div>

              <div className="grid gap-4 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4">
                <CropSlider label="Zoom" min={1} max={3} step={0.05} value={zoom} onChange={setZoom} />
                <CropSlider label="Horizontal" min={-100} max={100} step={1} value={offsetX} onChange={setOffsetX} />
                <CropSlider label="Vertical" min={-100} max={100} step={1} value={offsetY} onChange={setOffsetY} />
                <Button type="button" variant="secondary" onClick={resetCrop}>
                  Centrar
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button type="button" variant="secondary" onClick={() => setPendingImage(null)} disabled={isUploading}>
                Cancelar
              </Button>
              <Button type="button" variant="secondary" onClick={() => uploadFile(pendingImage.file)} disabled={isUploading}>
                Subir original
              </Button>
              <Button type="button" onClick={applyCropAndUpload} disabled={isUploading}>
                Aplicar y subir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CropSlider({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-[var(--text-muted)]">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <input className="w-full accent-[var(--accent)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

async function cropImageFile(file: File, dataUrl: string, ratio: number, zoom: number, offsetX: number, offsetY: number) {
  const image = await loadImage(dataUrl);
  const targetWidth = ratio > 1 ? 1400 : 900;
  const targetHeight = Math.round(targetWidth / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas no disponible.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);

  const baseScale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
  const finalScale = baseScale * zoom;
  const drawWidth = image.naturalWidth * finalScale;
  const drawHeight = image.naturalHeight * finalScale;
  const maxPanX = Math.max(0, (drawWidth - targetWidth) / 2);
  const maxPanY = Math.max(0, (drawHeight - targetHeight) / 2);
  const dx = (targetWidth - drawWidth) / 2 + (offsetX / 100) * maxPanX;
  const dy = (targetHeight - drawHeight) / 2 + (offsetY / 100) * maxPanY;

  context.drawImage(image, dx, dy, drawWidth, drawHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) resolve(nextBlob);
      else reject(new Error("No se pudo crear la imagen recortada."));
    }, file.type === "image/png" ? "image/png" : "image/webp", 0.92);
  });

  const extension = file.type === "image/png" ? "png" : "webp";
  const cleanName = sanitizeFileName(file.name).replace(/\.[^.]+$/, "");
  return new File([blob], `${cleanName || "imagen"}-recortada.${extension}`, { type: blob.type });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo cargar la imagen."));
    image.src = src;
  });
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 16V4m0 0-4 4m4-4 4 4M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
