UPDATE public.landing_sections
SET
  image_light_url = CASE section_key
    WHEN 'hero' THEN '/simi/mockups/simi_mockup_01_carta_digital_movil.png'
    WHEN 'qr_link' THEN '/simi/mockups/simi_mockup_02_sticker_qr_mesa.png'
    WHEN 'menu_update' THEN '/simi/mockups/simi_mockup_05_link_redes.png'
    WHEN 'orders' THEN '/simi/mockups/simi_mockup_04_pedido_guiado.png'
    WHEN 'agenda' THEN '/simi/mockups/simi_mockup_08_reserva_mesa.jpg'
    WHEN 'dashboard' THEN '/simi/mockups/simi_mockup_03_panel_administrativo.png'
    ELSE image_light_url
  END,
  alt_text = CASE section_key
    WHEN 'hero' THEN COALESCE(NULLIF(alt_text, ''), 'Mockup de carta digital SIMI en celular')
    WHEN 'qr_link' THEN COALESCE(NULLIF(alt_text, ''), 'Sticker QR de mesa para carta digital SIMI')
    WHEN 'menu_update' THEN COALESCE(NULLIF(alt_text, ''), 'Link para redes sociales conectado a SIMI')
    WHEN 'orders' THEN COALESCE(NULLIF(alt_text, ''), 'Flujo de pedido guiado en SIMI')
    WHEN 'agenda' THEN COALESCE(NULLIF(alt_text, ''), 'Pantalla movil para reservar mesa con SIMI')
    WHEN 'dashboard' THEN COALESCE(NULLIF(alt_text, ''), 'Panel administrativo SIMI para negocios gastronomicos')
    ELSE alt_text
  END
WHERE section_key IN ('hero', 'qr_link', 'menu_update', 'orders', 'agenda', 'dashboard')
  AND (image_light_url IS NULL OR image_light_url = '');
