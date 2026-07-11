-- Keeps tenant authorization helpers outside the PostgREST-exposed public schema.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, private, pg_temp
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

CREATE OR REPLACE FUNCTION private.user_has_client_access(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, private, pg_temp
AS $$
  SELECT
    private.is_platform_admin()
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

CREATE OR REPLACE FUNCTION private.user_can_manage_client(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, private, pg_temp
AS $$
  SELECT
    private.is_platform_admin()
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

REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.user_has_client_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.user_can_manage_client(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_has_client_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_can_manage_client(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$ SELECT private.is_platform_admin(); $$;

CREATE OR REPLACE FUNCTION public.user_has_client_access(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$ SELECT private.user_has_client_access(target_client_id); $$;

CREATE OR REPLACE FUNCTION public.user_can_manage_client(target_client_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = private, pg_temp
AS $$ SELECT private.user_can_manage_client(target_client_id); $$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_has_client_access(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_can_manage_client(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_has_client_access(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_manage_client(UUID) TO authenticated, service_role;

COMMIT;
