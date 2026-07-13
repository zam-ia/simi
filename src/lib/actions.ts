"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { businessTypeLabels, demoMeetingChannels, demoStatusLabels } from "@/constants/commercial";
import { hasModuleAccess, requireAdmin, requireClientAccess, requireModuleAccess, requireSuperAdmin } from "@/lib/auth";
import { deliveryStatusOptions } from "@/constants/order-status";
import { businessRoles, configurableModules, normalizeBusinessRole, resolveModulePermissions, type ModulePermissions } from "@/lib/permissions";
import { recordOperationalActivity } from "@/lib/services/activity-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateSlug, normalizeWhatsapp } from "@/lib/utils";
import { validateCategoryInput, validateClientInput, validateMenuItemInput } from "@/lib/validations";

function encodedError(message: string) {
  return `?error=${encodeURIComponent(message)}`;
}

function isMissingVisualSettingsError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" || message.includes("secondary_color") || message.includes("promo_banner") || message.includes("hero_banner_image_url") || message.includes("notification_whatsapp_number");
}

function missingVisualSettingsMessage() {
  return "Supabase todavia no reconoce los campos visuales del cliente. Aplica las migraciones 010 y 011, luego vuelve a guardar.";
}

function isMissingCommercialSettingsError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" && (message.includes("business_type") || message.includes("commercial_status") || message.includes("plan_name") || message.includes("module_config") || message.includes("order_flow_config"));
}

function missingCommercialSettingsMessage() {
  return "Supabase todavia no reconoce los campos comerciales del cliente. Aplica la migracion 015_commercial_layer.sql y luego vuelve a guardar.";
}

function isMissingCategoryImageError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" || code === "42703" || message.includes("image_url");
}

function missingCategoryImageMessage() {
  return "Supabase todavia no reconoce imagenes para categorias. Aplica la migracion 012 y luego vuelve a guardar.";
}

function isOrderHistoryReferenceError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  const details = "details" in error ? String(error.details) : "";
  return code === "23503" && (message.includes("order_items") || details.includes("order_items"));
}

function isMissingManualOrderError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" || code === "42703" || message.includes("source") || message.includes("manual_channel") || message.includes("waiter_name") || message.includes("party_size");
}

function normalizeFormText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function buildOrderCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function revalidateClientSurfaces(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], clientId: string, knownSlug?: string | null) {
  let slug = knownSlug || null;

  if (!slug) {
    const { data } = await supabase.from("clients").select("slug").eq("id", clientId).maybeSingle();
    slug = data?.slug || null;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/clients/${clientId}`);
  if (slug) {
    revalidatePath(`/menu/${slug}`);
    revalidatePath(`/reservar/${slug}`);
  }
}

export async function createClientAction(formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const { supabase } = context;
  const validation = validateClientInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/new${encodedError(validation.error || "Datos inválidos.")}`);

  const { data: existing } = await supabase.from("clients").select("id").eq("slug", validation.data.slug).maybeSingle();
  if (existing) redirect(`/admin/clients/new${encodedError("Este slug ya está en uso.")}`);

  const { data, error } = await supabase.from("clients").insert(validation.data).select("id").single();
  if (error && isMissingCommercialSettingsError(error)) redirect(`/admin/clients/new${encodedError(missingCommercialSettingsMessage())}`);
  if (error && isMissingVisualSettingsError(error)) redirect(`/admin/clients/new${encodedError(missingVisualSettingsMessage())}`);

  if (error || !data) redirect(`/admin/clients/new${encodedError("No se pudo crear el cliente.")}`);

  revalidatePath("/admin");
  redirect(`/admin/clients/${data.id}`);
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const validation = validateClientInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/${clientId}${encodedError(validation.error || "Datos inválidos.")}`);

  const { data: existing } = await supabase.from("clients").select("id").eq("slug", validation.data.slug).neq("id", clientId).maybeSingle();
  if (existing) redirect(`/admin/clients/${clientId}${encodedError("Este slug ya está en uso.")}`);

  const { data: currentClient } = await supabase.from("clients").select("slug").eq("id", clientId).maybeSingle();
  const { error } = await supabase.from("clients").update(validation.data).eq("id", clientId);
  if (error && isMissingCommercialSettingsError(error)) redirect(`/admin/clients/${clientId}${encodedError(missingCommercialSettingsMessage())}`);
  if (error && isMissingVisualSettingsError(error)) redirect(`/admin/clients/${clientId}${encodedError(missingVisualSettingsMessage())}`);

  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo guardar la información.")}`);

  await revalidateClientSurfaces(supabase, clientId, validation.data.slug);
  if (currentClient?.slug && currentClient.slug !== validation.data.slug) {
    revalidatePath(`/menu/${currentClient.slug}`);
    revalidatePath(`/reservar/${currentClient.slug}`);
  }
  redirect(`/admin/clients/${clientId}?saved=client`);
}

export async function updateClientInlineAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const validation = validateClientInput(formData);

  if (validation.error || !validation.data) {
    return { ok: false as const, error: validation.error || "Datos invalidos." };
  }

  const { data: existing } = await supabase.from("clients").select("id").eq("slug", validation.data.slug).neq("id", clientId).maybeSingle();
  if (existing) return { ok: false as const, error: "Este slug ya esta en uso." };

  const { data: currentClient } = await supabase.from("clients").select("slug").eq("id", clientId).maybeSingle();
  const { error } = await supabase.from("clients").update(validation.data).eq("id", clientId);

  if (error && isMissingCommercialSettingsError(error)) return { ok: false as const, error: missingCommercialSettingsMessage() };
  if (error && isMissingVisualSettingsError(error)) return { ok: false as const, error: missingVisualSettingsMessage() };
  if (error) return { ok: false as const, error: "No se pudo guardar la informacion." };

  await revalidateClientSurfaces(supabase, clientId, validation.data.slug);
  if (currentClient?.slug && currentClient.slug !== validation.data.slug) {
    revalidatePath(`/menu/${currentClient.slug}`);
    revalidatePath(`/reservar/${currentClient.slug}`);
  }

  return { ok: true as const, message: "Cambios guardados. La carta publica ya fue actualizada." };
}

