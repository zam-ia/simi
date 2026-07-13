"use client";

import { useMemo, useState } from "react";
import { BlogPreview } from "@/components/admin/BlogPreview";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { createBlogPostAction, deleteBlogPostAction, updateBlogPostAction } from "@/lib/blog-actions";
import type { BlogPost } from "@/types/blog";

export function BlogPostManager({ posts }: { posts: BlogPost[] }) {
  const [selectedPostId, setSelectedPostId] = useState(posts[0]?.id || "");
  const selectedPost = useMemo(() => posts.find((post) => post.id === selectedPostId) || posts[0] || null, [posts, selectedPostId]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
      <div className="grid min-w-0 gap-5">
        <details open className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
          <summary className="cursor-pointer list-none">
            <p className="text-sm text-[var(--text-muted)]">Nuevo contenido</p>
            <h2 className="mt-1 text-xl font-medium">Crear artículo</h2>
          </summary>
          <form action={createBlogPostAction} className="mt-5 grid gap-4">
            <BlogFields storagePath="blog/new" />
            <div className="flex justify-end"><Button type="submit">Guardar artículo</Button></div>
          </form>
        </details>

        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-medium">Artículos</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Los borradores solo se ven aquí. Publica cuando el contenido esté listo.</p>
            </div>
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] shadow-panel">{posts.length}</span>
          </div>

          {posts.length ? posts.map((post) => {
            const updateAction = updateBlogPostAction.bind(null, post.id);
            const deleteAction = deleteBlogPostAction.bind(null, post.id);
            return (
              <article id={`post-${post.id}`} key={post.id} className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
                <div className="grid gap-4 p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
                  {post.cover_image_url ? <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="h-24 w-full rounded-[16px] object-cover sm:w-28" /> : <div className="grid h-24 w-full place-items-center rounded-[16px] bg-[var(--surface-muted)] text-xs text-[var(--text-muted)] sm:w-28">Sin portada</div>}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${post.status === "published" ? "bg-green-100 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{post.status === "published" ? "Publicado" : "Borrador"}</span>
                      {post.is_featured ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/35 dark:text-amber-200">Destacado</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-medium">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-muted)]">{post.excerpt}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedPostId(post.id)} className="min-h-10 rounded-full bg-[var(--surface-muted)] px-4 text-sm font-medium">Vista previa</button>
                </div>

                <details className="border-t border-[var(--line)] p-4">
                  <summary className="cursor-pointer text-sm font-medium">Editar contenido</summary>
                  <form action={updateAction} className="mt-4 grid gap-4">
                    <BlogFields post={post} storagePath={`blog/${post.id}`} />
                    <div className="flex justify-end"><Button type="submit">Guardar cambios</Button></div>
                  </form>
                  <form action={deleteAction} className="mt-3 flex justify-end border-t border-[var(--line)] pt-3"><DeleteButton message={`¿Eliminar el artículo "${post.title}"?`} /></form>
                </details>
              </article>
            );
          }) : (
            <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">Todavía no hay artículos. Crea el primero arriba.</div>
          )}
        </section>
      </div>

      <BlogPreview post={selectedPost} />
    </div>
  );
}

function BlogFields({ post, storagePath }: { post?: BlogPost; storagePath: string }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Título">
          <input name="title" required minLength={5} defaultValue={post?.title || ""} className="field" placeholder="Cómo ordenar los pedidos de tu negocio" />
        </Field>
        <Field label="Enlace">
          <input name="slug" defaultValue={post?.slug || ""} className="field" placeholder="como-ordenar-pedidos" />
        </Field>
      </div>
      <Field label="Descripción corta">
        <textarea name="excerpt" required minLength={20} defaultValue={post?.excerpt || ""} className="field min-h-24 py-3" placeholder="Resumen que aparecerá en la portada del blog y al compartir el enlace." />
      </Field>
      <Field label="Contenido">
        <textarea name="content" required minLength={80} defaultValue={post?.content || ""} className="field min-h-72 py-3 leading-6" placeholder="Escribe el artículo. Separa los párrafos con una línea en blanco." />
      </Field>
      <ImageUploader name="cover_image_url" label="Imagen de portada" defaultValue={post?.cover_image_url} storagePath={storagePath} preview="wide" hint="Recomendado: WebP horizontal de 1400 x 800 px y máximo 2 MB." />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Texto alternativo de imagen">
          <input name="cover_image_alt" defaultValue={post?.cover_image_alt || ""} className="field" placeholder="Panel de pedidos SIMI" />
        </Field>
        <Field label="Autor">
          <input name="author_name" defaultValue={post?.author_name || "Equipo SIMI"} className="field" />
        </Field>
        <Field label="Etiquetas">
          <input name="tags" defaultValue={post?.tags.join(", ") || ""} className="field" placeholder="pedidos, restaurantes, Huancayo" />
        </Field>
        <Field label="Estado">
          <select name="status" defaultValue={post?.status || "draft"} className="field">
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-3 rounded-[16px] bg-[var(--surface-muted)] p-3 text-sm">
        <input type="checkbox" name="is_featured" defaultChecked={post?.is_featured || false} />
        Mostrar como artículo destacado
      </label>
      <details className="rounded-[16px] border border-[var(--line)] p-4">
        <summary className="cursor-pointer text-sm font-medium">Título y descripción para Google</summary>
        <div className="mt-4 grid gap-4">
          <Field label="Título SEO"><input name="seo_title" defaultValue={post?.seo_title || ""} className="field" /></Field>
          <Field label="Descripción SEO"><textarea name="seo_description" defaultValue={post?.seo_description || ""} className="field min-h-20 py-3" /></Field>
        </div>
      </details>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
