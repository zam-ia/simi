ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS assigned_courier_id UUID,
  ADD COLUMN IF NOT EXISTS estimated_delivery_time_snapshot TEXT;

CREATE TABLE IF NOT EXISTS public.couriers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  document_number TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'MOTO' CHECK (vehicle_type IN ('MOTO', 'BICICLETA', 'AUTO', 'CAMINANDO', 'OTRO')),
  vehicle_plate TEXT,
  main_zone_id UUID REFERENCES public.client_delivery_zones(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (status IN ('DISPONIBLE', 'OCUPADO', 'FUERA_DE_TURNO', 'INACTIVO')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND table_name = 'orders'
      AND constraint_name = 'orders_assigned_courier_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_assigned_courier_id_fkey
      FOREIGN KEY (assigned_courier_id) REFERENCES public.couriers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,
  delivery_zone_id UUID REFERENCES public.client_delivery_zones(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDIENTE_ASIGNACION' CHECK (status IN ('PENDIENTE_ASIGNACION', 'ASIGNADO', 'REPARTIDOR_EN_LOCAL', 'RECOGIDO', 'EN_CAMINO', 'ENTREGADO', 'FALLIDO', 'CANCELADO', 'INCIDENCIA')),
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  assigned_at TIMESTAMPTZ,
  courier_arrived_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  on_the_way_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  incident_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id)
);

CREATE TABLE IF NOT EXISTS public.delivery_status_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_assignment_id UUID NOT NULL REFERENCES public.delivery_assignments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  scheduled_orders_enabled BOOLEAN NOT NULL DEFAULT false,
  base_preparation_minutes INTEGER NOT NULL DEFAULT 20,
  base_delivery_minutes INTEGER NOT NULL DEFAULT 30,
  require_courier_before_departure BOOLEAN NOT NULL DEFAULT true,
  allow_delivered_without_courier BOOLEAN NOT NULL DEFAULT false,
  support_whatsapp TEXT,
  automatic_customer_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id)
);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS no_show_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_note TEXT;

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'seated', 'completed', 'arrived', 'no_show', 'rejected', 'waiting', 'rescheduled'));

CREATE TABLE IF NOT EXISTS public.reservation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'status_changed',
  actor_email TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reservation_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reservations_enabled BOOLEAN NOT NULL DEFAULT true,
  confirmation_mode TEXT NOT NULL DEFAULT 'MANUAL' CHECK (confirmation_mode IN ('MANUAL', 'AUTOMATICA')),
  default_duration_minutes INTEGER NOT NULL DEFAULT 90,
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
  max_people_per_block INTEGER NOT NULL DEFAULT 20,
  min_notice_hours INTEGER NOT NULL DEFAULT 2,
  max_days_ahead INTEGER NOT NULL DEFAULT 30,
  max_people_per_reservation INTEGER NOT NULL DEFAULT 12,
  require_deposit BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2),
  opening_hours_note TEXT,
  blocked_dates_note TEXT,
  auto_whatsapp_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id)
);

ALTER TABLE public.reservation_settings
  ADD COLUMN IF NOT EXISTS max_people_per_block INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS opening_hours_note TEXT,
  ADD COLUMN IF NOT EXISTS blocked_dates_note TEXT;

CREATE INDEX IF NOT EXISTS idx_couriers_client_id ON public.couriers(client_id);
CREATE INDEX IF NOT EXISTS idx_couriers_status ON public.couriers(status);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_client_id ON public.delivery_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id ON public.delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON public.delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_delivery_status_events_assignment_id ON public.delivery_status_events(delivery_assignment_id);
CREATE INDEX IF NOT EXISTS idx_delivery_settings_client_id ON public.delivery_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_reservation_events_reservation_id ON public.reservation_events(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_settings_client_id ON public.reservation_settings(client_id);

DROP TRIGGER IF EXISTS update_couriers_updated_at ON public.couriers;
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_assignments_updated_at ON public.delivery_assignments;
CREATE TRIGGER update_delivery_assignments_updated_at BEFORE UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_settings_updated_at ON public.delivery_settings;
CREATE TRIGGER update_delivery_settings_updated_at BEFORE UPDATE ON public.delivery_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservation_settings_updated_at ON public.reservation_settings;
CREATE TRIGGER update_reservation_settings_updated_at BEFORE UPDATE ON public.reservation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can manage couriers" ON public.couriers;
CREATE POLICY "Authenticated can manage couriers" ON public.couriers FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage delivery assignments" ON public.delivery_assignments;
CREATE POLICY "Authenticated can manage delivery assignments" ON public.delivery_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage delivery status events" ON public.delivery_status_events;
CREATE POLICY "Authenticated can manage delivery status events" ON public.delivery_status_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage delivery settings" ON public.delivery_settings;
CREATE POLICY "Authenticated can manage delivery settings" ON public.delivery_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage reservation events" ON public.reservation_events;
CREATE POLICY "Authenticated can manage reservation events" ON public.reservation_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage reservation settings" ON public.reservation_settings;
CREATE POLICY "Authenticated can manage reservation settings" ON public.reservation_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