export async function deleteClientAction(clientId: string) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const { supabase } = context;
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) redirect(`/admin${encodedError("No se pudo eliminar el cliente.")}`);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createCategoryAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateCategoryInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/${clientId}${encodedError(validation.error || "Datos inválidos.")}`);

  const { error } = await supabase.from("menu_categories").insert(validation.data);
  if (error && isMissingCategoryImageError(error)) {
    if (validation.data.image_url) redirect(`/admin/clients/${clientId}${encodedError(missingCategoryImageMessage())}`);
    const { image_url: _imageUrl, ...fallbackData } = validation.data;
    const fallback = await supabase.from("menu_categories").insert(fallbackData);
    if (fallback.error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo guardar la categoria.")}`);
  } else if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo guardar la categoria.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=category`);
}

export async function createCategoryInlineAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateCategoryInput(formData);

  if (validation.error || !validation.data) {
    return { ok: false as const, error: validation.error || "Datos invalidos." };
  }

  let result = await supabase
    .from("menu_categories")
    .insert(validation.data)
    .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
    .single();

  if (result.error && isMissingCategoryImageError(result.error)) {
    if (validation.data.image_url) return { ok: false as const, error: missingCategoryImageMessage() };
    const { image_url: _imageUrl, ...fallbackData } = validation.data;
    result = await supabase
      .from("menu_categories")
      .insert(fallbackData)
      .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
      .single();
  }

  if (result.error || !result.data) return { ok: false as const, error: "No se pudo guardar la categoria." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, category: result.data, message: "Categoria agregada sin recargar la pagina." };
}

export async function updateCategoryAction(clientId: string, categoryId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateCategoryInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/${clientId}${encodedError(validation.error || "Datos inválidos.")}`);

  const { error } = await supabase.from("menu_categories").update(validation.data).eq("id", categoryId).eq("client_id", clientId);
  if (error && isMissingCategoryImageError(error)) {
    if (validation.data.image_url) redirect(`/admin/clients/${clientId}${encodedError(missingCategoryImageMessage())}`);
    const { image_url: _imageUrl, ...fallbackData } = validation.data;
    const fallback = await supabase.from("menu_categories").update(fallbackData).eq("id", categoryId).eq("client_id", clientId);
    if (fallback.error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo actualizar la categoria.")}`);
  } else if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo actualizar la categoria.")}`);

  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=category`);
}

export async function updateCategoryInlineAction(clientId: string, categoryId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateCategoryInput(formData);

  if (validation.error || !validation.data) {
    return { ok: false as const, error: validation.error || "Datos invalidos." };
  }

  let result = await supabase
    .from("menu_categories")
    .update(validation.data)
    .eq("id", categoryId)
    .eq("client_id", clientId)
    .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
    .single();

  if (result.error && isMissingCategoryImageError(result.error)) {
    if (validation.data.image_url) return { ok: false as const, error: missingCategoryImageMessage() };
    const { image_url: _imageUrl, ...fallbackData } = validation.data;
    result = await supabase
      .from("menu_categories")
      .update(fallbackData)
      .eq("id", categoryId)
      .eq("client_id", clientId)
      .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
      .single();
  }

  if (result.error || !result.data) return { ok: false as const, error: "No se pudo actualizar la categoria." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, category: result.data, message: "Categoria actualizada sin recargar la pagina." };
}

export async function deleteCategoryAction(clientId: string, categoryId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { error: itemsError } = await supabase.from("menu_items").delete().eq("client_id", clientId).eq("category_id", categoryId);
  if (itemsError && isOrderHistoryReferenceError(itemsError)) {
    const { error: archiveError } = await supabase.from("menu_categories").update({ is_active: false }).eq("id", categoryId).eq("client_id", clientId);
    if (archiveError) redirect(`/admin/clients/${clientId}${encodedError("No se pudo ocultar la categoria.")}`);
    await revalidateClientSurfaces(supabase, clientId);
    redirect(`/admin/clients/${clientId}?saved=category`);
  }
  if (itemsError) redirect(`/admin/clients/${clientId}${encodedError("No se pudieron eliminar los productos de la categoria.")}`);

  const { data: deletedCategory, error } = await supabase.from("menu_categories").delete().eq("id", categoryId).eq("client_id", clientId).select("id").maybeSingle();
  if (error && isOrderHistoryReferenceError(error)) {
    const { error: archiveError } = await supabase.from("menu_categories").update({ is_active: false }).eq("id", categoryId).eq("client_id", clientId);
    if (archiveError) redirect(`/admin/clients/${clientId}${encodedError("No se pudo ocultar la categoria.")}`);
    await revalidateClientSurfaces(supabase, clientId);
    redirect(`/admin/clients/${clientId}?saved=category`);
  }
  if (!deletedCategory && !error) redirect(`/admin/clients/${clientId}${encodedError("No se encontro la categoria para eliminar.")}`);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo eliminar la categoría.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=category`);
}

export async function deleteCategoryInlineAction(clientId: string, categoryId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { error: itemsError } = await supabase.from("menu_items").delete().eq("client_id", clientId).eq("category_id", categoryId);

  if (itemsError && isOrderHistoryReferenceError(itemsError)) {
    const { data, error } = await supabase
      .from("menu_categories")
      .update({ is_active: false })
      .eq("id", categoryId)
      .eq("client_id", clientId)
      .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
      .single();
    if (error || !data) return { ok: false as const, error: "No se pudo ocultar la categoria." };
    await revalidateClientSurfaces(supabase, clientId);
    return { ok: true as const, archived: true as const, category: data, message: "La categoria tiene historial y se oculto correctamente." };
  }

  if (itemsError) return { ok: false as const, error: "No se pudieron eliminar los productos de la categoria." };

  const { data: deletedCategory, error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("client_id", clientId)
    .select("id")
    .maybeSingle();

  if (error && isOrderHistoryReferenceError(error)) {
    const { data, error: archiveError } = await supabase
      .from("menu_categories")
      .update({ is_active: false })
      .eq("id", categoryId)
      .eq("client_id", clientId)
      .select("id,client_id,name,image_url,display_order,is_active,created_at,updated_at")
      .single();
    if (archiveError || !data) return { ok: false as const, error: "No se pudo ocultar la categoria." };
    await revalidateClientSurfaces(supabase, clientId);
    return { ok: true as const, archived: true as const, category: data, message: "La categoria tiene historial y se oculto correctamente." };
  }

  if (error) return { ok: false as const, error: "No se pudo eliminar la categoria." };
  if (!deletedCategory) return { ok: false as const, error: "No se encontro la categoria para eliminar." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, archived: false as const, message: "Categoria eliminada sin recargar la pagina." };
}

export async function createMenuItemAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateMenuItemInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/${clientId}${encodedError(validation.error || "Datos inválidos.")}`);

  const { error } = await supabase.from("menu_items").insert(validation.data);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo guardar el producto.")}`);

  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=item`);
}

export async function createMenuItemInlineAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateMenuItemInput(formData);

  if (validation.error || !validation.data) {
    return { ok: false as const, error: validation.error || "Datos inválidos." };
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert(validation.data)
    .select("id,client_id,category_id,name,description,price,image_url,is_available,display_order,created_at,updated_at")
    .single();
  if (error || !data) return { ok: false as const, error: "No se pudo guardar el producto." };

  await revalidateClientSurfaces(supabase, clientId);
  return {
    ok: true as const,
    item: { ...data, price: Number(data.price) },
    message: "Producto agregado. La carta y la galeria ya estan actualizadas."
  };
}

export async function updateMenuItemInlineAction(clientId: string, itemId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateMenuItemInput(formData);

  if (validation.error || !validation.data) {
    return { ok: false as const, error: validation.error || "Datos invalidos." };
  }

  const { data, error } = await supabase
    .from("menu_items")
    .update(validation.data)
    .eq("id", itemId)
    .eq("client_id", clientId)
    .select("id,client_id,category_id,name,description,price,image_url,is_available,display_order,created_at,updated_at")
    .single();

  if (error || !data) return { ok: false as const, error: "No se pudo actualizar el producto." };

  await revalidateClientSurfaces(supabase, clientId);
  return {
    ok: true as const,
    item: { ...data, price: Number(data.price) },
    message: "Producto actualizado sin recargar la pagina."
  };
}

export async function updateMenuItemAction(clientId: string, itemId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  formData.set("client_id", clientId);
  const validation = validateMenuItemInput(formData);
  if (validation.error || !validation.data) redirect(`/admin/clients/${clientId}${encodedError(validation.error || "Datos inválidos.")}`);

  const { error } = await supabase.from("menu_items").update(validation.data).eq("id", itemId).eq("client_id", clientId);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo actualizar el producto.")}`);

  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=item`);
}

export async function deleteMenuItemAction(clientId: string, itemId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId).eq("client_id", clientId);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo eliminar el producto.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=item`);
}

export async function deleteMenuItemInlineAction(clientId: string, itemId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { data, error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("client_id", clientId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false as const, error: "No se pudo eliminar el producto." };
  if (!data) return { ok: false as const, error: "No se encontro el producto." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, message: "Producto eliminado sin recargar la pagina." };
}

export async function createTableAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const tableNumber = String(formData.get("table_number") || "").trim();
  const labelValue = String(formData.get("label") || "").trim();
  const label = labelValue || `Mesa ${tableNumber}`;
  const seats = Number(formData.get("seats") || 4);

  if (!tableNumber) redirect(`/admin/clients/${clientId}${encodedError("El número de mesa es obligatorio.")}`);

  const { error } = await supabase.from("client_tables").insert({
    client_id: clientId,
    table_number: tableNumber,
    label,
    seats: Number.isFinite(seats) ? seats : 4,
    status: "available",
    is_active: true
  });

  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo crear la mesa. Revisa si ya existe.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=table`);
}

export async function updateTableAction(clientId: string, tableId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const tableNumber = String(formData.get("table_number") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const seats = Number(formData.get("seats") || 4);
  const status = String(formData.get("status") || "available");

  if (!tableNumber || !label) redirect(`/admin/clients/${clientId}${encodedError("La mesa necesita número y nombre.")}`);

  const { error } = await supabase
    .from("client_tables")
    .update({
      table_number: tableNumber,
      label,
      seats: Number.isFinite(seats) ? seats : 4,
      status,
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", tableId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo actualizar la mesa.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=table`);
}

