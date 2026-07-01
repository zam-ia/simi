import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CategoryWithItems,
  Client,
  ClientDeliveryZone,
  ClientTable,
  CustomerOrderItem,
  MenuCategory,
  MenuItem,
  OrderStatusEvent,
  OrderWithDetails,
  PaymentMethod,
  PaymentProof,
  Promotion,
  Reservation
} from "@/types/menu";

function normalizeItem(item: MenuItem): MenuItem {
  return {
    ...item,
    price: Number(item.price)
  };
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "42P01" || code === "42703" || code === "PGRST204" || message.includes("does not exist");
}

export async function getClientById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}

export async function getAdminClientMenu(clientId: string) {
  noStore();
  const supabase = createSupabaseServerClient();

  const [{ data: client }, { data: categories }, { data: items }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase.from("menu_categories").select("*").eq("client_id", clientId).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("client_id", clientId).order("display_order", { ascending: true })
  ]);

  if (!client) notFound();

  const menuCategories = (categories || []) as MenuCategory[];
  const menuItems = ((items || []) as MenuItem[]).map(normalizeItem);
  const categoriesWithItems = menuCategories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id)
  }));

  return {
    client: client as Client,
    categories: menuCategories,
    categoriesWithItems
  };
}

export async function getPublicMenuBySlug(slug: string) {
  noStore();
  const supabase = createSupabaseServerClient();

  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!client) return null;

  const [{ data: categories }, { data: items }, { data: tables }, zonesResult, promotionsResult, paymentsResult] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("client_id", client.id).order("display_order", { ascending: true }),
    supabase.from("client_tables").select("*").eq("client_id", client.id).eq("is_active", true).order("table_number", { ascending: true }),
    supabase.from("client_delivery_zones").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("promotions").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("client_payment_methods").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true })
  ]);

  const menuCategories = (categories || []) as MenuCategory[];
  const menuItems = ((items || []) as MenuItem[]).map(normalizeItem);
  const categoriesWithItems: CategoryWithItems[] = menuCategories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id)
  }));

  return {
    client: client as Client,
    categories: categoriesWithItems,
    tables: (tables || []) as ClientTable[],
    deliveryZones: zonesResult.error && isMissingTableError(zonesResult.error) ? [] : ((zonesResult.data || []) as ClientDeliveryZone[]).map((zone) => ({ ...zone, delivery_fee: Number(zone.delivery_fee), minimum_order: Number(zone.minimum_order) })),
    promotions: promotionsResult.error && isMissingTableError(promotionsResult.error) ? [] : ((promotionsResult.data || []) as Promotion[]).map((promotion) => ({ ...promotion, discount_value: Number(promotion.discount_value) })),
    paymentMethods: paymentsResult.error && isMissingTableError(paymentsResult.error) ? [] : (paymentsResult.data || []) as PaymentMethod[]
  };
}

export async function getAdminClientTables(clientId: string) {
  noStore();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("client_tables").select("*").eq("client_id", clientId).order("table_number", { ascending: true });
  return (data || []) as ClientTable[];
}

export async function getAdminClientOrders(clientId?: string) {
  noStore();
  const supabase = createSupabaseServerClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: orders } = await query;
  const orderRows = (orders || []) as OrderWithDetails[];
  const orderIds = orderRows.map((order) => order.id);

  if (orderIds.length === 0) return [];

  const [{ data: items }, { data: proofs }, { data: events }] = await Promise.all([
    supabase.from("order_items").select("*").in("order_id", orderIds),
    supabase.from("payment_proofs").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
    supabase.from("order_status_events").select("*").in("order_id", orderIds).order("created_at", { ascending: false })
  ]);

  const orderItems = (items || []) as CustomerOrderItem[];
  const paymentProofs = (proofs || []) as PaymentProof[];
  const statusEvents = (events || []) as OrderStatusEvent[];

  return orderRows.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    items: orderItems.filter((item) => item.order_id === order.id).map((item) => ({ ...item, unit_price: Number(item.unit_price), subtotal: Number(item.subtotal) })),
    payment_proofs: paymentProofs.filter((proof) => proof.order_id === order.id),
    status_events: statusEvents.filter((event) => event.order_id === order.id)
  }));
}

export async function getAdminGrowthModules(clientId?: string) {
  noStore();
  const supabase = createSupabaseServerClient();
  const zoneQuery = clientId ? supabase.from("client_delivery_zones").select("*").eq("client_id", clientId).order("display_order", { ascending: true }) : supabase.from("client_delivery_zones").select("*").order("created_at", { ascending: false });
  const promotionQuery = clientId ? supabase.from("promotions").select("*").eq("client_id", clientId).order("display_order", { ascending: true }) : supabase.from("promotions").select("*").order("created_at", { ascending: false });
  const paymentQuery = clientId ? supabase.from("client_payment_methods").select("*").eq("client_id", clientId).order("display_order", { ascending: true }) : supabase.from("client_payment_methods").select("*").order("created_at", { ascending: false });
  const reservationQuery = clientId ? supabase.from("reservations").select("*").eq("client_id", clientId).order("created_at", { ascending: false }) : supabase.from("reservations").select("*").order("created_at", { ascending: false });

  const [zones, promotions, payments, reservations] = await Promise.all([zoneQuery, promotionQuery, paymentQuery, reservationQuery]);

  return {
    zones: zones.error && isMissingTableError(zones.error) ? [] : ((zones.data || []) as ClientDeliveryZone[]).map((zone) => ({ ...zone, delivery_fee: Number(zone.delivery_fee), minimum_order: Number(zone.minimum_order) })),
    promotions: promotions.error && isMissingTableError(promotions.error) ? [] : ((promotions.data || []) as Promotion[]).map((promotion) => ({ ...promotion, discount_value: Number(promotion.discount_value) })),
    paymentMethods: payments.error && isMissingTableError(payments.error) ? [] : (payments.data || []) as PaymentMethod[],
    reservations: reservations.error && isMissingTableError(reservations.error) ? [] : (reservations.data || []) as Reservation[],
    missingGrowthTables: Boolean(zones.error || promotions.error || payments.error || reservations.error)
  };
}
