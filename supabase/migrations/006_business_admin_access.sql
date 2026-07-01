ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS admin_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_whatsapp_number TEXT;

CREATE INDEX IF NOT EXISTS clients_admin_email_idx
  ON public.clients (LOWER(admin_email));

UPDATE public.clients
SET
  admin_email = COALESCE(admin_email, 'supervisor@test.com'),
  notification_whatsapp_number = COALESCE(notification_whatsapp_number, whatsapp_number)
WHERE slug IN ('pollo-loco', 'demo-pollo-loco');