export async function deleteTableAction(clientId: string, tableId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { error } = await supabase.from("client_tables").delete().eq("id", tableId).eq("client_id", clientId);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo eliminar la mesa.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=table`);
}

export async function createTableInlineAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const tableNumber = String(formData.get("table_number") || "").trim();
  const labelValue = String(formData.get("label") || "").trim();
  const label = labelValue || `Mesa ${tableNumber}`;
  const seats = Number(formData.get("seats") || 4);

  if (!tableNumber) return { ok: false as const, error: "El numero de mesa es obligatorio." };

  const { data, error } = await supabase
    .from("client_tables")
    .insert({
      client_id: clientId,
      table_number: tableNumber,
      label,
      seats: Number.isFinite(seats) ? seats : 4,
      status: "available",
      is_active: true
    })
    .select("*")
    .single();

  if (error || !data) return { ok: false as const, error: "No se pudo crear la mesa. Revisa si el numero ya existe." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, table: data, message: "Mesa agregada sin recargar la pagina." };
}

export async function updateTableInlineAction(clientId: string, tableId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const tableNumber = String(formData.get("table_number") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const seats = Number(formData.get("seats") || 4);
  const status = String(formData.get("status") || "available");

  if (!tableNumber || !label) return { ok: false as const, error: "La mesa necesita numero y nombre." };

  const { data, error } = await supabase
    .from("client_tables")
    .update({
      table_number: tableNumber,
      label,
      seats: Number.isFinite(seats) ? seats : 4,
      status,
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", tableId)
    .eq("client_id", clientId)
    .select("*")
    .single();

  if (error || !data) return { ok: false as const, error: "No se pudo actualizar la mesa." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, table: data, message: "Mesa actualizada sin recargar la pagina." };
}

export async function deleteTableInlineAction(clientId: string, tableId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { data, error } = await supabase
    .from("client_tables")
    .delete()
    .eq("id", tableId)
    .eq("client_id", clientId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false as const, error: "No se pudo eliminar la mesa." };
  if (!data) return { ok: false as const, error: "No se encontro la mesa." };

  await revalidateClientSurfaces(supabase, clientId);
  return { ok: true as const, message: "Mesa eliminada sin recargar la pagina." };
}

export async function updateOrderStatusAction(orderId: string, formData: FormData) {
  const context = await requireAdmin();
  if (!hasModuleAccess(context, "orders")) {
    requireModuleAccess(context, "kitchen");
  }
  const { supabase } = context;
  const orderStatus = String(formData.get("order_status") || "new");
  const paymentStatus = String(formData.get("payment_status") || "pending_payment");
  const courierName = String(formData.get("courier_name") || "").trim();
  const courierPhone = String(formData.get("courier_phone") || "").trim();
  const estimatedDeliveryTime = String(formData.get("estimated_delivery_time") || "").trim();
  const trackingNote = String(formData.get("tracking_note") || "").trim();
  const redirectBase = hasModuleAccess(context, "orders") ? "/admin/orders" : "/admin/kitchen";

  if (!deliveryStatusOptions.includes(orderStatus as never)) {
    redirect(`${redirectBase}${encodedError("Estado de pedido invalido.")}`);
  }

  if (courierPhone && normalizeWhatsapp(courierPhone).length < 11) {
    redirect(`${redirectBase}${encodedError("El telefono del repartidor debe incluir un numero valido de Peru.")}`);
  }

  let currentQuery = supabase
    .from("orders")
    .select("id,client_id,order_code,order_type,order_status,payment_status,delivery_zone_id,delivery_fee,total,customer_name")
    .eq("id", orderId);

  if (context.role === "business_admin") {
    currentQuery = currentQuery.eq("client_id", context.client!.id);
  }

  const { data: currentOrder } = await currentQuery.maybeSingle();
  if (!currentOrder) redirect(`${redirectBase}${encodedError("No se encontro el pedido.")}`);

  let updateQuery = supabase
    .from("orders")
    .update({
      order_status: orderStatus,
      payment_status: paymentStatus,
      courier_name: courierName || null,
      courier_phone: courierPhone || null,
      estimated_delivery_time: estimatedDeliveryTime || null,
      tracking_note: trackingNote || null
    })
    .eq("id", orderId);

  if (context.role === "business_admin") {
    updateQuery = updateQuery.eq("client_id", context.client!.id);
  }

  const { data, error } = await updateQuery.select("id,client_id,order_code,order_type,order_status,payment_status").maybeSingle();
  if (error || !data) redirect(`${redirectBase}${encodedError("No se pudo actualizar el pedido.")}`);

  await supabase.from("order_status_events").insert({
    order_id: orderId,
    status: orderStatus,
    payment_status: paymentStatus,
    note: trackingNote || null,
    created_by: context.user.email || null
  });

  if (orderStatus === "ready" && currentOrder.order_type === "delivery") {
    await supabase
      .from("delivery_assignments")
      .upsert({
        order_id: orderId,
        client_id: currentOrder.client_id,
        courier_id: null,
        delivery_zone_id: currentOrder.delivery_zone_id || null,
        status: "PENDIENTE_ASIGNACION",
        delivery_fee: Number(currentOrder.delivery_fee || 0)
      }, { onConflict: "order_id" });
  }

  const eventType =
    paymentStatus !== currentOrder.payment_status && paymentStatus === "validated"
      ? "payment.validated"
      : orderStatus === "preparing"
        ? "kitchen.started"
        : orderStatus === "ready"
          ? "kitchen.ready"
          : orderStatus === "delivered"
            ? "order.completed"
            : orderStatus === "cancelled"
              ? "order.cancelled"
              : "order.status_changed";

  await recordOperationalActivity(
    supabase,
    {
      clientId: currentOrder.client_id,
      entityType: orderStatus === "preparing" || orderStatus === "ready" ? "kitchen" : paymentStatus !== currentOrder.payment_status ? "payment" : "order",
      entityId: orderId,
      eventType,
      fromStatus: currentOrder.order_status,
      toStatus: orderStatus,
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: {
        order_code: currentOrder.order_code,
        customer_name: currentOrder.customer_name,
        total: Number(currentOrder.total || 0),
        order_type: currentOrder.order_type,
        payment_status: paymentStatus
      },
      note: trackingNote || null
    },
    orderStatus === "ready" && currentOrder.order_type === "delivery"
      ? {
          clientId: currentOrder.client_id,
          module: "delivery",
          title: `Pedido #${currentOrder.order_code} listo para despacho`,
          message: "Cocina marco el pedido como listo. Falta asignar repartidor.",
          entityType: "delivery",
          entityId: orderId,
          priority: "high"
        }
      : paymentStatus === "validated" && paymentStatus !== currentOrder.payment_status
        ? {
            clientId: currentOrder.client_id,
            module: "orders",
            title: `Pago validado #${currentOrder.order_code}`,
            message: "El pedido ya puede avanzar a cocina.",
            entityType: "payment",
            entityId: orderId,
            priority: "normal"
          }
        : undefined
  );

  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin/delivery");
  revalidatePath(`/pedido/${orderId}`);
  redirect(`${redirectBase}?saved=order`);
}

