CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  source TEXT NOT NULL CHECK (source IN ('client', 'server', 'api', 'health', 'auth', 'security', 'queue')),
  level TEXT NOT NULL DEFAULT 'error' CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  route TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  breadcrumbs JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_created ON public.monitoring_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_level_created ON public.monitoring_events(level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_source_created ON public.monitoring_events(source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_request_id ON public.monitoring_events(request_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_route_created ON public.monitoring_events(route, created_at DESC);

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage monitoring events" ON public.monitoring_events;
CREATE POLICY "Service role can manage monitoring events" ON public.monitoring_events
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read monitoring events" ON public.monitoring_events;
CREATE POLICY "Authenticated can read monitoring events" ON public.monitoring_events
FOR SELECT TO authenticated USING (true);

COMMENT ON TABLE public.monitoring_events IS 'Eventos tecnicos de SIMI: errores cliente, health checks, API, seguridad y colas. Retencion objetivo: 2 anos; no borrar sin proceso de archivado.';
COMMENT ON COLUMN public.monitoring_events.request_id IS 'Id correlacionable devuelto en x-simi-request-id para rastrear errores entre navegador, API y logs.';
