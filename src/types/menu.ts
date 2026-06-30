export type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  whatsapp_number: string;
  notification_whatsapp_number?: string | null;
  admin_email?: string | null;
  yape_number: string | null;
  yape_qr_url: string | null;
  primary_color: string;
  secondary_color?: string | null;
  promo_banner_title?: string | null;
  promo_banner_description?: string | null;
  promo_banner_image_url?: string | null;
  promo_banner_is_active?: boolean | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientUser = {
  id: string;
  client_id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: "business_owner" | "business_admin" | "cashier" | "kitchen" | "delivery" | "viewer";
  module_permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuCategory = {
  id: string;
  client_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItem = {
  id: string;
  client_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryWithItems = MenuCategory & {
  items: MenuItem[];
};

export type ClientTable = {
  id: string;
  client_id: string;
  label: string;
  table_number: string;
  seats: number | null;
  status: "available" | "occupied" | "reserved" | "inactive";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderType = "dine_in" | "pickup" | "delivery";
export type OrderStatus =
  | "new"
  | "received"
  | "payment_pending"
  | "payment_submitted"
  | "payment_validated"
  | "preparing"
  | "ready"
  | "handed_to_courier"
  | "on_the_way"
  | "arriving"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending_payment" | "proof_submitted" | "validated" | "rejected";

export type CustomerOrder = {
  id: string;
  client_id: string;
  order_code: string;
  order_type: OrderType;
  table_id: string | null;
  table_label: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_reference: string | null;
  pickup_time: string | null;
  notes: string | null;
  courier_name?: string | null;
  courier_phone?: string | null;
  courier_latitude?: number | null;
  courier_longitude?: number | null;
  estimated_delivery_time?: string | null;
  tracking_note?: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  whatsapp_sent: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerOrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  item_note: string | null;
  subtotal: number;
  created_at: string;
};

export type PaymentProof = {
  id: string;
  order_id: string;
  operation_number: string | null;
  proof_image_url: string | null;
  status: "submitted" | "validated" | "rejected";
  created_at: string;
};

export type OrderStatusEvent = {
  id: string;
  order_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type OrderWithDetails = CustomerOrder & {
  items: CustomerOrderItem[];
  payment_proofs: PaymentProof[];
  status_events?: OrderStatusEvent[];
};

export type ClientFormValues = {
  name: string;
  slug: string;
  logo_url: string;
  address: string;
  whatsapp_number: string;
  notification_whatsapp_number: string;
  yape_number: string;
  yape_qr_url: string;
  primary_color: string;
  secondary_color: string;
  promo_banner_title: string;
  promo_banner_description: string;
  promo_banner_image_url: string;
  promo_banner_is_active: boolean;
  is_active: boolean;
};
