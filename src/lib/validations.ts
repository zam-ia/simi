import { generateSlug, isValidHexColor, normalizeWhatsapp } from "@/lib/utils";

export type ValidationResult<T> = {
  data?: T;
  error?: string;
};

export type ClientInput = {
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  whatsapp_number: string;
  notification_whatsapp_number: string | null;
  yape_number: string | null;
  yape_qr_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  promo_banner_title: string | null;
  promo_banner_description: string | null;
  promo_banner_image_url: string | null;
  promo_banner_is_active: boolean;
  is_active: boolean;
};

export function validateClientInput(formData: FormData): ValidationResult<ClientInput> {
  const name = String(formData.get("name") || "").trim();
  const slug = generateSlug(String(formData.get("slug") || name));
  const whatsappNumber = String(formData.get("whatsapp_number") || "").trim();
  const notificationWhatsappNumber = String(formData.get("notification_whatsapp_number") || "").trim();
  const primaryColor = String(formData.get("primary_color") || "#0071E3").trim();
  const useSecondaryColor = formData.get("use_secondary_color") === "on";
  const secondaryColor = useSecondaryColor ? String(formData.get("secondary_color") || "").trim() : "";

  if (!name) return { error: "El nombre del negocio es obligatorio." };
  if (!slug) return { error: "El slug es obligatorio." };
  if (!whatsappNumber) return { error: "El WhatsApp es obligatorio." };
  if (normalizeWhatsapp(whatsappNumber).length < 11) return { error: "El WhatsApp debe incluir un número válido de Perú." };
  if (notificationWhatsappNumber && normalizeWhatsapp(notificationWhatsappNumber).length < 11) return { error: "El WhatsApp de notificaciones debe incluir un número válido de Perú." };
  if (!isValidHexColor(primaryColor)) return { error: "El color principal debe tener formato hexadecimal, por ejemplo #D71920." };
  if (secondaryColor && !isValidHexColor(secondaryColor)) return { error: "El segundo color debe tener formato hexadecimal, por ejemplo #F4C430." };

  return {
    data: {
      name,
      slug,
      logo_url: String(formData.get("logo_url") || "").trim() || null,
      address: String(formData.get("address") || "").trim() || null,
      whatsapp_number: whatsappNumber,
      notification_whatsapp_number: notificationWhatsappNumber || null,
      yape_number: String(formData.get("yape_number") || "").trim() || null,
      yape_qr_url: String(formData.get("yape_qr_url") || "").trim() || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor || null,
      promo_banner_title: String(formData.get("promo_banner_title") || "").trim() || null,
      promo_banner_description: String(formData.get("promo_banner_description") || "").trim() || null,
      promo_banner_image_url: String(formData.get("promo_banner_image_url") || "").trim() || null,
      promo_banner_is_active: formData.get("promo_banner_is_active") === "on",
      is_active: formData.get("is_active") === "on"
    }
  };
}

export function validateCategoryInput(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("client_id") || "").trim();
  const displayOrder = Number(formData.get("display_order") || 0);

  if (!clientId) return { error: "La categoría debe pertenecer a un cliente." };
  if (!name) return { error: "El nombre de la categoría es obligatorio." };

  return {
    data: {
      client_id: clientId,
      name,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      is_active: formData.get("is_active") === "on"
    }
  };
}

export function validateMenuItemInput(formData: FormData) {
  const clientId = String(formData.get("client_id") || "").trim();
  const categoryId = String(formData.get("category_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);
  const displayOrder = Number(formData.get("display_order") || 0);

  if (!clientId) return { error: "El producto debe pertenecer a un cliente." };
  if (!categoryId) return { error: "Debes elegir una categoría para el producto." };
  if (!name) return { error: "El nombre del producto es obligatorio." };
  if (!Number.isFinite(price) || price < 0) return { error: "El precio debe ser mayor o igual a 0." };

  return {
    data: {
      client_id: clientId,
      category_id: categoryId,
      name,
      description: String(formData.get("description") || "").trim() || null,
      price,
      image_url: String(formData.get("image_url") || "").trim() || null,
      is_available: formData.get("is_available") === "on",
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0
    }
  };
}
