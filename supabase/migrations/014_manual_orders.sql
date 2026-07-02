ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'public_qr',
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID,
  ADD COLUMN IF NOT EXISTS manual_channel TEXT,
  ADD COLUMN IF NOT EXISTS waiter_name TEXT,
  ADD COLUMN IF NOT EXISTS party_size INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_delivery_time_snapshot TEXT;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_source_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_source_check
  CHECK (source IN ('public_qr', 'manual_admin', 'manual_waiter', 'whatsapp', 'phone', 'internal'));

CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_created_by_user_id ON public.orders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_manual_channel ON public.orders(manual_channel);
