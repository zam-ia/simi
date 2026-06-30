import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryWithItems, Client, ClientTable, CustomerOrderItem, MenuCategory, MenuItem, OrderStatusEvent, OrderWithDetails, PaymentProof } from "@/types/menu";

function normalizeItem(item: MenuItem): MenuItem {
  return {
    ...item,
    price: Number(item.price)
  };
}

export async function getClientById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
  if (error || !data) return null;
  return data;
}

export async function getAdminClientMenu(clientId: string) {
  const supabase = createSupabaseServerClient();

  const [{ data: client }, { data: categories }, { data: items }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", clientId).single(),
    supabase.from("menu_categories").select("*").eq("client_id", clientId).order("display_order", { ascending: true }),
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
  const supabase = createSupabaseServerClient();

  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).eq("is_active", true).single();
  if (!client) return null;

  const [{ data: categories }, { data: items }, { data: tables }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("client_id", client.id).eq("is_active", true).order("display_order", { ascending: true }),
    supabase.from("menu_items").select("*").eq("client_id", client.id).order("display_order", { ascending: true }),
    supabase.from("client_tables").select("*").eq("client_id", client.id).eq("is_active", true).order("table_number", { ascending: true })
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
    tables: (tables || []) as ClientTable[]
  };
}

export async function getAdminClientTables(clientId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("client_tables").select("*").eq("client_id", clientId).order("table_number", { ascending: true });
  return (data || []) as ClientTable[];
}

export async function getAdminClientOrders(clientId?: string) {
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
