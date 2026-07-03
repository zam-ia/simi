ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'fast_food',
  ADD COLUMN IF NOT EXISTS module_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS order_flow_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commercial_status TEXT NOT NULL DEFAULT 'ACTIVO',
  ADD COLUMN IF NOT EXISTS plan_name TEXT;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_business_type_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_business_type_check
  CHECK (business_type IN ('fast_food', 'restaurant', 'polleria', 'coffee_shop', 'bakery', 'pastry_shop', 'ice_cream_shop', 'catering', 'other_gastronomic'));

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_commercial_status_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_commercial_status_check
  CHECK (commercial_status IN ('PROSPECTO', 'DEMO_AGENDADA', 'EN_CONFIGURACION', 'ACTIVO', 'PAUSADO', 'SUSPENDIDO', 'CANCELADO'));

CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL DEFAULT 'restaurant',
  city TEXT NOT NULL DEFAULT 'Huancayo',
  contact_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  social_url TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'NUEVA',
  meeting_date DATE,
  meeting_time TIME,
  meeting_channel TEXT,
  meeting_link TEXT,
  follow_up_note TEXT,
  plan_interest TEXT,
  owner_email TEXT,
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.demo_requests
  DROP CONSTRAINT IF EXISTS demo_requests_business_type_check;

ALTER TABLE public.demo_requests
  ADD CONSTRAINT demo_requests_business_type_check
  CHECK (business_type IN ('fast_food', 'restaurant', 'polleria', 'coffee_shop', 'bakery', 'pastry_shop', 'ice_cream_shop', 'catering', 'other_gastronomic'));

ALTER TABLE public.demo_requests
  DROP CONSTRAINT IF EXISTS demo_requests_status_check;

ALTER TABLE public.demo_requests
  ADD CONSTRAINT demo_requests_status_check
  CHECK (status IN ('NUEVA', 'CONTACTADO', 'DEMO_AGENDADA', 'DEMO_REALIZADA', 'SEGUIMIENTO', 'CONVERTIDO', 'NO_INTERESADO', 'DESCARTADO'));

ALTER TABLE public.demo_requests
  DROP CONSTRAINT IF EXISTS demo_requests_meeting_channel_check;

ALTER TABLE public.demo_requests
  ADD CONSTRAINT demo_requests_meeting_channel_check
  CHECK (meeting_channel IS NULL OR meeting_channel IN ('Zoom', 'Meet', 'Presencial', 'WhatsApp'));

CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON public.demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_city ON public.demo_requests(city);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON public.demo_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_business_type ON public.clients(business_type);
CREATE INDEX IF NOT EXISTS idx_clients_commercial_status ON public.clients(commercial_status);

DROP TRIGGER IF EXISTS update_demo_requests_updated_at ON public.demo_requests;
CREATE TRIGGER update_demo_requests_updated_at
BEFORE UPDATE ON public.demo_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can manage demo requests" ON public.demo_requests;
CREATE POLICY "Authenticated can manage demo requests"
ON public.demo_requests
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
