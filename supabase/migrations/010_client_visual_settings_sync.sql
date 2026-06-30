ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS promo_banner_title TEXT,
  ADD COLUMN IF NOT EXISTS promo_banner_description TEXT,
  ADD COLUMN IF NOT EXISTS promo_banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_banner_is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_whatsapp_number TEXT;

CREATE INDEX IF NOT EXISTS clients_admin_email_idx
  ON public.clients (LOWER(admin_email));

UPDATE public.clients
SET
  notification_whatsapp_number = COALESCE(notification_whatsapp_number, whatsapp_number),
  promo_banner_is_active = COALESCE(promo_banner_is_active, false)
WHERE notification_whatsapp_number IS NULL
  OR promo_banner_is_active IS NULL;

NOTIFY pgrst, 'reload schema';
