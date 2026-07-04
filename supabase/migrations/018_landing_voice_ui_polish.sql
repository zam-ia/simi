UPDATE public.landing_sections
SET
  primary_cta_label = CASE
    WHEN section_key = 'hero' THEN 'Ver mi demo'
    WHEN section_key = 'demo_form' THEN 'Quiero ver mi demo'
    ELSE primary_cta_label
  END,
  title = CASE
    WHEN section_key = 'experience' THEN 'Tu cliente compra mas facil y tu equipo trabaja con mas orden.'
    WHEN section_key = 'how_it_works' THEN 'De tu carta en papel a tu carta digital en 48 horas.'
    WHEN section_key = 'final_cta' THEN 'Tu menu listo para vender todos los dias.'
    ELSE title
  END,
  subtitle = CASE
    WHEN section_key IN ('experience', 'demo_form') THEN ''
    ELSE subtitle
  END,
  description = CASE
    WHEN section_key = 'experience' THEN 'El comensal encuentra la carta desde el celular. Tu negocio recibe pedidos, reservas y cambios desde un panel claro.'
    WHEN section_key = 'how_it_works' THEN 'Nos pasas tu carta, armamos el link y te entregamos el QR para mesas, redes y WhatsApp.'
    WHEN section_key = 'demo_form' THEN 'Escribenos el nombre de tu negocio y tu WhatsApp. Con eso basta para prepararte una primera vista.'
    ELSE description
  END,
  metadata = CASE
    WHEN section_key = 'hero' THEN jsonb_set(COALESCE(metadata, '{}'::jsonb), '{badge}', '"La carta de tu negocio, siempre lista y bajo tu control."')
    ELSE metadata
  END,
  updated_at = NOW()
WHERE section_key IN ('hero', 'experience', 'how_it_works', 'demo_form', 'final_cta')
  AND status IN ('draft', 'published');