export async function createManualOrderAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "orders");
  const { supabase } = context;
  const clientId = getClientIdForUserAction(context, formData);
  const redirectBase = "/admin/orders";

  if (!clientId) redirect(`${redirectBase}${encodedError("Selecciona un negocio para crear el pedido.")}`);
  requireClientAccess(context, clientId);

  const orderType = normalizeFormText(formData.get("order_type")) || "dine_in";
  const paymentStatus = normalizeFormText(formData.get("payment_status")) || "pending_payment";
  const sendToKitchen = formData.get("send_to_kitchen") === "on";
  const validOrderTypes = ["dine_in", "pickup", "delivery"];
  const validPaymentStatuses = ["pending_payment", "proof_submitted", "validated", "rejected"];

  if (!validOrderTypes.includes(orderType)) redirect(`${redirectBase}${encodedError("Tipo de pedido invalido.")}`);
  if (!validPaymentStatuses.includes(paymentStatus)) redirect(`${redirectBase}${encodedError("Estado de pago invalido.")}`);

  let parsedItems: Array<{ menuItemId: string; quantity: number; note?: string }> = [];
  try {
    parsedItems = JSON.parse(normalizeFormText(formData.get("items_json")) || "[]");
  } catch {
    redirect(`${redirectBase}${encodedError("No se pudo leer el detalle de productos.")}`);
  }

  const cleanItems = parsedItems
    .map((item) => ({
      menuItemId: String(item.menuItemId || "").trim(),
      quantity: Math.max(1, Math.min(99, Number(item.quantity || 1))),
      note: String(item.note || "").trim()
    }))
    .filter((item) => item.menuItemId);

  if (cleanItems.length === 0) redirect(`${redirectBase}${encodedError("Agrega al menos un producto al pedido.")}`);

  const itemIds = Array.from(new Set(cleanItems.map((item) => item.menuItemId)));
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id,client_id,name,price,is_available")
    .eq("client_id", clientId)
    .in("id", itemIds);

  if (menuError || !menuItems?.length) redirect(`${redirectBase}${encodedError("No se pudieron validar los productos.")}`);

  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const unavailableItem = cleanItems.find((item) => {
    const menuItem = menuById.get(item.menuItemId);
    return !menuItem || !menuItem.is_available;
  });
  if (unavailableItem) redirect(`${redirectBase}${encodedError("Uno de los productos ya no esta disponible.")}`);

  const orderItems = cleanItems.map((item) => {
    const menuItem = menuById.get(item.menuItemId)!;

    const unitPrice = Number(menuItem.price || 0);
    return {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      unit_price: unitPrice,
      quantity: item.quantity,
      item_note: item.note || null,
      subtotal: unitPrice * item.quantity
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const customerName = normalizeFormText(formData.get("customer_name"));
  const customerPhone = normalizeFormText(formData.get("customer_phone"));
  const tableId = normalizeFormText(formData.get("table_id"));
  let tableLabel = normalizeFormText(formData.get("table_label"));
  const deliveryAddress = normalizeFormText(formData.get("delivery_address"));
  const deliveryReference = normalizeFormText(formData.get("delivery_reference"));
  const deliveryZoneId = normalizeFormText(formData.get("delivery_zone_id"));
  const pickupTime = normalizeFormText(formData.get("pickup_time"));
  const notes = normalizeFormText(formData.get("notes"));
  const waiterName = normalizeFormText(formData.get("waiter_name"));
  const manualChannel = normalizeFormText(formData.get("manual_channel")) || "salon";
  const partySize = Math.max(0, Math.min(99, Number(formData.get("party_size") || 0))) || null;

  if (orderType === "dine_in") {
    if (!tableId && !tableLabel) redirect(`${redirectBase}${encodedError("Selecciona o escribe la mesa del pedido.")}`);
    if (tableId) {
      const { data: table } = await supabase
        .from("client_tables")
        .select("id,label,table_number")
        .eq("id", tableId)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .maybeSingle();
      if (!table) redirect(`${redirectBase}${encodedError("La mesa seleccionada ya no esta disponible.")}`);
      tableLabel = table.label || `Mesa ${table.table_number}`;
    }
  }

  if ((orderType === "pickup" || orderType === "delivery") && !customerName) {
    redirect(`${redirectBase}${encodedError("Ingresa el nombre del cliente.")}`);
  }

  if (orderType === "delivery" && !deliveryAddress) {
    redirect(`${redirectBase}${encodedError("Ingresa la direccion de delivery.")}`);
  }

  let deliveryFee = 0;
  let deliveryZoneName: string | null = null;
  let estimatedDeliveryTime: string | null = null;

  if (orderType === "delivery" && deliveryZoneId) {
    const { data: zone } = await supabase
      .from("client_delivery_zones")
      .select("id,name,delivery_fee,minimum_order,estimated_time")
      .eq("id", deliveryZoneId)
      .eq("client_id", clientId)
      .eq("is_active", true)
      .maybeSingle();

    if (zone) {
      deliveryFee = Number(zone.delivery_fee || 0);
      deliveryZoneName = zone.name;
      estimatedDeliveryTime = zone.estimated_time || null;
      const minimumOrder = Number(zone.minimum_order || 0);
      if (minimumOrder > 0 && subtotal < minimumOrder) {
        redirect(`${redirectBase}${encodedError(`El pedido minimo para ${zone.name} es S/ ${minimumOrder.toFixed(2)}.`)}`);
      }
    }
  }

  const total = subtotal + deliveryFee;
  const orderStatus = sendToKitchen
    ? "preparing"
    : paymentStatus === "validated"
      ? "payment_validated"
      : paymentStatus === "proof_submitted"
        ? "payment_submitted"
        : "payment_pending";

  let insertedOrder = null;
  let insertError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabase
      .from("orders")
      .insert({
        client_id: clientId,
        order_code: buildOrderCode(),
        order_type: orderType,
        source: "manual_admin",
        created_by_user_id: context.user.id,
        manual_channel: manualChannel,
        waiter_name: waiterName || null,
        party_size: partySize,
        table_id: orderType === "dine_in" ? tableId || null : null,
        table_label: orderType === "dine_in" ? tableLabel || null : null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        delivery_address: orderType === "delivery" ? deliveryAddress : null,
        delivery_reference: orderType === "delivery" ? deliveryReference || null : null,
        delivery_zone_id: orderType === "delivery" ? deliveryZoneId || null : null,
        delivery_zone_name: deliveryZoneName,
        pickup_time: orderType === "pickup" ? pickupTime || null : null,
        notes: notes || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        order_status: orderStatus,
        payment_status: paymentStatus,
        estimated_delivery_time_snapshot: estimatedDeliveryTime
      })
      .select("id,client_id,order_code,order_type,order_status,payment_status,total,customer_name,table_label")
      .single();

    insertedOrder = result.data;
    insertError = result.error;
    if (!insertError) break;
  }

  if (!insertedOrder || insertError) {
    if (isMissingManualOrderError(insertError)) {
      redirect(`${redirectBase}${encodedError("Falta aplicar la migracion 014_manual_orders.sql en Supabase para guardar pedidos manuales.")}`);
    }
    redirect(`${redirectBase}${encodedError("No se pudo crear el pedido manual.")}`);
  }

  const { error: itemError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: insertedOrder.id })));
  if (itemError) redirect(`${redirectBase}${encodedError("El pedido se creo, pero no se pudieron guardar sus productos.")}`);

  await supabase.from("order_status_events").insert({
    order_id: insertedOrder.id,
    status: insertedOrder.order_status,
    payment_status: insertedOrder.payment_status,
    note: sendToKitchen ? "Pedido manual enviado a cocina" : "Pedido manual registrado",
    created_by: context.user.email || null
  });

  await recordOperationalActivity(
    supabase,
    {
      clientId,
      entityType: sendToKitchen ? "kitchen" : "order",
      entityId: insertedOrder.id,
      eventType: "order.created_manual",
      fromStatus: null,
      toStatus: insertedOrder.order_status,
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: {
        order_code: insertedOrder.order_code,
        customer_name: insertedOrder.customer_name,
        table_label: insertedOrder.table_label,
        total,
        order_type: insertedOrder.order_type,
        manual_channel: manualChannel,
        waiter_name: waiterName || null,
        item_count: orderItems.length
      },
      note: notes || null
    },
    {
      clientId,
      module: sendToKitchen ? "kitchen" : "orders",
      title: sendToKitchen ? `Pedido manual #${insertedOrder.order_code} a cocina` : `Pedido manual #${insertedOrder.order_code}`,
      message: `${customerName || tableLabel || "Venta en sala"} por S/ ${total.toFixed(2)}.`,
      entityType: "order",
      entityId: insertedOrder.id,
      priority: sendToKitchen ? "high" : "normal"
    }
  );

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/kitchen");
  revalidatePath("/admin/delivery");
  revalidatePath(`/pedido/${insertedOrder.id}`);
  redirect(`${redirectBase}?saved=manual-order`);
}

