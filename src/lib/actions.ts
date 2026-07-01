"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasModuleAccess, requireAdmin, requireClientAccess, requireModuleAccess, requireSuperAdmin } from "@/lib/auth";
import { deliveryStatusOptions } from "@/constants/order-status";
import { businessRoles, configurableModules, normalizeBusinessRole, resolveModulePermissions, type ModulePermissions } from "@/lib/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeWhatsapp } from "@/lib/utils";
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

function isMissingCategoryImageError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "PGRST204" || code === "42703" || message.includes("image_url");
}

function missingCategoryImageMessage() {
  return "Supabase todavia no reconoce imagenes para categorias. Aplica la migracion 012 y luego vuelve a guardar.";
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
  if (error && isMissingVisualSettingsError(error)) redirect(`/admin/clients/${clientId}${encodedError(missingVisualSettingsMessage())}`);

  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo guardar la información.")}`);

  await revalidateClientSurfaces(supabase, clientId, validation.data.slug);
  if (currentClient?.slug && currentClient.slug !== validation.data.slug) {
    revalidatePath(`/menu/${currentClient.slug}`);
    revalidatePath(`/reservar/${currentClient.slug}`);
  }
  redirect(`/admin/clients/${clientId}?saved=client`);
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

export async function deleteCategoryAction(clientId: string, categoryId: string) {
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, clientId);
  const { supabase } = context;
  const { error } = await supabase.from("menu_categories").delete().eq("id", categoryId).eq("client_id", clientId);
  if (error) redirect(`/admin/clients/${clientId}${encodedError("No se pudo eliminar la categoría.")}`);
  await revalidateClientSurfaces(supabase, clientId);
  redirect(`/admin/clients/${clientId}?saved=category`);
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

  if (!deliveryStatusOptions.includes(orderStatus as never)) {
    redirect(`/admin/orders${encodedError("Estado de pedido invalido.")}`);
  }

  if (courierPhone && normalizeWhatsapp(courierPhone).length < 11) {
    redirect(`/admin/orders${encodedError("El telefono del repartidor debe incluir un numero valido de Peru.")}`);
  }

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

  const { data, error } = await updateQuery.select("id,client_id").maybeSingle();
  if (error || !data) redirect(`/admin/orders${encodedError("No se pudo actualizar el pedido.")}`);

  await supabase.from("order_status_events").insert({
    order_id: orderId,
    status: orderStatus,
    payment_status: paymentStatus,
    note: trackingNote || null,
    created_by: context.user.email || null
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/pedido/${orderId}`);
  redirect("/admin/orders?saved=order");
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

export async function updateReservationStatusAction(reservationId: string, formData: FormData) {
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const clientId = getClientIdForUserAction(context, formData);
  requireClientAccess(context, clientId);

  const status = String(formData.get("status") || "pending");
  const { error } = await context.supabase.from("reservations").update({ status }).eq("id", reservationId).eq("client_id", clientId);
  if (error) redirect(`/admin/reservations${encodedError("No se pudo actualizar la reserva.")}`);
  revalidatePath("/admin/reservations");
  redirect("/admin/reservations?saved=reservation");
}

export async function signOutAction() {
  const { supabase } = await requireAdmin();
  await supabase.auth.signOut();
  redirect("/login");
}
