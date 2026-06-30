ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_zone_id UUID,
  ADD COLUMN IF NOT EXISTS delivery_zone_name TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS promised_time TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to TEXT;

CREATE TABLE IF NOT EXISTS public.client_business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at TIME,
  closes_at TIME,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  service_modes TEXT NOT NULL DEFAULT 'dine_in,pickup,delivery',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.client_delivery_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0,
  estimated_time TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  promo_type TEXT NOT NULL DEFAULT 'general' CHECK (promo_type IN ('general', 'product', 'category', 'coupon', 'delivery', 'combo')),
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'amount', 'percent', 'free_delivery')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.client_tables(id) ON DELETE SET NULL,
  reservation_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'seated', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('yape', 'plin', 'cash', 'card_on_delivery', 'manual_transfer', 'gateway')),
  label TEXT NOT NULL,
  phone_number TEXT,
  qr_url TEXT,
  instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_option_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  min_choices INTEGER NOT NULL DEFAULT 0,
  max_choices INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group_id UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  starts_at TIME,
  ends_at TIME,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (menu_item_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_client_business_hours_client_id ON public.client_business_hours(client_id);
CREATE INDEX IF NOT EXISTS idx_client_delivery_zones_client_id ON public.client_delivery_zones(client_id);
CREATE INDEX IF NOT EXISTS idx_promotions_client_id ON public.promotions(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_client_id ON public.reservations(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payment_methods_client_id ON public.client_payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_product_option_groups_menu_item_id ON public.product_option_groups(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_group_id ON public.product_option_values(option_group_id);
CREATE INDEX IF NOT EXISTS idx_product_availability_menu_item_id ON public.product_availability(menu_item_id);

DROP TRIGGER IF EXISTS update_client_business_hours_updated_at ON public.client_business_hours;
CREATE TRIGGER update_client_business_hours_updated_at BEFORE UPDATE ON public.client_business_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_delivery_zones_updated_at ON public.client_delivery_zones;
CREATE TRIGGER update_client_delivery_zones_updated_at BEFORE UPDATE ON public.client_delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON public.promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_payment_methods_updated_at ON public.client_payment_methods;
CREATE TRIGGER update_client_payment_methods_updated_at BEFORE UPDATE ON public.client_payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.client_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active delivery zones" ON public.client_delivery_zones;
CREATE POLICY "Public can read active delivery zones" ON public.client_delivery_zones FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active promotions" ON public.promotions;
CREATE POLICY "Public can read active promotions" ON public.promotions FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read active payment methods" ON public.client_payment_methods;
CREATE POLICY "Public can read active payment methods" ON public.client_payment_methods FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can read business hours" ON public.client_business_hours;
CREATE POLICY "Public can read business hours" ON public.client_business_hours FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
CREATE POLICY "Public can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules business hours" ON public.client_business_hours;
CREATE POLICY "Authenticated can manage growth modules business hours" ON public.client_business_hours FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules delivery zones" ON public.client_delivery_zones;
CREATE POLICY "Authenticated can manage growth modules delivery zones" ON public.client_delivery_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules promotions" ON public.promotions;
CREATE POLICY "Authenticated can manage growth modules promotions" ON public.promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules reservations" ON public.reservations;
CREATE POLICY "Authenticated can manage growth modules reservations" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules payment methods" ON public.client_payment_methods;
CREATE POLICY "Authenticated can manage growth modules payment methods" ON public.client_payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules product option groups" ON public.product_option_groups;
CREATE POLICY "Authenticated can manage growth modules product option groups" ON public.product_option_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules product option values" ON public.product_option_values;
CREATE POLICY "Authenticated can manage growth modules product option values" ON public.product_option_values FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage growth modules product availability" ON public.product_availability;
CREATE POLICY "Authenticated can manage growth modules product availability" ON public.product_availability FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.client_payment_methods (client_id, method_type, label, phone_number, qr_url, instructions, is_active, display_order)
SELECT id, 'yape', 'Yape', yape_number, yape_qr_url, 'Paga al Yape del negocio y sube tu comprobante.', true, 1
FROM public.clients
WHERE yape_number IS NOT NULL AND TRIM(yape_number) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO public.promotions (client_id, title, description, promo_type, discount_type, discount_value, is_active, display_order)
SELECT id, promo_banner_title, promo_banner_description, 'general', 'none', 0, COALESCE(promo_banner_is_active, false), 1
FROM public.clients
WHERE promo_banner_title IS NOT NULL AND TRIM(promo_banner_title) <> ''
ON CONFLICT DO NOTHING;