export async function updateDemoRequestStatusAction(requestId: string, formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const status = normalizeFormText(formData.get("status"));
  const followUpNote = normalizeFormText(formData.get("follow_up_note"));
  const planInterest = normalizeFormText(formData.get("plan_interest"));

  if (!(status in demoStatusLabels)) {
    redirect(`/admin/demos${encodedError("Selecciona un estado comercial valido.")}`);
  }

  const { error } = await context.supabase
    .from("demo_requests")
    .update({
      status,
      follow_up_note: followUpNote || null,
      plan_interest: planInterest || null
    })
    .eq("id", requestId);

  if (error) redirect(`/admin/demos${encodedError("No se pudo actualizar la solicitud. Aplica la migracion 015 si falta.")}`);

  revalidatePath("/admin");
  revalidatePath("/admin/demos");
  redirect("/admin/demos?saved=status");
}

export async function scheduleDemoRequestAction(requestId: string, formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const meetingDate = normalizeFormText(formData.get("meeting_date"));
  const meetingTime = normalizeFormText(formData.get("meeting_time"));
  const meetingChannel = normalizeFormText(formData.get("meeting_channel"));
  const meetingLink = normalizeFormText(formData.get("meeting_link"));
  const ownerEmail = normalizeFormText(formData.get("owner_email"));

  if (!meetingDate || !meetingTime) {
    redirect(`/admin/demos${encodedError("Agenda fecha y hora para la demo.")}`);
  }

  if (meetingChannel && !demoMeetingChannels.includes(meetingChannel as never)) {
    redirect(`/admin/demos${encodedError("Selecciona un canal de reunion valido.")}`);
  }

  const { error } = await context.supabase
    .from("demo_requests")
    .update({
      status: "DEMO_AGENDADA",
      meeting_date: meetingDate,
      meeting_time: meetingTime,
      meeting_channel: meetingChannel || null,
      meeting_link: meetingLink || null,
      owner_email: ownerEmail || context.user.email || null
    })
    .eq("id", requestId);

  if (error) redirect(`/admin/demos${encodedError("No se pudo agendar la demo. Aplica la migracion 015 si falta.")}`);

  revalidatePath("/admin");
  revalidatePath("/admin/demos");
  redirect("/admin/demos?saved=schedule");
}

export async function convertDemoRequestToClientAction(requestId: string, formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const ownerEmail = normalizeFormText(formData.get("owner_email"));
  const planName = normalizeFormText(formData.get("plan_name"));

  const { data: request, error: requestError } = await context.supabase
    .from("demo_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) redirect(`/admin/demos${encodedError("No se encontro la solicitud.")}`);
  if (request.converted_client_id) redirect(`/admin/demos${encodedError("Esta solicitud ya fue convertida.")}`);

  const businessType = request.business_type && request.business_type in businessTypeLabels ? request.business_type : "restaurant";
  const baseSlug = generateSlug(request.business_name) || `negocio-${Date.now()}`;
  let slug = baseSlug;
  let insertedClient = null;
  let insertError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await context.supabase
      .from("clients")
      .insert({
        name: request.business_name,
        slug,
        business_type: businessType,
        commercial_status: "EN_CONFIGURACION",
        plan_name: planName || null,
        whatsapp_number: request.whatsapp,
        primary_color: "#FF6A00",
        is_active: false,
        admin_email: ownerEmail || request.owner_email || null
      })
      .select("id")
      .single();

    insertedClient = result.data;
    insertError = result.error;
    if (!insertError) break;
    slug = `${baseSlug}-${attempt + 2}`;
  }

  if (!insertedClient || insertError) {
    if (isMissingCommercialSettingsError(insertError)) {
      redirect(`/admin/demos${encodedError(missingCommercialSettingsMessage())}`);
    }
    redirect(`/admin/demos${encodedError("No se pudo crear el cliente desde la solicitud.")}`);
  }

  await context.supabase
    .from("demo_requests")
    .update({
      status: "CONVERTIDO",
      converted_client_id: insertedClient.id,
      owner_email: ownerEmail || request.owner_email || null
    })
    .eq("id", requestId);

  revalidatePath("/admin");
  revalidatePath("/admin/demos");
  revalidatePath(`/admin/clients/${insertedClient.id}`);
  redirect(`/admin/clients/${insertedClient.id}?saved=converted`);
}

export async function updateNotificationWhatsappAction(clientId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "settings");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const notificationWhatsappNumber = String(formData.get("notification_whatsapp_number") || "").trim();

  if (notificationWhatsappNumber && normalizeWhatsapp(notificationWhatsappNumber).length < 11) {
    redirect(`/admin/settings${encodedError("El WhatsApp de notificaciones debe incluir un número válido de Perú.")}`);
  }

  const { error } = await supabase
    .from("clients")
    .update({ notification_whatsapp_number: notificationWhatsappNumber || null })
    .eq("id", clientId);

  if (error) {
    redirect(`/admin/settings${encodedError("No se pudo guardar el WhatsApp de notificaciones. Revisa que la migración 006 esté aplicada en Supabase.")}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=notifications");
}

function collectModulePermissions(formData: FormData): ModulePermissions {
  return configurableModules.reduce<ModulePermissions>((permissions, module) => {
    permissions[module] = formData.get(`module_${module}`) === "on";
    return permissions;
  }, {});
}

function getClientIdForUserAction(context: Awaited<ReturnType<typeof requireAdmin>>, formData: FormData) {
  const requestedClientId = String(formData.get("client_id") || "").trim();
  if (context.role === "super_admin") return requestedClientId;
  return context.client?.id || "";
}

function canManageBusinessUsers(context: Awaited<ReturnType<typeof requireAdmin>>, targetRole: string) {
  if (context.role === "super_admin") return true;
  if (targetRole === "business_owner") return false;
  return context.businessRole === "business_owner" || context.businessRole === "business_admin";
}

export async function createClientUserAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "users");

  const clientId = getClientIdForUserAction(context, formData);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const role = normalizeBusinessRole(String(formData.get("role") || "business_admin"));
  const modulePermissions = collectModulePermissions(formData);

  if (!clientId) redirect(`/admin/users${encodedError("Selecciona un negocio.")}`);
  requireClientAccess(context, clientId);
  if (!email || !email.includes("@")) redirect(`/admin/users${encodedError("Ingresa un correo valido.")}`);
  if (!businessRoles.includes(role)) redirect(`/admin/users${encodedError("Selecciona un rol valido.")}`);
  if (!canManageBusinessUsers(context, role)) redirect(`/admin/users${encodedError("No puedes asignar ese rol.")}`);
  if (password && password.length < 8) redirect(`/admin/users${encodedError("La contrasena temporal debe tener al menos 8 caracteres.")}`);

  let authUserId: string | null = null;

  if (password) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (error && !error.message.toLowerCase().includes("already")) {
      redirect(`/admin/users${encodedError("No se pudo crear el usuario en Auth. Revisa el correo o la contrasena.")}`);
    }

    authUserId = data.user?.id || null;
  }

  const { error } = await context.supabase.from("client_users").upsert(
    {
      client_id: clientId,
      user_id: authUserId,
      email,
      full_name: fullName || null,
      role,
      module_permissions: resolveModulePermissions(role, modulePermissions),
      is_active: true
    },
    { onConflict: "client_id,email" }
  );

  if (error) redirect(`/admin/users${encodedError("No se pudo guardar el usuario. Revisa que la migracion 008 este aplicada.")}`);

  revalidatePath("/admin/users");
  redirect("/admin/users?saved=user");
}

export async function updateClientUserAction(userId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "users");

  const clientId = getClientIdForUserAction(context, formData);
  const fullName = String(formData.get("full_name") || "").trim();
  const role = normalizeBusinessRole(String(formData.get("role") || "business_admin"));
  const modulePermissions = collectModulePermissions(formData);
  const isActive = formData.get("is_active") === "on";

  if (!clientId) redirect(`/admin/users${encodedError("Selecciona un negocio.")}`);
  requireClientAccess(context, clientId);
  if (!canManageBusinessUsers(context, role)) redirect(`/admin/users${encodedError("No puedes asignar ese rol.")}`);

  const { error } = await context.supabase
    .from("client_users")
    .update({
      full_name: fullName || null,
      role,
      module_permissions: resolveModulePermissions(role, modulePermissions),
      is_active: isActive
    })
    .eq("id", userId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/users${encodedError("No se pudo actualizar el usuario.")}`);

  revalidatePath("/admin/users");
  redirect("/admin/users?saved=user");
}

