ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS hero_banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS promo_banner_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_promo_banner_item_id_idx
  ON public.clients (promo_banner_item_id);

NOTIFY pgrst, 'reload schema';
