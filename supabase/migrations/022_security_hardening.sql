-- Removes default API grants and broad policies reported by Supabase security advisors.

BEGIN;

REVOKE ALL ON FUNCTION public.create_public_order_v2(
  UUID, TEXT, JSONB, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_order_v2(
  UUID, TEXT, JSONB, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.claim_notification_outbox(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(TEXT, INTEGER, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_has_client_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_can_manage_client(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_client_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_manage_client(UUID) TO authenticated, service_role;

ALTER FUNCTION public.try_uuid(TEXT) SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.normalize_peru_phone(TEXT) SET search_path = pg_catalog, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

DROP POLICY IF EXISTS "Authenticated can manage demo requests" ON public.demo_requests;
DROP POLICY IF EXISTS "Platform admins manage demo requests" ON public.demo_requests;
CREATE POLICY "Platform admins manage demo requests"
ON public.demo_requests
FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Public can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public can read menu images" ON storage.objects;

COMMIT;
