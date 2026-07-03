CREATE TABLE IF NOT EXISTS public.landing_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  primary_cta_label TEXT,
  primary_cta_url TEXT,
  secondary_cta_label TEXT,
  secondary_cta_url TEXT,
  image_light_url TEXT,
  image_dark_url TEXT,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.landing_sections
  DROP CONSTRAINT IF EXISTS landing_sections_status_check;

ALTER TABLE public.landing_sections
  ADD CONSTRAINT landing_sections_status_check CHECK (status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_sections_key_status ON public.landing_sections(section_key, status);
CREATE INDEX IF NOT EXISTS idx_landing_sections_status_order ON public.landing_sections(status, sort_order);

CREATE TABLE IF NOT EXISTS public.landing_business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_light_url TEXT,
  image_dark_url TEXT,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.landing_business_types
  DROP CONSTRAINT IF EXISTS landing_business_types_status_check;

ALTER TABLE public.landing_business_types
  ADD CONSTRAINT landing_business_types_status_check CHECK (status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_business_types_name_status ON public.landing_business_types(name, status);
CREATE INDEX IF NOT EXISTS idx_landing_business_types_status_order ON public.landing_business_types(status, sort_order);

CREATE TABLE IF NOT EXISTS public.landing_seo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  keywords TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.landing_seo_settings
  DROP CONSTRAINT IF EXISTS landing_seo_settings_status_check;

ALTER TABLE public.landing_seo_settings
  ADD CONSTRAINT landing_seo_settings_status_check CHECK (status IN ('draft', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_seo_settings_status ON public.landing_seo_settings(status);

CREATE TABLE IF NOT EXISTS public.landing_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  section_key TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_landing_sections_updated_at ON public.landing_sections;
CREATE TRIGGER update_landing_sections_updated_at
BEFORE UPDATE ON public.landing_sections
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_business_types_updated_at ON public.landing_business_types;
CREATE TRIGGER update_landing_business_types_updated_at
BEFORE UPDATE ON public.landing_business_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_landing_seo_settings_updated_at ON public.landing_seo_settings;
CREATE TRIGGER update_landing_seo_settings_updated_at
BEFORE UPDATE ON public.landing_seo_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.landing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published landing sections" ON public.landing_sections;
CREATE POLICY "Public can read published landing sections"
ON public.landing_sections
FOR SELECT
USING (status = 'published' AND is_visible = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage landing sections" ON public.landing_sections;

DROP POLICY IF EXISTS "Public can read published landing business types" ON public.landing_business_types;
CREATE POLICY "Public can read published landing business types"
ON public.landing_business_types
FOR SELECT
USING (status = 'published' AND is_visible = TRUE);

DROP POLICY IF EXISTS "Authenticated can manage landing business types" ON public.landing_business_types;

DROP POLICY IF EXISTS "Public can read published landing seo" ON public.landing_seo_settings;
CREATE POLICY "Public can read published landing seo"
ON public.landing_seo_settings
FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated can manage landing seo" ON public.landing_seo_settings;

DROP POLICY IF EXISTS "Authenticated can read landing logs" ON public.landing_change_logs;
DROP POLICY IF EXISTS "Authenticated can insert landing logs" ON public.landing_change_logs;

INSERT INTO public.landing_sections (
  section_key, title, subtitle, description, primary_cta_label, primary_cta_url,
  secondary_cta_label, secondary_cta_url, image_light_url, image_dark_url,
  alt_text, sort_order, is_visible, status, metadata
)
SELECT seed.section_key, seed.title, seed.subtitle, seed.description, seed.primary_cta_label, seed.primary_cta_url,
  seed.secondary_cta_label, seed.secondary_cta_url, NULL, NULL, seed.alt_text, seed.sort_order, TRUE, status_value.status, seed.metadata::jsonb
FROM (
  VALUES
    ('hero', 'Tu carta cambia. Tu QR no.', 'Deja de reenviar tu carta cada vez que cambias precios, platos o promociones.', 'Con SIMI tienes una carta digital con QR permanente y un link para redes donde tus clientes ven el menu actualizado y hacen pedidos.', 'Solicitar demo', '#demo', 'Ver ejemplo', '/menu/pollo-loco', 'Vista de carta digital SIMI en celular y panel administrativo', 10, '{"badge":"QR permanente + carta viva + pedidos ordenados"}'),
    ('qr_link', 'QR permanente + link para redes', 'QR + link', 'Pon tu carta en mesas, Instagram, WhatsApp o Google Maps sin volver a cambiar el QR.', NULL, NULL, NULL, NULL, 'QR permanente junto a carta digital en celular', 20, '{}'),
    ('menu_update', 'Actualiza tu menu en segundos', 'Carta actualizable', 'Edita precios, productos, fotos o promociones desde tu panel y el cambio se refleja en tu carta digital.', NULL, NULL, NULL, NULL, 'Panel editando producto y menu actualizado en celular', 30, '{}'),
    ('orders', 'Pedidos mas ordenados', 'Pedidos', 'Recibe pedidos para mesa, recojo o delivery desde el mismo menu, sin depender de chats desordenados.', NULL, NULL, NULL, NULL, 'Pedido del cliente y centro de pedidos del negocio', 40, '{}'),
    ('agenda', 'Agenda y reservas segun tu negocio', 'Agenda', 'Organiza reservas, pedidos programados o entregas desde una vista mas clara.', NULL, NULL, NULL, NULL, 'Calendario de agenda y reservas', 50, '{}'),
    ('dashboard', 'Controla tu negocio desde un solo panel', 'Panel', 'Gestiona carta, pedidos, pagos, agenda y operacion desde una interfaz clara.', NULL, NULL, NULL, NULL, 'Panel administrativo SIMI', 60, '{}'),
    ('experience', 'Asi lo ve tu cliente. Asi lo ves tu.', 'Experiencia real', 'Explora como se veria una carta digital moderna y como se gestiona desde el panel del negocio.', 'Ver ejemplo', '/menu/pollo-loco', NULL, NULL, 'Vista cliente y vista negocio de SIMI', 70, '{}'),
    ('how_it_works', 'Cuatro pasos. Sin complicar al cliente.', 'Como funciona', 'Cada paso tiene una accion clara y una vista simple para el negocio.', NULL, NULL, NULL, NULL, NULL, 80, '{}'),
    ('business_types', 'SIMI se adapta al tipo de negocio.', 'Rubros compatibles', 'La misma base se adapta a carta, catalogo, agenda, pedidos o delivery segun el rubro.', NULL, NULL, NULL, NULL, NULL, 90, '{}'),
    ('demo_form', 'Quieres ver como quedaria en tu negocio?', 'Demo personalizada', 'Dejanos tus datos y te mostraremos una demo personalizada por WhatsApp, Zoom, Meet o presencial.', 'Solicitar demo personalizada', '#demo', NULL, NULL, NULL, 100, '{"successMessage":"Gracias. Revisaremos tu negocio y te contactaremos por WhatsApp para agendar una demo.","legalText":"Te contactaremos por WhatsApp para agendar una demo personalizada."}'),
    ('final_cta', 'Que el cliente vea el menu. Que tu equipo vea el control.', '', 'Empieza con una demo corta y revisa como se veria SIMI aplicado a tu negocio.', 'Quiero ver como se veria en mi negocio', '#demo', NULL, NULL, NULL, 110, '{}'),
    ('footer', 'SIMI - Carta digital, pedidos y operacion para negocios gastronomicos.', '', '', 'Ingresar al panel', '/login', NULL, NULL, NULL, 120, '{}')
) AS seed(section_key, title, subtitle, description, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, alt_text, sort_order, metadata)
CROSS JOIN (VALUES ('draft'), ('published')) AS status_value(status)
ON CONFLICT (section_key, status) DO NOTHING;

INSERT INTO public.landing_business_types (
  name, description, image_light_url, image_dark_url, alt_text, sort_order, is_visible, status
)
SELECT seed.name, seed.description, NULL, NULL, seed.alt_text, seed.sort_order, TRUE, status_value.status
FROM (
  VALUES
    ('Restaurantes', 'Menu + pedido en mesa + reservas', 'Restaurante usando SIMI', 10),
    ('Pastelerias', 'Catalogo + agenda de entregas', 'Pasteleria usando SIMI', 20),
    ('Cafeterias', 'Recojo + delivery + venta rapida', 'Cafeteria usando SIMI', 30),
    ('Pollerias', 'Combos + cocina + delivery', 'Polleria usando SIMI', 40)
) AS seed(name, description, alt_text, sort_order)
CROSS JOIN (VALUES ('draft'), ('published')) AS status_value(status)
ON CONFLICT (name, status) DO NOTHING;

INSERT INTO public.landing_seo_settings (
  meta_title, meta_description, og_title, og_description, og_image_url, canonical_url, keywords, status
)
SELECT
  'SIMI | Carta digital con QR permanente y pedidos online',
  'SIMI ayuda a negocios gastronomicos a tener carta digital, QR permanente, link para redes, pedidos, agenda y panel administrativo.',
  'SIMI',
  'Tu carta cambia. Tu QR no.',
  '/simi/brand_app_icons/SIMI_icono.svg',
  'https://simi-peru.vercel.app',
  'carta digital, QR restaurante, pedidos online, SIMI',
  status_value.status
FROM (VALUES ('draft'), ('published')) AS status_value(status)
ON CONFLICT (status) DO NOTHING;
