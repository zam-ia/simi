import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientServiceModes } from "@/lib/service-modes";
import type {
  CategoryWithItems,
  Client,
  ClientDeliveryZone,
  ClientTable,
  Courier,
  CustomerOrderItem,
  DeliveryAssignment,
  DeliverySettings,
  DeliveryStatusEvent,
  MenuCategory,
  MenuItem,
  OrderStatusEvent,
  OrderWithDetails,
  PaymentMethod,
  PaymentProof,
  Promotion,
  Reservation,
  ReservationEvent,
  ReservationSettings,
  WhatsAppNotification
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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}

export async function getAdminClientMenu(clientId: string) {
  noStore();
  const supabase = await createSupabaseServerClient();

  const [{ data: client }, { data: categories }, { data: items }, deliverySettingsResult, reservationSettingsResult] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase.from("menu_categories").select("*").eq("client_id", clientId).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("client_id", clientId).order("display_order", { ascending: true }),
    supabase.from("delivery_settings").select("delivery_enabled,pickup_enabled").eq("client_id", clientId).maybeSingle(),
    supabase.from("reservation_settings").select("reservations_enabled").eq("client_id", clientId).maybeSingle()
  ]);

  if (!client) notFound();

  const menuCategories = (categories || []) as MenuCategory[];
  const menuItems = ((items || []) as MenuItem[]).map(normalizeItem);
  const categoriesWithItems = menuCategories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id)
  }));
  const clientRow = client as Client;
  const serviceModes = getClientServiceModes(clientRow, {
    deliveryEnabled: deliverySettingsResult.data?.delivery_enabled,
    pickupEnabled: deliverySettingsResult.data?.pickup_enabled,
    reservationsEnabled: reservationSettingsResult.data?.reservations_enabled
  });

  return {
    client: clientRow,
    serviceModes,
    categories: menuCategories,
    categoriesWithItems
  };
}

export async function getAdminManualOrderCatalog(clientId?: string) {
  noStore();
  const supabase = await createSupabaseServerClient();

  const clientQuery = clientId
    ? supabase.from("clients").select("*").eq("id", clientId).eq("is_active", true).order("name", { ascending: true })
    : supabase.from("clients").select("*").eq("is_active", true).order("name", { ascending: true });
  const categoryQuery = clientId
    ? supabase.from("menu_categories").select("*").eq("client_id", clientId).eq("is_active", true).order("display_order", { ascending: true })
    : supabase.from("menu_categories").select("*").eq("is_active", true).order("display_order", { ascending: true });
  const itemQuery = clientId
    ? supabase.from("menu_items").select("*").eq("client_id", clientId).order("display_order", { ascending: true })
    : supabase.from("menu_items").select("*").order("display_order", { ascending: true });
  const tableQuery = clientId
    ? supabase.from("client_tables").select("*").eq("client_id", clientId).eq("is_active", true).order("table_number", { ascending: true })
    : supabase.from("client_tables").select("*").eq("is_active", true).order("table_number", { ascending: true });
  const zoneQuery = clientId
    ? supabase.from("client_delivery_zones").select("*").eq("client_id", clientId).eq("is_active", true).order("display_order", { ascending: true })
    : supabase.from("client_delivery_zones").select("*").eq("is_active", true).order("display_order", { ascending: true });

  const [clientsResult, categoriesResult, itemsResult, tablesResult, zonesResult] = await Promise.all([
    clientQuery,
    categoryQuery,
    itemQuery,
    tableQuery,
    zoneQuery
  ]);

  return {
    clients: (clientsResult.data || []) as Client[],
    categories: (categoriesResult.data || []) as MenuCategory[],
    items: ((itemsResult.data || []) as MenuItem[]).map(normalizeItem),
    tables: (tablesResult.data || []) as ClientTable[],
    deliveryZones: zonesResult.error && isMissingTableError(zonesResult.error)
      ? []
      : ((zonesResult.data || []) as ClientDeliveryZone[]).map((zone) => ({ ...zone, delivery_fee: Number(zone.delivery_fee), minimum_order: Number(zone.minimum_order) }))
  };
}

