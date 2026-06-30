import { getPublicMenuUrl } from "@/lib/utils";

export function buildMenuQrFileName(slug: string) {
  return `simi-${slug}.png`;
}

export function buildMenuQrUrl(slug: string) {
  return getPublicMenuUrl(slug);
}
