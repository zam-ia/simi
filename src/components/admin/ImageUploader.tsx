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
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const previewClass = preview === "wide" ? "h-28 w-full sm:h-24 sm:w-40" : "h-16 w-16";
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
              onChange={(event) => handleFileSelection(event.target.files?.[0])}
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
