"use client";

import { useState } from "react";
import type { BlogPost } from "@/types/blog";

export function BlogPreview({ post }: { post: BlogPost | null }) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  return (
    <aside className="sticky top-24 grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Vista previa</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Así se verá en la web después de publicar.</p>
        </div>
        <div className="grid grid-cols-2 rounded-full bg-[var(--surface-muted)] p-1 text-xs">
          <button type="button" onClick={() => setDevice("mobile")} className={`rounded-full px-3 py-2 ${device === "mobile" ? "bg-[var(--surface)] shadow-panel" : "text-[var(--text-muted)]"}`}>Móvil</button>
          <button type="button" onClick={() => setDevice("desktop")} className={`rounded-full px-3 py-2 ${device === "desktop" ? "bg-[var(--surface)] shadow-panel" : "text-[var(--text-muted)]"}`}>Web</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[20px] bg-[var(--surface-muted)] p-4">
        <div className={`mx-auto overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface)] shadow-panel transition-all ${device === "mobile" ? "max-w-[320px]" : "min-w-[680px]"}`}>
          {post?.cover_image_url ? <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="aspect-[16/9] w-full object-cover" /> : <div className="grid aspect-[16/9] place-items-center bg-[var(--surface-muted)] text-xs text-[var(--text-muted)]">Portada del artículo</div>}
          <div className="p-5">
            <p className="text-xs font-medium text-[var(--accent)]">BLOG SIMI</p>
            <h3 className={`${device === "mobile" ? "text-2xl" : "text-3xl"} mt-2 font-medium leading-tight`}>{post?.title || "Selecciona un artículo"}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{post?.excerpt || "Aquí verás la portada, el título y la descripción del contenido."}</p>
            {post ? <p className="mt-4 text-xs text-[var(--text-muted)]">{post.author_name} · {post.status === "published" ? "Publicado" : "Borrador"}</p> : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