export async function deleteClientUserAction(userId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "users");

  const clientId = getClientIdForUserAction(context, formData);
  if (!clientId) redirect(`/admin/users${encodedError("Selecciona un negocio.")}`);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase.from("client_users").update({ is_active: false }).eq("id", userId).eq("client_id", clientId);
  if (error) redirect(`/admin/users${encodedError("No se pudo desactivar el usuario.")}`);

  revalidatePath("/admin/users");
  redirect("/admin/users?saved=user");
}

export async function createDeliveryZoneAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const name = String(formData.get("name") || "").trim();
  const deliveryFee = Number(formData.get("delivery_fee") || 0);
  const minimumOrder = Number(formData.get("minimum_order") || 0);

  if (!name) redirect(`/admin/delivery${encodedError("Ingresa el nombre de la zona.")}`);

  const { error } = await context.supabase.from("client_delivery_zones").insert({
    client_id: clientId,
    name,
    description: String(formData.get("description") || "").trim() || null,
    delivery_fee: Number.isFinite(deliveryFee) ? Math.max(0, deliveryFee) : 0,
    minimum_order: Number.isFinite(minimumOrder) ? Math.max(0, minimumOrder) : 0,
    estimated_time: String(formData.get("estimated_time") || "").trim() || null,
    display_order: Number(formData.get("display_order") || 0),
    is_active: formData.get("is_active") === "on"
  });

  if (error) redirect(`/admin/delivery${encodedError("No se pudo crear la zona. Revisa que la migracion 009 este aplicada.")}`);
  revalidatePath("/admin/delivery");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/delivery?saved=zone");
}

export async function updateDeliveryZoneAction(zoneId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const deliveryFee = Number(formData.get("delivery_fee") || 0);
  const minimumOrder = Number(formData.get("minimum_order") || 0);

  const { error } = await context.supabase
    .from("client_delivery_zones")
    .update({
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      delivery_fee: Number.isFinite(deliveryFee) ? Math.max(0, deliveryFee) : 0,
      minimum_order: Number.isFinite(minimumOrder) ? Math.max(0, minimumOrder) : 0,
      estimated_time: String(formData.get("estimated_time") || "").trim() || null,
      display_order: Number(formData.get("display_order") || 0),
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", zoneId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/delivery${encodedError("No se pudo actualizar la zona.")}`);
  revalidatePath("/admin/delivery");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/delivery?saved=zone");
}

export async function deleteDeliveryZoneAction(zoneId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase.from("client_delivery_zones").delete().eq("id", zoneId).eq("client_id", clientId);
  if (error) redirect(`/admin/delivery${encodedError("No se pudo eliminar la zona.")}`);
  revalidatePath("/admin/delivery");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/delivery?saved=zone");
}

export async function createPromotionAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "promotions");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const title = String(formData.get("title") || "").trim();
  if (!title) redirect(`/admin/promotions${encodedError("Ingresa el titulo de la promocion.")}`);

  const { error } = await context.supabase.from("promotions").insert({
    client_id: clientId,
    title,
    description: String(formData.get("description") || "").trim() || null,
    promo_type: String(formData.get("promo_type") || "general"),
    discount_type: String(formData.get("discount_type") || "none"),
    discount_value: Number(formData.get("discount_value") || 0),
    coupon_code: String(formData.get("coupon_code") || "").trim() || null,
    display_order: Number(formData.get("display_order") || 0),
    is_active: formData.get("is_active") === "on"
  });

  if (error) redirect(`/admin/promotions${encodedError("No se pudo crear la promocion. Revisa que la migracion 009 este aplicada.")}`);
  revalidatePath("/admin/promotions");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/promotions?saved=promotion");
}

export async function updatePromotionAction(promotionId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "promotions");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase
    .from("promotions")
    .update({
      title: String(formData.get("title") || "").trim(),
      description: String(formData.get("description") || "").trim() || null,
      promo_type: String(formData.get("promo_type") || "general"),
      discount_type: String(formData.get("discount_type") || "none"),
      discount_value: Number(formData.get("discount_value") || 0),
      coupon_code: String(formData.get("coupon_code") || "").trim() || null,
      display_order: Number(formData.get("display_order") || 0),
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", promotionId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/promotions${encodedError("No se pudo actualizar la promocion.")}`);
  revalidatePath("/admin/promotions");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/promotions?saved=promotion");
}

export async function deletePromotionAction(promotionId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "promotions");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase.from("promotions").delete().eq("id", promotionId).eq("client_id", clientId);
  if (error) redirect(`/admin/promotions${encodedError("No se pudo eliminar la promocion.")}`);
  revalidatePath("/admin/promotions");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/promotions?saved=promotion");
}

export async function createPaymentMethodAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "payments");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const label = String(formData.get("label") || "").trim();
  if (!label) redirect(`/admin/payments${encodedError("Ingresa el nombre del metodo de pago.")}`);

  const { error } = await context.supabase.from("client_payment_methods").insert({
    client_id: clientId,
    method_type: String(formData.get("method_type") || "yape"),
    label,
    phone_number: String(formData.get("phone_number") || "").trim() || null,
    qr_url: String(formData.get("qr_url") || "").trim() || null,
    instructions: String(formData.get("instructions") || "").trim() || null,
    display_order: Number(formData.get("display_order") || 0),
    is_active: formData.get("is_active") === "on"
  });

  if (error) redirect(`/admin/payments${encodedError("No se pudo crear el metodo de pago. Revisa que la migracion 009 este aplicada.")}`);
  revalidatePath("/admin/payments");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/payments?saved=payment");
}

