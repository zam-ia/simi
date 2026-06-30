ALTER TABLE clients
ADD COLUMN IF NOT EXISTS secondary_color TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_title TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_description TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS promo_banner_is_active BOOLEAN DEFAULT false;
