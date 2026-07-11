"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";

type BlogPostValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  author_name: string;
  tags: string[];
  status: "draft" | "published";
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
};

type BlogPostParseResult = { data?: BlogPostValues; error?: string };

export async function createBlogPostAction(formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const supabase = createSupabaseAdminClient();
  const values = parseBlogPost(formData);
  if (values.error) redirect(`/admin/blog?error=${encodeURIComponent(values.error)}`);

  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", values.data!.slug).maybeSingle();
  if (existing) redirect(`/admin/blog?error=${encodeURIComponent("Ya existe un artículo con ese enlace.")}`);

  const { error } = await supabase.from("blog_posts").insert({
    ...values.data,
    created_by: context.user.id,
    updated_by: context.user.id
  });

  if (error) redirect(`/admin/blog?error=${encodeURIComponent(getBlogError(error))}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=created");
}

export async function updateBlogPostAction(postId: string, formData: FormData) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const supabase = createSupabaseAdminClient();
  const values = parseBlogPost(formData);
  if (values.error) redirect(`/admin/blog?error=${encodeURIComponent(values.error)}`);

  const { data: existingSlug } = await supabase.from("blog_posts").select("id").eq("slug", values.data!.slug).neq("id", postId).maybeSingle();
  if (existingSlug) redirect(`/admin/blog?error=${encodeURIComponent("Ya existe otro artículo con ese enlace.")}`);

  const { data: current } = await supabase.from("blog_posts").select("published_at").eq("id", postId).maybeSingle();
  const publishedAt = values.data!.status === "published" ? current?.published_at || new Date().toISOString() : null;
  const { error } = await supabase.from("blog_posts").update({ ...values.data, published_at: publishedAt, updated_by: context.user.id }).eq("id", postId);

  if (error) redirect(`/admin/blog?error=${encodeURIComponent(getBlogError(error))}`);
  revalidatePath("/admin/blog");
  redirect(`/admin/blog?saved=updated#post-${postId}`);
}

export async function deleteBlogPostAction(postId: string) {
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", postId);
  if (error) redirect(`/admin/blog?error=${encodeURIComponent("No se pudo eliminar el artículo.")}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=deleted");
}

function parseBlogPost(formData: FormData): BlogPostParseResult {
  const title = String(formData.get("title") || "").trim();
  const slug = generateSlug(String(formData.get("slug") || title));
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const status = String(formData.get("status") || "draft") === "published" ? "published" : "draft";

  if (title.length < 5) return { error: "El título debe tener al menos 5 caracteres." };
  if (!slug) return { error: "El enlace del artículo no es válido." };
  if (excerpt.length < 20) return { error: "La descripción debe tener al menos 20 caracteres." };
  if (content.length < 80) return { error: "El contenido debe tener al menos 80 caracteres." };

  return {
    data: {
      title,
      slug,
      excerpt,
      content,
      cover_image_url: String(formData.get("cover_image_url") || "").trim() || null,
      cover_image_alt: String(formData.get("cover_image_alt") || "").trim() || title,
      author_name: String(formData.get("author_name") || "Equipo SIMI").trim() || "Equipo SIMI",
      tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8),
      status,
      is_featured: formData.get("is_featured") === "on",
      seo_title: String(formData.get("seo_title") || "").trim() || null,
      seo_description: String(formData.get("seo_description") || "").trim() || null,
      published_at: status === "published" ? new Date().toISOString() : null
    }
  };
}

function getBlogError(error: unknown) {
  if (error && typeof error === "object" && "message" in error && String(error.message).includes("blog_posts")) {
    return "Aplica la migración 021_blog_content.sql en Supabase y vuelve a intentarlo.";
  }
  return "No se pudo guardar el artículo.";
}
