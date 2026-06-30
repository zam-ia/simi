const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Solo se permiten imágenes JPG, PNG o WebP.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "La imagen supera el peso máximo permitido de 2 MB.";
  }

  return null;
}

export function sanitizeFileName(fileName: string) {
  const [name, extension = ""] = fileName.split(/\.(?=[^.]+$)/);
  const cleanName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanName || "imagen"}${extension ? `.${extension.toLowerCase()}` : ""}`;
}
