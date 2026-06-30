CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'business_admin' CHECK (
    role IN ('business_owner', 'business_admin', 'cashier', 'kitchen', 'delivery', 'viewer')
  ),
  module_permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, email)
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id
  ON public.client_users(client_id);

CREATE INDEX IF NOT EXISTS idx_client_users_user_id
  ON public.client_users(user_id);

CREATE INDEX IF NOT EXISTS idx_client_users_email
  ON public.client_users(LOWER(email));

DROP TRIGGER IF EXISTS update_client_users_updated_at ON public.client_users;
CREATE TRIGGER update_client_users_updated_at
BEFORE UPDATE ON public.client_users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read client users" ON public.client_users;
CREATE POLICY "Authenticated can read client users"
ON public.client_users
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can manage client users" ON public.client_users;
CREATE POLICY "Authenticated can manage client users"
ON public.client_users
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage client users" ON public.client_users;
CREATE POLICY "Service role can manage client users"
ON public.client_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO public.client_users (
  client_id,
  email,
  full_name,
  role,
  module_permissions,
  is_active
)
SELECT
  id,
  LOWER(admin_email),
  'Administrador del negocio',
  'business_owner',
  '{"dashboard": true, "menu": true, "orders": true, "kitchen": true, "settings": true, "users": true}'::jsonb,
  true
FROM public.clients
WHERE admin_email IS NOT NULL AND TRIM(admin_email) <> ''
ON CONFLICT (client_id, email)
DO UPDATE SET
  role = EXCLUDED.role,
  module_permissions = EXCLUDED.module_permissions,
  is_active = true,
  updated_at = NOW();

UPDATE public.client_users cu
SET user_id = au.id
FROM auth.users au
WHERE cu.user_id IS NULL
  AND LOWER(cu.email) = LOWER(au.email);
