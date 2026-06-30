ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier_name TEXT,
  ADD COLUMN IF NOT EXISTS courier_phone TEXT,
  ADD COLUMN IF NOT EXISTS courier_latitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS courier_longitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT,
  ADD COLUMN IF NOT EXISTS tracking_note TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_order_status_check
  CHECK (
    order_status IN (
      'new',
      'received',
      'payment_pending',
      'payment_submitted',
      'payment_validated',
      'preparing',
      'ready',
      'handed_to_courier',
      'on_the_way',
      'arriving',
      'delivered',
      'cancelled'
    )
  );

CREATE TABLE IF NOT EXISTS public.order_status_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (
    status IN (
      'new',
      'received',
      'payment_pending',
      'payment_submitted',
      'payment_validated',
      'preparing',
      'ready',
      'handed_to_courier',
      'on_the_way',
      'arriving',
      'delivered',
      'cancelled'
    )
  ),
  payment_status TEXT CHECK (payment_status IN ('pending_payment', 'proof_submitted', 'validated', 'rejected')),
  note TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_events_order_id
  ON public.order_status_events(order_id, created_at DESC);

ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read order status events" ON public.order_status_events;
CREATE POLICY "Authenticated can read order status events"
ON public.order_status_events
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can insert order status events" ON public.order_status_events;
CREATE POLICY "Authenticated can insert order status events"
ON public.order_status_events
FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage order status events" ON public.order_status_events;
CREATE POLICY "Service role can manage order status events"
ON public.order_status_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
