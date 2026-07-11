-- Editable public blog managed from the SIMI super administrator.

BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  author_name TEXT NOT NULL DEFAULT 'Equipo SIMI',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published
ON public.blog_posts(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
ON public.blog_posts(is_featured, published_at DESC)
WHERE status = 'published';

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads published blog posts" ON public.blog_posts;
CREATE POLICY "Public reads published blog posts"
ON public.blog_posts
FOR SELECT
USING (
  status = 'published'
  AND published_at IS NOT NULL
  AND published_at <= NOW()
);

DROP POLICY IF EXISTS "Platform admins read all blog posts" ON public.blog_posts;
CREATE POLICY "Platform admins read all blog posts"
ON public.blog_posts
FOR SELECT TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins create blog posts" ON public.blog_posts;
CREATE POLICY "Platform admins create blog posts"
ON public.blog_posts
FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins update blog posts" ON public.blog_posts;
CREATE POLICY "Platform admins update blog posts"
ON public.blog_posts
FOR UPDATE TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins delete blog posts" ON public.blog_posts;
CREATE POLICY "Platform admins delete blog posts"
ON public.blog_posts
FOR DELETE TO authenticated
USING (public.is_platform_admin());

COMMENT ON TABLE public.blog_posts IS
'Commercial and educational articles published on simi-web and managed by SIMI super administrators.';

COMMIT;