export async function updatePaymentMethodAction(methodId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "payments");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase
    .from("client_payment_methods")
    .update({
      method_type: String(formData.get("method_type") || "yape"),
      label: String(formData.get("label") || "").trim(),
      phone_number: String(formData.get("phone_number") || "").trim() || null,
      qr_url: String(formData.get("qr_url") || "").trim() || null,
      instructions: String(formData.get("instructions") || "").trim() || null,
      display_order: Number(formData.get("display_order") || 0),
      is_active: formData.get("is_active") === "on"
    })
    .eq("id", methodId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/payments${encodedError("No se pudo actualizar el metodo de pago.")}`);
  revalidatePath("/admin/payments");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/payments?saved=payment");
}

export async function deletePaymentMethodAction(methodId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "payments");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase.from("client_payment_methods").delete().eq("id", methodId).eq("client_id", clientId);
  if (error) redirect(`/admin/payments${encodedError("No se pudo eliminar el metodo de pago.")}`);
  revalidatePath("/admin/payments");
  await revalidateClientSurfaces(context.supabase, clientId);
  redirect("/admin/payments?saved=payment");
}

export async function createCourierAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!name) redirect(`/admin/delivery${encodedError("Ingresa el nombre del repartidor.")}`);
  if (phone && normalizeWhatsapp(phone).length < 11) redirect(`/admin/delivery${encodedError("El telefono del repartidor debe incluir un numero valido de Peru.")}`);

  const { error } = await context.supabase.from("couriers").insert({
    client_id: clientId,
    name,
    phone: phone || null,
    document_number: String(formData.get("document_number") || "").trim() || null,
    vehicle_type: String(formData.get("vehicle_type") || "MOTO"),
    vehicle_plate: String(formData.get("vehicle_plate") || "").trim() || null,
    main_zone_id: String(formData.get("main_zone_id") || "") || null,
    status: String(formData.get("status") || "DISPONIBLE"),
    is_active: formData.get("is_active") === "on",
    notes: String(formData.get("notes") || "").trim() || null
  });

  if (error) redirect(`/admin/delivery${encodedError("No se pudo crear el repartidor. Aplica la migracion 010 en Supabase.")}`);
  revalidatePath("/admin/delivery");
  redirect("/admin/delivery?saved=courier");
}

export async function updateCourierAction(courierId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const phone = String(formData.get("phone") || "").trim();
  if (phone && normalizeWhatsapp(phone).length < 11) redirect(`/admin/delivery${encodedError("El telefono del repartidor debe incluir un numero valido de Peru.")}`);

  const { error } = await context.supabase
    .from("couriers")
    .update({
      name: String(formData.get("name") || "").trim(),
      phone: phone || null,
      document_number: String(formData.get("document_number") || "").trim() || null,
      vehicle_type: String(formData.get("vehicle_type") || "MOTO"),
      vehicle_plate: String(formData.get("vehicle_plate") || "").trim() || null,
      main_zone_id: String(formData.get("main_zone_id") || "") || null,
      status: String(formData.get("status") || "DISPONIBLE"),
      is_active: formData.get("is_active") === "on",
      notes: String(formData.get("notes") || "").trim() || null
    })
    .eq("id", courierId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/delivery${encodedError("No se pudo actualizar el repartidor.")}`);
  revalidatePath("/admin/delivery");
  redirect("/admin/delivery?saved=courier");
}

export async function assignCourierToOrderAction(orderId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const courierId = String(formData.get("courier_id") || "");
  if (!courierId) redirect(`/admin/delivery${encodedError("Selecciona un repartidor.")}`);

  const [{ data: order }, { data: courier }, { data: previousAssignment }] = await Promise.all([
    context.supabase.from("orders").select("id,client_id,delivery_zone_id,delivery_fee").eq("id", orderId).eq("client_id", clientId).maybeSingle(),
    context.supabase.from("couriers").select("id,client_id,name,phone,is_active,status").eq("id", courierId).eq("client_id", clientId).maybeSingle(),
    context.supabase.from("delivery_assignments").select("*").eq("order_id", orderId).maybeSingle()
  ]);

  if (!order || !courier) redirect(`/admin/delivery${encodedError("No se encontro el pedido o repartidor.")}`);
  if (!courier.is_active || courier.status === "INACTIVO" || courier.status === "FUERA_DE_TURNO") redirect(`/admin/delivery${encodedError("Este repartidor no esta disponible para asignar.")}`);

  const { data: assignment, error } = await context.supabase
    .from("delivery_assignments")
    .upsert({
      order_id: orderId,
      client_id: clientId,
      courier_id: courierId,
      delivery_zone_id: order.delivery_zone_id || null,
      delivery_fee: Number(order.delivery_fee || 0),
      status: "ASIGNADO",
      assigned_at: new Date().toISOString()
    }, { onConflict: "order_id" })
    .select("id,status")
    .single();

  if (error || !assignment) redirect(`/admin/delivery${encodedError("No se pudo asignar el repartidor. Aplica la migracion 010 en Supabase.")}`);

  await Promise.all([
    context.supabase.from("couriers").update({ status: "OCUPADO" }).eq("id", courierId).eq("client_id", clientId),
    context.supabase.from("orders").update({ assigned_courier_id: courierId, courier_name: courier.name, courier_phone: courier.phone || null, order_status: "handed_to_courier" }).eq("id", orderId).eq("client_id", clientId),
    context.supabase.from("delivery_status_events").insert({
      delivery_assignment_id: assignment.id,
      order_id: orderId,
      from_status: previousAssignment?.status || null,
      to_status: "ASIGNADO",
      actor_email: context.user.email || null,
      note: `Repartidor asignado: ${courier.name}`
    })
  ]);

  await recordOperationalActivity(
    context.supabase,
    {
      clientId,
      entityType: "delivery",
      entityId: orderId,
      eventType: "delivery.courier_assigned",
      fromStatus: previousAssignment?.status || "PENDIENTE_ASIGNACION",
      toStatus: "ASIGNADO",
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: { courier_id: courierId, courier_name: courier.name, order_id: orderId },
      note: `Repartidor asignado: ${courier.name}`
    },
    {
      clientId,
      module: "orders",
      title: "Delivery asignado",
      message: `El pedido ya tiene repartidor: ${courier.name}.`,
      entityType: "delivery",
      entityId: orderId,
      priority: "normal"
    }
  );

  revalidatePath("/admin/delivery");
  revalidatePath("/admin/orders");
  redirect("/admin/delivery?saved=assignment");
}

export async function updateDeliveryAssignmentStatusAction(assignmentId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const nextStatus = String(formData.get("status") || "PENDIENTE_ASIGNACION");
  const note = String(formData.get("note") || "").trim();
  const { data: assignment } = await context.supabase.from("delivery_assignments").select("*").eq("id", assignmentId).eq("client_id", clientId).maybeSingle();
  if (!assignment) redirect(`/admin/delivery${encodedError("No se encontro el despacho.")}`);

  const now = new Date().toISOString();
  const timestampPatch: Record<string, string | null> = {};
  if (nextStatus === "REPARTIDOR_EN_LOCAL") timestampPatch.courier_arrived_at = now;
  if (nextStatus === "RECOGIDO") timestampPatch.picked_up_at = now;
  if (nextStatus === "EN_CAMINO") timestampPatch.on_the_way_at = now;
  if (nextStatus === "ENTREGADO") timestampPatch.delivered_at = now;
  if (nextStatus === "FALLIDO" || nextStatus === "INCIDENCIA") timestampPatch.failed_at = now;

  const { error } = await context.supabase
    .from("delivery_assignments")
    .update({ status: nextStatus, incident_note: note || assignment.incident_note || null, ...timestampPatch })
    .eq("id", assignmentId)
    .eq("client_id", clientId);

  if (error) redirect(`/admin/delivery${encodedError("No se pudo actualizar el despacho.")}`);

  const orderStatus = nextStatus === "ENTREGADO" ? "delivered" : nextStatus === "EN_CAMINO" || nextStatus === "RECOGIDO" ? "on_the_way" : nextStatus === "CANCELADO" ? "cancelled" : null;
  await Promise.all([
    orderStatus ? context.supabase.from("orders").update({ order_status: orderStatus, tracking_note: note || null }).eq("id", assignment.order_id).eq("client_id", clientId) : Promise.resolve(),
    nextStatus === "ENTREGADO" && assignment.courier_id ? context.supabase.from("couriers").update({ status: "DISPONIBLE" }).eq("id", assignment.courier_id).eq("client_id", clientId) : Promise.resolve(),
    context.supabase.from("delivery_status_events").insert({
      delivery_assignment_id: assignmentId,
      order_id: assignment.order_id,
      from_status: assignment.status,
      to_status: nextStatus,
      actor_email: context.user.email || null,
      note: note || null
    })
  ]);

  await recordOperationalActivity(
    context.supabase,
    {
      clientId,
      entityType: "delivery",
      entityId: assignment.order_id,
      eventType: nextStatus === "ENTREGADO" ? "delivery.delivered" : nextStatus === "INCIDENCIA" || nextStatus === "FALLIDO" ? "delivery.incident" : nextStatus === "EN_CAMINO" ? "delivery.on_the_way" : nextStatus === "RECOGIDO" ? "delivery.picked_up" : "delivery.status_changed",
      fromStatus: assignment.status,
      toStatus: nextStatus,
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: { assignment_id: assignmentId, order_id: assignment.order_id, courier_id: assignment.courier_id },
      note: note || null
    },
    nextStatus === "ENTREGADO"
      ? {
          clientId,
          module: "orders",
          title: "Pedido entregado",
          message: "Delivery marco el pedido como entregado.",
          entityType: "delivery",
          entityId: assignment.order_id,
          priority: "normal"
        }
      : nextStatus === "INCIDENCIA" || nextStatus === "FALLIDO"
        ? {
            clientId,
            module: "orders",
            title: "Incidencia de delivery",
            message: note || "Un despacho requiere revision.",
            entityType: "delivery",
            entityId: assignment.order_id,
            priority: "critical"
          }
        : undefined
  );

  revalidatePath("/admin/delivery");
  revalidatePath("/admin/orders");
  redirect("/admin/delivery?saved=delivery");
}

