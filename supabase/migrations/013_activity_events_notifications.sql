CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('order', 'payment', 'kitchen', 'delivery', 'reservation', 'table', 'product', 'promotion', 'customer', 'system')),
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  actor_user_id UUID,
  actor_email TEXT,
  actor_role TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID,
  module TEXT NOT NULL CHECK (module IN ('orders', 'payments', 'kitchen', 'delivery', 'reservations', 'menu', 'promotions', 'customers', 'settings', 'system')),
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_client_created ON public.activity_events(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON public.activity_events(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_event_type ON public.activity_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_client_created ON public.notifications(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON public.notifications(module);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(client_id, is_read, created_at DESC);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read activity events" ON public.activity_events;
CREATE POLICY "Authenticated can read activity events" ON public.activity_events
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert activity events" ON public.activity_events;
CREATE POLICY "Authenticated can insert activity events" ON public.activity_events
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage activity events" ON public.activity_events;
CREATE POLICY "Service role can manage activity events" ON public.activity_events
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;
CREATE POLICY "Authenticated can read notifications" ON public.notifications
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can update notifications" ON public.notifications;
CREATE POLICY "Authenticated can update notifications" ON public.notifications
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;
CREATE POLICY "Service role can manage notifications" ON public.notifications
FOR ALL TO service_role USING (true) WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
