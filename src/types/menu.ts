export type Client = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hero_banner_image_url?: string | null;
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
  promo_banner_item_id?: string | null;
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
  image_url?: string | null;
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

export type ClientBusinessHour = {
  id: string;
  client_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  service_modes: string;
  created_at: string;
  updated_at: string;
};

export type ClientDeliveryZone = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  delivery_fee: number;
  minimum_order: number;
  estimated_time: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CourierStatus = "DISPONIBLE" | "OCUPADO" | "FUERA_DE_TURNO" | "INACTIVO";
export type VehicleType = "MOTO" | "BICICLETA" | "AUTO" | "CAMINANDO" | "OTRO";

export type Courier = {
  id: string;
  client_id: string;
  name: string;
  phone: string | null;
  document_number: string | null;
  vehicle_type: VehicleType;
  vehicle_plate: string | null;
  main_zone_id: string | null;
  status: CourierStatus;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryStatus = "PENDIENTE_ASIGNACION" | "ASIGNADO" | "REPARTIDOR_EN_LOCAL" | "RECOGIDO" | "EN_CAMINO" | "ENTREGADO" | "FALLIDO" | "CANCELADO" | "INCIDENCIA";

export type DeliveryAssignment = {
  id: string;
  order_id: string;
  client_id: string;
  courier_id: string | null;
  delivery_zone_id: string | null;
  status: DeliveryStatus;
  delivery_fee: number;
  assigned_at: string | null;
  courier_arrived_at: string | null;
  picked_up_at: string | null;
  on_the_way_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  incident_note: string | null;
  created_at: string;
  updated_at: string;
};

export type DeliveryStatusEvent = {
  id: string;
  delivery_assignment_id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  actor_email: string | null;
  note: string | null;
  created_at: string;
};

export type DeliverySettings = {
  id: string;
  client_id: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  scheduled_orders_enabled: boolean;
  base_preparation_minutes: number;
  base_delivery_minutes: number;
  require_courier_before_departure: boolean;
  allow_delivered_without_courier: boolean;
  support_whatsapp: string | null;
  automatic_customer_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Promotion = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  promo_type: "general" | "product" | "category" | "coupon" | "delivery" | "combo";
  discount_type: "none" | "amount" | "percent" | "free_delivery";
  discount_value: number;
  coupon_code: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "seated" | "completed" | "arrived" | "no_show" | "rejected" | "waiting" | "rescheduled";

export type Reservation = {
  id: string;
  client_id: string;
  table_id: string | null;
  reservation_code: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: ReservationStatus;
  confirmed_at?: string | null;
  arrived_at?: string | null;
  seated_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  no_show_at?: string | null;
  internal_note?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReservationEvent = {
  id: string;
  reservation_id: string;
  client_id: string;
  from_status: string | null;
  to_status: string;
  event_type: string;
  actor_email: string | null;
  note: string | null;
  created_at: string;
};

export type ReservationSettings = {
  id: string;
  client_id: string;
  reservations_enabled: boolean;
  confirmation_mode: "MANUAL" | "AUTOMATICA";
  default_duration_minutes: number;
  slot_interval_minutes: number;
  max_people_per_block: number;
  min_notice_hours: number;
  max_days_ahead: number;
  max_people_per_reservation: number;
  require_deposit: boolean;
  deposit_amount: number | null;
  opening_hours_note: string | null;
  blocked_dates_note: string | null;
  auto_whatsapp_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  client_id: string;
  method_type: "yape" | "plin" | "cash" | "card_on_delivery" | "manual_transfer" | "gateway";
  label: string;
  phone_number: string | null;
  qr_url: string | null;
  instructions: string | null;
  is_active: boolean;
  display_order: number;
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
  delivery_zone_id?: string | null;
  delivery_zone_name?: string | null;
  pickup_time: string | null;
  notes: string | null;
  cancellation_reason?: string | null;
  promised_time?: string | null;
  assigned_to?: string | null;
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

export type PublicMenuData = {
  client: Client;
  categories: CategoryWithItems[];
  tables: ClientTable[];
  deliveryZones: ClientDeliveryZone[];
  promotions: Promotion[];
  paymentMethods: PaymentMethod[];
};

export type ClientFormValues = {
  name: string;
  slug: string;
  logo_url: string;
  hero_banner_image_url: string;
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
  promo_banner_item_id: string;
  promo_banner_is_active: boolean;
  is_active: boolean;
};