export async function updateReservationStatusAction(reservationId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const status = String(formData.get("status") || "pending");
  const note = String(formData.get("note") || "").trim();
  const { data: previous } = await context.supabase.from("reservations").select("status").eq("id", reservationId).eq("client_id", clientId).maybeSingle();
  const now = new Date().toISOString();
  const timestampPatch: Record<string, string | null> = {};
  if (status === "confirmed") timestampPatch.confirmed_at = now;
  if (status === "arrived") timestampPatch.arrived_at = now;
  if (status === "seated") timestampPatch.seated_at = now;
  if (status === "completed") timestampPatch.completed_at = now;
  if (status === "cancelled" || status === "rejected") timestampPatch.cancelled_at = now;
  if (status === "no_show") timestampPatch.no_show_at = now;

  const { error } = await context.supabase.from("reservations").update({ status, internal_note: note || null, ...timestampPatch }).eq("id", reservationId).eq("client_id", clientId);
  if (error) redirect(`/admin/reservations${encodedError("No se pudo actualizar la reserva.")}`);
  await context.supabase.from("reservation_events").insert({
    reservation_id: reservationId,
    client_id: clientId,
    from_status: previous?.status || null,
    to_status: status,
    event_type: "status_changed",
    actor_email: context.user.email || null,
    note: note || null
  });
  await recordOperationalActivity(
    context.supabase,
    {
      clientId,
      entityType: "reservation",
      entityId: reservationId,
      eventType: status === "confirmed" ? "reservation.confirmed" : status === "arrived" ? "reservation.customer_arrived" : status === "seated" ? "reservation.seated" : status === "completed" ? "reservation.completed" : status === "no_show" ? "reservation.no_show" : status === "cancelled" ? "reservation.cancelled" : "reservation.status_changed",
      fromStatus: previous?.status || null,
      toStatus: status,
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: { reservation_id: reservationId },
      note: note || null
    },
    status === "confirmed"
      ? {
          clientId,
          module: "reservations",
          title: "Reserva confirmada",
          message: "La reserva quedo confirmada y lista para operar.",
          entityType: "reservation",
          entityId: reservationId,
          priority: "normal"
        }
      : undefined
  );
  revalidatePath("/admin/reservations");
  redirect("/admin/reservations?saved=reservation");
}

export async function assignReservationTableAction(reservationId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const tableId = String(formData.get("table_id") || "");
  const { data: table } = await context.supabase.from("client_tables").select("id,label,is_active,status").eq("id", tableId).eq("client_id", clientId).maybeSingle();
  if (!table || !table.is_active || table.status === "inactive") redirect(`/admin/reservations${encodedError("Selecciona una mesa activa.")}`);

  const { error } = await context.supabase.from("reservations").update({ table_id: tableId }).eq("id", reservationId).eq("client_id", clientId);
  if (error) redirect(`/admin/reservations${encodedError("No se pudo asignar la mesa.")}`);

  await Promise.all([
    context.supabase.from("client_tables").update({ status: "reserved" }).eq("id", tableId).eq("client_id", clientId),
    context.supabase.from("reservation_events").insert({
      reservation_id: reservationId,
      client_id: clientId,
      from_status: null,
      to_status: "table_assigned",
      event_type: "table_assigned",
      actor_email: context.user.email || null,
      note: `Mesa asignada: ${table.label}`
    })
  ]);

  await recordOperationalActivity(
    context.supabase,
    {
      clientId,
      entityType: "reservation",
      entityId: reservationId,
      eventType: "reservation.table_assigned",
      fromStatus: null,
      toStatus: "table_assigned",
      actor: { userId: context.user.id, email: context.user.email, role: context.businessRole || context.role },
      metadata: { table_id: tableId, table_label: table.label },
      note: `Mesa asignada: ${table.label}`
    },
    {
      clientId,
      module: "reservations",
      title: "Mesa asignada",
      message: `La reserva ahora tiene ${table.label}.`,
      entityType: "reservation",
      entityId: reservationId,
      priority: "normal"
    }
  );

  revalidatePath("/admin/reservations");
  redirect("/admin/reservations?saved=reservation");
}

export async function updateDeliverySettingsAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const supportWhatsapp = String(formData.get("support_whatsapp") || "").trim();
  if (supportWhatsapp && normalizeWhatsapp(supportWhatsapp).length < 11) redirect(`/admin/delivery${encodedError("El WhatsApp de soporte debe incluir un numero valido de Peru.")}`);

  const { error } = await context.supabase
    .from("delivery_settings")
    .upsert({
      client_id: clientId,
      delivery_enabled: formData.get("delivery_enabled") === "on",
      pickup_enabled: formData.get("pickup_enabled") === "on",
      scheduled_orders_enabled: formData.get("scheduled_orders_enabled") === "on",
      base_preparation_minutes: Number(formData.get("base_preparation_minutes") || 20),
      base_delivery_minutes: Number(formData.get("base_delivery_minutes") || 30),
      require_courier_before_departure: formData.get("require_courier_before_departure") === "on",
      allow_delivered_without_courier: formData.get("allow_delivered_without_courier") === "on",
      support_whatsapp: supportWhatsapp || null,
      automatic_customer_message: String(formData.get("automatic_customer_message") || "").trim() || null
    }, { onConflict: "client_id" });

  if (error) redirect(`/admin/delivery${encodedError("No se pudo guardar la configuracion. Aplica la migracion 010 en Supabase.")}`);
  revalidatePath("/admin/delivery");
  redirect("/admin/delivery?tab=config&saved=settings");
}

export async function updateReservationSettingsAction(formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const { error } = await context.supabase
    .from("reservation_settings")
    .upsert({
      client_id: clientId,
      reservations_enabled: formData.get("reservations_enabled") === "on",
      confirmation_mode: String(formData.get("confirmation_mode") || "MANUAL"),
      default_duration_minutes: Number(formData.get("default_duration_minutes") || 90),
      slot_interval_minutes: Number(formData.get("slot_interval_minutes") || 30),
      max_people_per_block: Number(formData.get("max_people_per_block") || 20),
      min_notice_hours: Number(formData.get("min_notice_hours") || 2),
      max_days_ahead: Number(formData.get("max_days_ahead") || 30),
      max_people_per_reservation: Number(formData.get("max_people_per_reservation") || 12),
      require_deposit: formData.get("require_deposit") === "on",
      deposit_amount: String(formData.get("deposit_amount") || "").trim() ? Number(formData.get("deposit_amount")) : null,
      opening_hours_note: String(formData.get("opening_hours_note") || "").trim() || null,
      blocked_dates_note: String(formData.get("blocked_dates_note") || "").trim() || null,
      auto_whatsapp_message: String(formData.get("auto_whatsapp_message") || "").trim() || null
    }, { onConflict: "client_id" });

  if (error) redirect(`/admin/reservations${encodedError("No se pudo guardar la configuracion. Aplica la migracion 010 en Supabase.")}`);
  revalidatePath("/admin/reservations");
  redirect("/admin/reservations?tab=config&saved=settings");
}

export async function signOutAction() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/login");
}