export async function getPublicMenuBySlug(slug: string) {
  noStore();
  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!client) return null;

  const [{ data: categories }, { data: items }, { data: tables }, zonesResult, promotionsResult, paymentsResult, deliverySettingsResult, reservationSettingsResult] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("client_id", client.id).order("display_order", { ascending: true }),
    supabase.from("client_tables").select("*").eq("client_id", client.id).eq("is_active", true).order("table_number", { ascending: true }),
    supabase.from("client_delivery_zones").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("promotions").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("client_payment_methods").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("delivery_settings").select("delivery_enabled,pickup_enabled").eq("client_id", client.id).maybeSingle(),
    supabase.from("reservation_settings").select("reservations_enabled").eq("client_id", client.id).maybeSingle()
  ]);

  const menuCategories = (categories || []) as MenuCategory[];
  const menuItems = ((items || []) as MenuItem[]).map(normalizeItem);
  const categoriesWithItems: CategoryWithItems[] = menuCategories.map((category) => ({
    ...category,
    items: menuItems.filter((item) => item.category_id === category.id)
  }));
  const serviceModes = getClientServiceModes(client as Client, {
    deliveryEnabled: deliverySettingsResult.data?.delivery_enabled,
    pickupEnabled: deliverySettingsResult.data?.pickup_enabled,
    reservationsEnabled: reservationSettingsResult.data?.reservations_enabled
  });

  return {
    client: client as Client,
    categories: categoriesWithItems,
    serviceModes,
    tables: serviceModes.dineIn ? (tables || []) as ClientTable[] : [],
    deliveryZones: !serviceModes.delivery || (zonesResult.error && isMissingTableError(zonesResult.error)) ? [] : ((zonesResult.data || []) as ClientDeliveryZone[]).map((zone) => ({ ...zone, delivery_fee: Number(zone.delivery_fee), minimum_order: Number(zone.minimum_order) })),
    promotions: promotionsResult.error && isMissingTableError(promotionsResult.error) ? [] : ((promotionsResult.data || []) as Promotion[]).map((promotion) => ({ ...promotion, discount_value: Number(promotion.discount_value) })),
    paymentMethods: paymentsResult.error && isMissingTableError(paymentsResult.error) ? [] : (paymentsResult.data || []) as PaymentMethod[]
  };
}

export async function getAdminClientTables(clientId: string) {
  noStore();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("client_tables").select("*").eq("client_id", clientId).order("table_number", { ascending: true });
  return (data || []) as ClientTable[];
}

export async function getAdminClientOrders(clientId?: string) {
  noStore();
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: orders } = await query;
  const orderRows = (orders || []) as OrderWithDetails[];
  const orderIds = orderRows.map((order) => order.id);

  if (orderIds.length === 0) return [];

  const [{ data: items }, { data: proofs }, { data: events }, outboxResult] = await Promise.all([
    supabase.from("order_items").select("*").in("order_id", orderIds),
    supabase.from("payment_proofs").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
    supabase.from("order_status_events").select("*").in("order_id", orderIds).order("created_at", { ascending: false }),
    supabase.from("notification_outbox").select("id,client_id,order_id,recipient_type,recipient_phone,template_name,status,attempts,last_error,created_at,sent_at,delivered_at,read_at").in("order_id", orderIds).order("created_at", { ascending: false })
  ]);

  const orderItems = (items || []) as CustomerOrderItem[];
  const paymentProofs = (proofs || []) as PaymentProof[];
  const statusEvents = (events || []) as OrderStatusEvent[];
  const whatsappNotifications = outboxResult.error && isMissingTableError(outboxResult.error) ? [] : (outboxResult.data || []) as WhatsAppNotification[];

  return orderRows.map((order) => ({
    ...order,
    subtotal: Number(order.subtotal),
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    items: orderItems.filter((item) => item.order_id === order.id).map((item) => ({ ...item, unit_price: Number(item.unit_price), subtotal: Number(item.subtotal) })),
    payment_proofs: paymentProofs.filter((proof) => proof.order_id === order.id),
    status_events: statusEvents.filter((event) => event.order_id === order.id),
    whatsapp_notifications: whatsappNotifications.filter((notification) => notification.order_id === order.id)
  }));
}

