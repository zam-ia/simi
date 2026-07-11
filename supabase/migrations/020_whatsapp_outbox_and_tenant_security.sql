-- WhatsApp transactional outbox, idempotent public checkout and tenant isolation.

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  email TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR NULLIF(TRIM(email), '') IS NOT NULL)
);

INSERT INTO public.platform_admins (email)
VALUES ('admin@test.com')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages platform admins" ON public.platform_admins;
CREATE POLICY "Service role manages platform admins"
ON public.platform_admins
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
    OR EXISTS (
      SELECT 1
      FROM public.platform_admins administrator
      WHERE administrator.is_active = true
        AND (
          administrator.user_id = auth.uid()
          OR LOWER(COALESCE(administrator.email, '')) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_client_access(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.client_users membership
      WHERE membership.client_id = target_client_id
        AND membership.is_active = true
        AND (
          membership.user_id = auth.uid()
          OR LOWER(membership.email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.clients client
      WHERE client.id = target_client_id
        AND LOWER(COALESCE(client.admin_email, '')) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_client(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.client_users membership
      WHERE membership.client_id = target_client_id
        AND membership.is_active = true
        AND membership.role IN ('business_owner', 'business_admin')
        AND (
          membership.user_id = auth.uid()
          OR LOWER(membership.email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.clients client
      WHERE client.id = target_client_id
        AND LOWER(COALESCE(client.admin_email, '')) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;

CREATE OR REPLACE FUNCTION public.try_uuid(value TEXT)
RETURNS UUID
LANGUAGE PLPGSQL
IMMUTABLE
STRICT
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  RETURN value::UUID;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_peru_phone(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT CASE
    WHEN REGEXP_REPLACE(COALESCE(value, ''), '[^0-9]', '', 'g') ~ '^9[0-9]{8}$'
      THEN '51' || REGEXP_REPLACE(value, '[^0-9]', '', 'g')
    WHEN REGEXP_REPLACE(COALESCE(value, ''), '[^0-9]', '', 'g') ~ '^519[0-9]{8}$'
      THEN REGEXP_REPLACE(value, '[^0-9]', '', 'g')
    ELSE NULL
  END;
$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_source TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_client_idempotency
ON public.orders(client_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_client_created
ON public.orders(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_client_status_created
ON public.orders(client_id, order_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone
ON public.orders(client_id, customer_phone);

CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp')),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'business', 'courier')),
  recipient_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_language TEXT NOT NULL DEFAULT 'es',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'read', 'retry', 'failed', 'dead')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  provider_message_id TEXT,
  provider_response JSONB,
  last_error TEXT,
  dedupe_key TEXT NOT NULL UNIQUE,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
ON public.notification_outbox(status, available_at, created_at);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_order
ON public.notification_outbox(order_id, recipient_type);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_client_created
ON public.notification_outbox(client_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_outbox_provider_message
ON public.notification_outbox(provider_message_id)
WHERE provider_message_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_notification_outbox_updated_at ON public.notification_outbox;
CREATE TRIGGER update_notification_outbox_updated_at
BEFORE UPDATE ON public.notification_outbox
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business users read own notification outbox" ON public.notification_outbox;
CREATE POLICY "Business users read own notification outbox"
ON public.notification_outbox
FOR SELECT TO authenticated
USING (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Service role manages notification outbox" ON public.notification_outbox;
CREATE POLICY "Service role manages notification outbox"
ON public.notification_outbox
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_public_order_v2(
  p_client_id UUID,
  p_order_type TEXT,
  p_items JSONB,
  p_idempotency_key TEXT,
  p_table_id UUID DEFAULT NULL,
  p_table_label TEXT DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_delivery_address TEXT DEFAULT NULL,
  p_delivery_reference TEXT DEFAULT NULL,
  p_delivery_zone_id UUID DEFAULT NULL,
  p_pickup_time TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_whatsapp_opt_in BOOLEAN DEFAULT false,
  p_whatsapp_opt_in_source TEXT DEFAULT 'public_checkout',
  p_status_base_url TEXT DEFAULT NULL,
  p_trace_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client public.clients%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_existing_order public.orders%ROWTYPE;
  v_delivery_zone public.client_delivery_zones%ROWTYPE;
  v_requested_items INTEGER;
  v_valid_items INTEGER;
  v_subtotal NUMERIC(10, 2) := 0;
  v_delivery_fee NUMERIC(10, 2) := 0;
  v_total NUMERIC(10, 2) := 0;
  v_order_code TEXT;
  v_customer_phone TEXT;
  v_business_phone TEXT;
  v_status_url TEXT;
  v_admin_url TEXT;
  v_items_json JSONB;
  v_attempt INTEGER;
BEGIN
  SELECT * INTO v_client
  FROM public.clients
  WHERE id = p_client_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este menu no esta disponible.' USING ERRCODE = 'P0001';
  END IF;

  IF p_order_type NOT IN ('dine_in', 'pickup', 'delivery') THEN
    RAISE EXCEPTION 'Selecciona una modalidad de pedido valida.' USING ERRCODE = 'P0001';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_idempotency_key, '')), '') IS NULL OR LENGTH(p_idempotency_key) > 100 THEN
    RAISE EXCEPTION 'No se pudo identificar este intento de pedido.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_existing_order
  FROM public.orders
  WHERE client_id = p_client_id
    AND idempotency_key = p_idempotency_key
  LIMIT 1;

  IF FOUND THEN
    SELECT COALESCE(JSONB_AGG(TO_JSONB(item) ORDER BY item.created_at), '[]'::JSONB)
    INTO v_items_json
    FROM public.order_items item
    WHERE item.order_id = v_existing_order.id;

    RETURN JSONB_BUILD_OBJECT(
      'order', TO_JSONB(v_existing_order),
      'items', v_items_json,
      'reused', true
    );
  END IF;

  IF JSONB_TYPEOF(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'El pedido necesita productos.' USING ERRCODE = 'P0001';
  END IF;

  v_requested_items := JSONB_ARRAY_LENGTH(p_items);
  IF v_requested_items < 1 OR v_requested_items > 100 THEN
    RAISE EXCEPTION 'El pedido debe tener entre 1 y 100 productos.' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*), COALESCE(SUM(menu.price * (entry.value ->> 'quantity')::INTEGER), 0)
  INTO v_valid_items, v_subtotal
  FROM JSONB_ARRAY_ELEMENTS(p_items) entry(value)
  JOIN public.menu_items menu
    ON menu.id = public.try_uuid(entry.value ->> 'menuItemId')
   AND menu.client_id = p_client_id
   AND menu.is_available = true
  JOIN public.menu_categories category
    ON category.id = menu.category_id
   AND category.client_id = p_client_id
   AND category.is_active = true
  WHERE COALESCE(entry.value ->> 'quantity', '') ~ '^[0-9]+$'
    AND (entry.value ->> 'quantity')::INTEGER BETWEEN 1 AND 99;

  IF v_valid_items <> v_requested_items THEN
    RAISE EXCEPTION 'Uno de los productos ya no esta disponible o tiene una cantidad invalida.' USING ERRCODE = 'P0001';
  END IF;

  v_customer_phone := public.normalize_peru_phone(p_customer_phone);

  IF p_order_type IN ('pickup', 'delivery') AND NULLIF(TRIM(COALESCE(p_customer_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Ingresa el nombre del cliente.' USING ERRCODE = 'P0001';
  END IF;

  IF p_order_type IN ('pickup', 'delivery') AND v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'Ingresa un WhatsApp valido de Peru.' USING ERRCODE = 'P0001';
  END IF;

  IF p_whatsapp_opt_in AND v_customer_phone IS NULL THEN
    RAISE EXCEPTION 'Necesitamos un WhatsApp valido para enviarte actualizaciones.' USING ERRCODE = 'P0001';
  END IF;

  IF p_order_type = 'dine_in' THEN
    IF p_table_id IS NOT NULL THEN
      SELECT label INTO p_table_label
      FROM public.client_tables
      WHERE id = p_table_id
        AND client_id = p_client_id
        AND is_active = true;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Selecciona una mesa valida.' USING ERRCODE = 'P0001';
      END IF;
    ELSIF NULLIF(TRIM(COALESCE(p_table_label, '')), '') IS NULL THEN
      RAISE EXCEPTION 'El pedido en mesa necesita una mesa.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF p_order_type = 'delivery' THEN
    IF NULLIF(TRIM(COALESCE(p_delivery_address, '')), '') IS NULL THEN
      RAISE EXCEPTION 'Ingresa la direccion de delivery.' USING ERRCODE = 'P0001';
    END IF;

    IF p_delivery_zone_id IS NOT NULL THEN
      SELECT * INTO v_delivery_zone
      FROM public.client_delivery_zones
      WHERE id = p_delivery_zone_id
        AND client_id = p_client_id
        AND is_active = true;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Selecciona una zona de delivery valida.' USING ERRCODE = 'P0001';
      END IF;

      v_delivery_fee := COALESCE(v_delivery_zone.delivery_fee, 0);
      IF COALESCE(v_delivery_zone.minimum_order, 0) > 0 AND v_subtotal < v_delivery_zone.minimum_order THEN
        RAISE EXCEPTION 'El pedido no alcanza el monto minimo de la zona seleccionada.' USING ERRCODE = 'P0001';
      END IF;
    END IF;
  END IF;

  v_total := v_subtotal + v_delivery_fee;

  FOR v_attempt IN 1..20 LOOP
    v_order_code := LPAD((FLOOR(RANDOM() * 900000) + 100000)::INTEGER::TEXT, 6, '0');

    BEGIN
      INSERT INTO public.orders (
        client_id,
        order_code,
        order_type,
        table_id,
        table_label,
        customer_name,
        customer_phone,
        delivery_address,
        delivery_reference,
        delivery_zone_id,
        delivery_zone_name,
        pickup_time,
        notes,
        subtotal,
        delivery_fee,
        total,
        order_status,
        payment_status,
        source,
        idempotency_key,
        whatsapp_opt_in,
        whatsapp_opt_in_at,
        whatsapp_opt_in_source
      ) VALUES (
        p_client_id,
        v_order_code,
        p_order_type,
        CASE WHEN p_order_type = 'dine_in' THEN p_table_id ELSE NULL END,
        CASE WHEN p_order_type = 'dine_in' THEN NULLIF(TRIM(COALESCE(p_table_label, '')), '') ELSE NULL END,
        NULLIF(TRIM(COALESCE(p_customer_name, '')), ''),
        v_customer_phone,
        CASE WHEN p_order_type = 'delivery' THEN NULLIF(TRIM(COALESCE(p_delivery_address, '')), '') ELSE NULL END,
        CASE WHEN p_order_type = 'delivery' THEN NULLIF(TRIM(COALESCE(p_delivery_reference, '')), '') ELSE NULL END,
        CASE WHEN p_order_type = 'delivery' THEN p_delivery_zone_id ELSE NULL END,
        CASE WHEN p_order_type = 'delivery' THEN v_delivery_zone.name ELSE NULL END,
        NULLIF(TRIM(COALESCE(p_pickup_time, '')), ''),
        NULLIF(TRIM(COALESCE(p_notes, '')), ''),
        v_subtotal,
        v_delivery_fee,
        v_total,
        'payment_pending',
        'pending_payment',
        'public_qr',
        p_idempotency_key,
        p_whatsapp_opt_in,
        CASE WHEN p_whatsapp_opt_in THEN NOW() ELSE NULL END,
        CASE WHEN p_whatsapp_opt_in THEN NULLIF(TRIM(COALESCE(p_whatsapp_opt_in_source, '')), '') ELSE NULL END
      )
      RETURNING * INTO v_order;

      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT * INTO v_existing_order
        FROM public.orders
        WHERE client_id = p_client_id
          AND idempotency_key = p_idempotency_key
        LIMIT 1;

        IF FOUND THEN
          SELECT COALESCE(JSONB_AGG(TO_JSONB(item) ORDER BY item.created_at), '[]'::JSONB)
          INTO v_items_json
          FROM public.order_items item
          WHERE item.order_id = v_existing_order.id;

          RETURN JSONB_BUILD_OBJECT(
            'order', TO_JSONB(v_existing_order),
            'items', v_items_json,
            'reused', true
          );
        END IF;
    END;
  END LOOP;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'No se pudo generar un codigo unico para el pedido.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.order_items (
    order_id,
    menu_item_id,
    item_name,
    unit_price,
    quantity,
    item_note,
    subtotal
  )
  SELECT
    v_order.id,
    menu.id,
    menu.name,
    menu.price,
    (entry.value ->> 'quantity')::INTEGER,
    NULLIF(LEFT(TRIM(COALESCE(entry.value ->> 'note', '')), 500), ''),
    menu.price * (entry.value ->> 'quantity')::INTEGER
  FROM JSONB_ARRAY_ELEMENTS(p_items) entry(value)
  JOIN public.menu_items menu
    ON menu.id = public.try_uuid(entry.value ->> 'menuItemId')
   AND menu.client_id = p_client_id;

  INSERT INTO public.order_status_events (order_id, status, payment_status, note, created_by)
  VALUES (v_order.id, v_order.order_status, v_order.payment_status, 'Pedido creado desde la carta publica', 'cliente');

  INSERT INTO public.activity_events (
    client_id,
    entity_type,
    entity_id,
    event_type,
    from_status,
    to_status,
    actor_role,
    metadata,
    note
  ) VALUES (
    p_client_id,
    'order',
    v_order.id,
    'order.created',
    NULL,
    v_order.order_status,
    'customer',
    JSONB_BUILD_OBJECT(
      'order_code', v_order.order_code,
      'customer_name', v_order.customer_name,
      'total', v_total,
      'order_type', v_order.order_type,
      'delivery_zone', v_order.delivery_zone_name,
      'trace_id', p_trace_id
    ),
    'Pedido creado desde la carta publica'
  );

  INSERT INTO public.notifications (
    client_id,
    module,
    title,
    message,
    entity_type,
    entity_id,
    priority
  ) VALUES (
    p_client_id,
    'orders',
    'Nuevo pedido #' || v_order.order_code,
    COALESCE(v_order.customer_name, 'Cliente') || ' realizo un pedido por S/ ' || TO_CHAR(v_total, 'FM999999990.00') || '.',
    'order',
    v_order.id,
    'high'
  );

  v_status_url := CASE
    WHEN NULLIF(TRIM(COALESCE(p_status_base_url, '')), '') IS NULL THEN '/pedido/' || v_order.id::TEXT
    ELSE RTRIM(p_status_base_url, '/') || '/pedido/' || v_order.id::TEXT
  END;
  v_admin_url := CASE
    WHEN NULLIF(TRIM(COALESCE(p_status_base_url, '')), '') IS NULL THEN '/admin/orders?order=' || v_order.id::TEXT
    ELSE RTRIM(p_status_base_url, '/') || '/admin/orders?order=' || v_order.id::TEXT
  END;

  v_business_phone := public.normalize_peru_phone(COALESCE(v_client.notification_whatsapp_number, v_client.whatsapp_number));

  IF p_whatsapp_opt_in AND v_customer_phone IS NOT NULL THEN
    INSERT INTO public.notification_outbox (
      client_id,
      order_id,
      event_type,
      recipient_type,
      recipient_phone,
      template_name,
      payload,
      dedupe_key,
      trace_id
    ) VALUES (
      p_client_id,
      v_order.id,
      'order.created',
      'customer',
      v_customer_phone,
      'simi_order_received_v1',
      JSONB_BUILD_OBJECT(
        'customer_name', COALESCE(v_order.customer_name, 'Cliente'),
        'order_code', v_order.order_code,
        'business_name', v_client.name,
        'total', TO_CHAR(v_total, 'FM999999990.00'),
        'status_url', v_status_url
      ),
      'whatsapp:order-created:' || v_order.id::TEXT || ':customer',
      p_trace_id
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  IF v_business_phone IS NOT NULL THEN
    INSERT INTO public.notification_outbox (
      client_id,
      order_id,
      event_type,
      recipient_type,
      recipient_phone,
      template_name,
      payload,
      dedupe_key,
      trace_id
    ) VALUES (
      p_client_id,
      v_order.id,
      'order.created',
      'business',
      v_business_phone,
      'simi_new_order_business_v1',
      JSONB_BUILD_OBJECT(
        'order_code', v_order.order_code,
        'customer_name', COALESCE(v_order.customer_name, v_order.table_label, 'Cliente'),
        'total', TO_CHAR(v_total, 'FM999999990.00'),
        'order_type', v_order.order_type,
        'admin_url', v_admin_url
      ),
      'whatsapp:order-created:' || v_order.id::TEXT || ':business',
      p_trace_id
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;

  SELECT COALESCE(JSONB_AGG(TO_JSONB(item) ORDER BY item.created_at), '[]'::JSONB)
  INTO v_items_json
  FROM public.order_items item
  WHERE item.order_id = v_order.id;

  RETURN JSONB_BUILD_OBJECT(
    'order', TO_JSONB(v_order),
    'items', v_items_json,
    'reused', false,
    'customer_notification_queued', p_whatsapp_opt_in AND v_customer_phone IS NOT NULL,
    'business_notification_queued', v_business_phone IS NOT NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order_v2(
  UUID, TEXT, JSONB, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order_v2(
  UUID, TEXT, JSONB, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT
) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_notification_outbox(
  p_worker_id TEXT,
  p_limit INTEGER DEFAULT 20,
  p_lock_timeout_seconds INTEGER DEFAULT 300
)
RETURNS SETOF public.notification_outbox
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notification_outbox
  SET
    status = 'retry',
    locked_at = NULL,
    locked_by = NULL,
    available_at = NOW(),
    last_error = COALESCE(last_error, 'Trabajo recuperado despues de un bloqueo vencido.')
  WHERE status = 'processing'
    AND locked_at < NOW() - MAKE_INTERVAL(secs => GREATEST(30, p_lock_timeout_seconds));

  RETURN QUERY
  WITH picked AS (
    SELECT outbox.id
    FROM public.notification_outbox outbox
    WHERE outbox.status IN ('pending', 'retry')
      AND outbox.available_at <= NOW()
    ORDER BY outbox.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
  )
  UPDATE public.notification_outbox outbox
  SET
    status = 'processing',
    attempts = outbox.attempts + 1,
    locked_at = NOW(),
    locked_by = LEFT(p_worker_id, 120)
  FROM picked
  WHERE outbox.id = picked.id
  RETURNING outbox.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_notification_outbox(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(TEXT, INTEGER, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_has_client_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_can_manage_client(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_client_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_manage_client(UUID) TO authenticated, service_role;

-- Replace broad authenticated policies with tenant-aware policies.
DROP POLICY IF EXISTS "Authenticated can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Business users read own clients" ON public.clients;
CREATE POLICY "Business users read own clients" ON public.clients
FOR SELECT TO authenticated USING (public.user_has_client_access(id));
CREATE POLICY "Platform admins insert clients" ON public.clients
FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY "Business managers update own clients" ON public.clients
FOR UPDATE TO authenticated USING (public.user_can_manage_client(id)) WITH CHECK (public.user_can_manage_client(id));
CREATE POLICY "Platform admins delete clients" ON public.clients
FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Authenticated can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated can delete menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Business users manage own menu categories" ON public.menu_categories;
CREATE POLICY "Business users manage own menu categories" ON public.menu_categories
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated can delete menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Business users manage own menu items" ON public.menu_items;
CREATE POLICY "Business users manage own menu items" ON public.menu_items
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage client tables" ON public.client_tables;
DROP POLICY IF EXISTS "Business users manage own client tables" ON public.client_tables;
CREATE POLICY "Business users manage own client tables" ON public.client_tables
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can update orders" ON public.orders;
DROP POLICY IF EXISTS "Business users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Business users update own orders" ON public.orders;
CREATE POLICY "Business users read own orders" ON public.orders
FOR SELECT TO authenticated USING (public.user_has_client_access(client_id));
CREATE POLICY "Business users update own orders" ON public.orders
FOR UPDATE TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Business users read own order items" ON public.order_items;
CREATE POLICY "Business users read own order items" ON public.order_items
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders order_row
    WHERE order_row.id = order_items.order_id
      AND public.user_has_client_access(order_row.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can read payment proofs" ON public.payment_proofs;
DROP POLICY IF EXISTS "Business users read own payment proofs" ON public.payment_proofs;
CREATE POLICY "Business users read own payment proofs" ON public.payment_proofs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders order_row
    WHERE order_row.id = payment_proofs.order_id
      AND public.user_has_client_access(order_row.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can read order status events" ON public.order_status_events;
DROP POLICY IF EXISTS "Authenticated can insert order status events" ON public.order_status_events;
DROP POLICY IF EXISTS "Business users read own order status events" ON public.order_status_events;
DROP POLICY IF EXISTS "Business users insert own order status events" ON public.order_status_events;
CREATE POLICY "Business users read own order status events" ON public.order_status_events
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders order_row
    WHERE order_row.id = order_status_events.order_id
      AND public.user_has_client_access(order_row.client_id)
  )
);
CREATE POLICY "Business users insert own order status events" ON public.order_status_events
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders order_row
    WHERE order_row.id = order_status_events.order_id
      AND public.user_has_client_access(order_row.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can read activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Authenticated can insert activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Business users read own activity events" ON public.activity_events;
DROP POLICY IF EXISTS "Business users insert own activity events" ON public.activity_events;
CREATE POLICY "Business users read own activity events" ON public.activity_events
FOR SELECT TO authenticated USING (public.user_has_client_access(client_id));
CREATE POLICY "Business users insert own activity events" ON public.activity_events
FOR INSERT TO authenticated WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Business users read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Business users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Business users insert own notifications" ON public.notifications;
CREATE POLICY "Business users read own notifications" ON public.notifications
FOR SELECT TO authenticated USING (public.user_has_client_access(client_id));
CREATE POLICY "Business users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));
CREATE POLICY "Business users insert own notifications" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can read client users" ON public.client_users;
DROP POLICY IF EXISTS "Authenticated can manage client users" ON public.client_users;
DROP POLICY IF EXISTS "Business users read own memberships" ON public.client_users;
DROP POLICY IF EXISTS "Business managers manage own memberships" ON public.client_users;
CREATE POLICY "Business users read own memberships" ON public.client_users
FOR SELECT TO authenticated USING (public.user_has_client_access(client_id));
CREATE POLICY "Business managers manage own memberships" ON public.client_users
FOR ALL TO authenticated USING (public.user_can_manage_client(client_id)) WITH CHECK (public.user_can_manage_client(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules business hours" ON public.client_business_hours;
DROP POLICY IF EXISTS "Business users manage own business hours" ON public.client_business_hours;
CREATE POLICY "Business users manage own business hours" ON public.client_business_hours
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules delivery zones" ON public.client_delivery_zones;
DROP POLICY IF EXISTS "Business users manage own delivery zones" ON public.client_delivery_zones;
CREATE POLICY "Business users manage own delivery zones" ON public.client_delivery_zones
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules promotions" ON public.promotions;
DROP POLICY IF EXISTS "Business users manage own promotions" ON public.promotions;
CREATE POLICY "Business users manage own promotions" ON public.promotions
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules reservations" ON public.reservations;
DROP POLICY IF EXISTS "Business users manage own reservations" ON public.reservations;
CREATE POLICY "Business users manage own reservations" ON public.reservations
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules payment methods" ON public.client_payment_methods;
DROP POLICY IF EXISTS "Business users manage own payment methods" ON public.client_payment_methods;
CREATE POLICY "Business users manage own payment methods" ON public.client_payment_methods
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules product option groups" ON public.product_option_groups;
DROP POLICY IF EXISTS "Business users manage own product option groups" ON public.product_option_groups;
CREATE POLICY "Business users manage own product option groups" ON public.product_option_groups
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage growth modules product option values" ON public.product_option_values;
DROP POLICY IF EXISTS "Business users manage own product option values" ON public.product_option_values;
CREATE POLICY "Business users manage own product option values" ON public.product_option_values
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.product_option_groups option_group
    WHERE option_group.id = product_option_values.option_group_id
      AND public.user_has_client_access(option_group.client_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.product_option_groups option_group
    WHERE option_group.id = product_option_values.option_group_id
      AND public.user_has_client_access(option_group.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can manage growth modules product availability" ON public.product_availability;
DROP POLICY IF EXISTS "Business users manage own product availability" ON public.product_availability;
CREATE POLICY "Business users manage own product availability" ON public.product_availability
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.menu_items menu
    WHERE menu.id = product_availability.menu_item_id
      AND public.user_has_client_access(menu.client_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.menu_items menu
    WHERE menu.id = product_availability.menu_item_id
      AND public.user_has_client_access(menu.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can manage couriers" ON public.couriers;
DROP POLICY IF EXISTS "Business users manage own couriers" ON public.couriers;
CREATE POLICY "Business users manage own couriers" ON public.couriers
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage delivery assignments" ON public.delivery_assignments;
DROP POLICY IF EXISTS "Business users manage own delivery assignments" ON public.delivery_assignments;
CREATE POLICY "Business users manage own delivery assignments" ON public.delivery_assignments
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage delivery status events" ON public.delivery_status_events;
DROP POLICY IF EXISTS "Business users manage own delivery status events" ON public.delivery_status_events;
CREATE POLICY "Business users manage own delivery status events" ON public.delivery_status_events
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments assignment
    WHERE assignment.id = delivery_status_events.delivery_assignment_id
      AND public.user_has_client_access(assignment.client_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delivery_assignments assignment
    WHERE assignment.id = delivery_status_events.delivery_assignment_id
      AND public.user_has_client_access(assignment.client_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can manage delivery settings" ON public.delivery_settings;
DROP POLICY IF EXISTS "Business users manage own delivery settings" ON public.delivery_settings;
CREATE POLICY "Business users manage own delivery settings" ON public.delivery_settings
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage reservation events" ON public.reservation_events;
DROP POLICY IF EXISTS "Business users manage own reservation events" ON public.reservation_events;
CREATE POLICY "Business users manage own reservation events" ON public.reservation_events
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can manage reservation settings" ON public.reservation_settings;
DROP POLICY IF EXISTS "Business users manage own reservation settings" ON public.reservation_settings;
CREATE POLICY "Business users manage own reservation settings" ON public.reservation_settings
FOR ALL TO authenticated USING (public.user_has_client_access(client_id)) WITH CHECK (public.user_has_client_access(client_id));

DROP POLICY IF EXISTS "Authenticated can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete menu images" ON storage.objects;
DROP POLICY IF EXISTS "Business users upload own menu images" ON storage.objects;
DROP POLICY IF EXISTS "Business users update own menu images" ON storage.objects;
DROP POLICY IF EXISTS "Business users delete own menu images" ON storage.objects;

CREATE POLICY "Business users upload own menu images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'menu-images'
  AND (
    public.is_platform_admin()
    OR (
      (storage.foldername(name))[1] = 'clients'
      AND public.user_has_client_access(public.try_uuid((storage.foldername(name))[2]))
    )
  )
);

CREATE POLICY "Business users update own menu images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (
    public.is_platform_admin()
    OR (
      (storage.foldername(name))[1] = 'clients'
      AND public.user_has_client_access(public.try_uuid((storage.foldername(name))[2]))
    )
  )
)
WITH CHECK (
  bucket_id = 'menu-images'
  AND (
    public.is_platform_admin()
    OR (
      (storage.foldername(name))[1] = 'clients'
      AND public.user_has_client_access(public.try_uuid((storage.foldername(name))[2]))
    )
  )
);

CREATE POLICY "Business users delete own menu images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'menu-images'
  AND (
    public.is_platform_admin()
    OR (
      (storage.foldername(name))[1] = 'clients'
      AND public.user_has_client_access(public.try_uuid((storage.foldername(name))[2]))
    )
  )
);

DROP POLICY IF EXISTS "Authenticated can manage demo requests" ON public.demo_requests;
DROP POLICY IF EXISTS "Platform admins manage demo requests" ON public.demo_requests;
CREATE POLICY "Platform admins manage demo requests"
ON public.demo_requests
FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public can read menu images" ON storage.objects;

ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

COMMENT ON TABLE public.notification_outbox IS
'Durable queue for external notifications. Orders never depend on provider availability.';

COMMENT ON FUNCTION public.create_public_order_v2 IS
'Creates the order, items, internal activity and WhatsApp outbox records in one transaction.';

COMMIT;
