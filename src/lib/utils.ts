export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function generateSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatPrice(price: number | string) {
  const value = typeof price === "string" ? Number(price) : price;
  return `S/ ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;
}

export function normalizeWhatsapp(number: string) {
  const cleaned = number.replace(/[\s+\-()]/g, "");
  if (cleaned.startsWith("51")) return cleaned;
  if (cleaned.length === 9) return `51${cleaned}`;
  return cleaned;
}

export function buildWhatsappUrl(number: string, message: string) {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(message)}`;
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function getPublicMenuUrl(slug: string) {
  return `${getAppUrl()}/menu/${slug}`;
}

export function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function parseBooleanFormValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}