export async function getAdminGrowthModules(clientId?: string) {
  noStore();
  const supabase = await createSupabaseServerClient();
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

export async function getAdminDeliveryCenter(clientId?: string) {
  noStore();
  const supabase = await createSupabaseServerClient();
  const orders = await getAdminClientOrders(clientId);
  const deliveryOrders = orders.filter((order) => order.order_type === "delivery" && ["ready", "handed_to_courier", "on_the_way", "arriving", "delivered"].includes(order.order_status));
  const orderIds = deliveryOrders.map((order) => order.id);

  const zoneQuery = clientId ? supabase.from("client_delivery_zones").select("*").eq("client_id", clientId).order("display_order", { ascending: true }) : supabase.from("client_delivery_zones").select("*").order("created_at", { ascending: false });
  const courierQuery = clientId ? supabase.from("couriers").select("*").eq("client_id", clientId).order("created_at", { ascending: false }) : supabase.from("couriers").select("*").order("created_at", { ascending: false });
  const settingsQuery = clientId ? supabase.from("delivery_settings").select("*").eq("client_id", clientId).maybeSingle() : Promise.resolve({ data: null, error: null });
  const assignmentQuery = orderIds.length > 0 ? supabase.from("delivery_assignments").select("*").in("order_id", orderIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null });
  const eventQuery = orderIds.length > 0 ? supabase.from("delivery_status_events").select("*").in("order_id", orderIds).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null });

  const [zones, couriers, settings, assignments, events] = await Promise.all([zoneQuery, courierQuery, settingsQuery, assignmentQuery, eventQuery]);
  const missingDeliveryTables = Boolean(couriers.error || settings.error || assignments.error || events.error);
  const assignmentRows = ((assignments.data || []) as DeliveryAssignment[]).map((assignment) => ({ ...assignment, delivery_fee: Number(assignment.delivery_fee || 0) }));
  const eventRows = (events.data || []) as DeliveryStatusEvent[];

  return {
    orders: deliveryOrders,
    zones: zones.error && isMissingTableError(zones.error) ? [] : ((zones.data || []) as ClientDeliveryZone[]).map((zone) => ({ ...zone, delivery_fee: Number(zone.delivery_fee), minimum_order: Number(zone.minimum_order) })),
    couriers: missingDeliveryTables ? [] : (couriers.data || []) as Courier[],
    settings: missingDeliveryTables ? null : settings.data as DeliverySettings | null,
    assignments: missingDeliveryTables ? [] : assignmentRows,
    events: missingDeliveryTables ? [] : eventRows,
    missingDeliveryTables
  };
}

export async function getAdminReservationsCenter(clientId?: string) {
  noStore();
  const supabase = await createSupabaseServerClient();
  const reservationQuery = clientId ? supabase.from("reservations").select("*").eq("client_id", clientId).order("reservation_date", { ascending: true }).order("reservation_time", { ascending: true }) : supabase.from("reservations").select("*").order("reservation_date", { ascending: true }).order("reservation_time", { ascending: true });
  const tableQuery = clientId ? supabase.from("client_tables").select("*").eq("client_id", clientId).order("table_number", { ascending: true }) : supabase.from("client_tables").select("*").order("table_number", { ascending: true });
  const settingsQuery = clientId ? supabase.from("reservation_settings").select("*").eq("client_id", clientId).maybeSingle() : Promise.resolve({ data: null, error: null });
  const [reservations, tables, settings] = await Promise.all([reservationQuery, tableQuery, settingsQuery]);
  const reservationRows = (reservations.data || []) as Reservation[];
  const reservationIds = reservationRows.map((reservation) => reservation.id);
  const events = reservationIds.length > 0 ? await supabase.from("reservation_events").select("*").in("reservation_id", reservationIds).order("created_at", { ascending: false }) : { data: [], error: null };

  return {
    reservations: reservationRows,
    tables: (tables.data || []) as ClientTable[],
    events: events.error && isMissingTableError(events.error) ? [] : (events.data || []) as ReservationEvent[],
    settings: settings.error && isMissingTableError(settings.error) ? null : settings.data as ReservationSettings | null,
    missingReservationTables: Boolean(reservations.error || tables.error || settings.error || events.error)
  };
}
