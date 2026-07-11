import { BlogPostManager } from "@/components/admin/BlogPostManager";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BlogPost } from "@/types/blog";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("blog_posts").select("*").order("updated_at", { ascending: false });
  const missingTable = error && (error.code === "42P01" || error.code === "PGRST205" || error.message.includes("blog_posts"));
  const posts = missingTable ? [] : (data || []) as BlogPost[];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Contenido de simiperu-web</p>
          <h2 className="mt-1 text-3xl font-medium">Blog</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Crea artículos para captar negocios desde Google y redes. Solo los publicados aparecerán en la web comercial.</p>
        </div>
        <a href="https://simiperu-web.vercel.app/blog" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--surface)] px-4 text-sm font-medium shadow-panel">Ver blog público</a>
      </div>

      {resolvedSearchParams.saved ? <p className="rounded-[var(--radius-card)] bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/35 dark:text-green-200">Cambios del blog guardados correctamente.</p> : null}
      {resolvedSearchParams.error ? <p className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{resolvedSearchParams.error}</p> : null}
      {missingTable ? <p className="rounded-[var(--radius-card)] bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/35 dark:text-amber-200">Aplica la migración 021_blog_content.sql en Supabase para activar el editor.</p> : null}

      <BlogPostManager posts={posts} />
    </div>
  );
}
