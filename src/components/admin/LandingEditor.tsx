"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/shared/Button";
import { discardLandingDraftAction, moveLandingSectionAction, publishLandingAction, updateLandingBusinessTypeAction, updateLandingSectionAction, updateLandingSeoAction } from "@/lib/actions";
import type { LandingContent, LandingSection } from "@/lib/landing-content";
import { SimiLanding } from "@/components/public/SimiLanding";

type LandingEditorProps = {
  content: LandingContent;
  hasUnpublishedChanges: boolean;
  missingLandingTables: boolean;
  saved?: string;
  error?: string;
};

type EditorTab = "sections" | "business" | "seo" | "preview";
type PreviewSize = "desktop" | "mobile";
type PreviewTheme = "light" | "dark";

const sectionHelp: Record<string, string> = {
  hero: "Primera pantalla de la landing. Usa una frase corta y directa.",
  qr_link: "Muestra el valor del QR permanente y el link para redes.",
  menu_update: "Seccion clave: muestra que el panel actualiza la carta.",
  orders: "Muestra como entran los pedidos de forma ordenada.",
  agenda: "Explica reservas, agenda o pedidos programados.",
  dashboard: "Debe transmitir control y operacion real.",
  experience: "Compara lo que ve el cliente y lo que ve el negocio.",
  how_it_works: "Resume el proceso en pocas palabras.",
  business_types: "Abre mercado mostrando rubros compatibles.",
  demo_form: "Texto antes del formulario de demo.",
  final_cta: "Ultimo empuje antes de salir de la pagina.",
  footer: "Texto inferior y acceso al panel."
};

export function LandingEditor({ content, hasUnpublishedChanges, missingLandingTables, saved, error }: LandingEditorProps) {
  const [tab, setTab] = useState<EditorTab>("sections");
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");
  const activeSection = useMemo(() => content.sections.find((section) => section.section_key === activeSectionKey) || null, [activeSectionKey, content.sections]);

  return (
    <div className="grid gap-6">
      {missingLandingTables ? (
        <div className="rounded-[var(--radius-panel)] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
          Para activar el editor real aplica la migracion 016_landing_editor.sql en Supabase. Mientras tanto ves el contenido por defecto.
        </div>
      ) : null}
      {hasUnpublishedChanges ? (
        <div className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <p className="font-medium">Tienes cambios en borrador sin publicar.</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">La landing publica solo cambiara cuando presiones Publicar cambios.</p>
          </div>
          <form action={discardLandingDraftAction}>
            <Button type="submit" variant="secondary">Descartar borrador</Button>
          </form>
          <form action={publishLandingAction}>
            <Button type="submit" onClick={(event) => {
              if (!confirm("Seguro que quieres publicar estos cambios? La landing publica se actualizara para todos los visitantes.")) event.preventDefault();
            }}>Publicar cambios</Button>
          </form>
        </div>
      ) : null}

      {saved ? <p className="rounded-[var(--radius-card)] bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/35 dark:text-green-100">Cambios guardados correctamente.</p> : null}
      {error ? <p className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/35 dark:text-red-100">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "sections"} onClick={() => setTab("sections")}>Editor</TabButton>
        <TabButton active={tab === "business"} onClick={() => setTab("business")}>Rubros</TabButton>
        <TabButton active={tab === "seo"} onClick={() => setTab("seo")}>SEO basico</TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>Vista previa</TabButton>
      </div>

      {tab === "sections" ? (
        <section className="grid gap-3">
          {content.sections.map((section, index) => (
            <article key={section.section_key} className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">Orden {section.sort_order}</span>
                  <span className={`rounded-full px-3 py-1 text-xs ${section.is_visible ? "bg-green-50 text-green-700 dark:bg-green-950/35 dark:text-green-200" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{section.is_visible ? "Visible" : "Oculta"}</span>
                </div>
                <h3 className="mt-3 text-lg font-medium">{section.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{sectionHelp[section.section_key] || section.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={moveLandingSectionAction.bind(null, section.section_key, "up")}>
                  <Button type="submit" variant="secondary" disabled={index === 0}>Subir</Button>
                </form>
                <form action={moveLandingSectionAction.bind(null, section.section_key, "down")}>
                  <Button type="submit" variant="secondary" disabled={index === content.sections.length - 1}>Bajar</Button>
                </form>
                <Button type="button" onClick={() => setActiveSectionKey(section.section_key)}>Editar</Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {tab === "business" ? <BusinessTypesEditor content={content} /> : null}
      {tab === "seo" ? <SeoEditor content={content} /> : null}
      {tab === "preview" ? (
        <PreviewPanel
          content={content}
          previewSize={previewSize}
          previewTheme={previewTheme}
          setPreviewSize={setPreviewSize}
          setPreviewTheme={setPreviewTheme}
        />
      ) : null}

      {activeSection ? <SectionDrawer section={activeSection} onClose={() => setActiveSectionKey(null)} /> : null}
    </div>
  );
}

function SectionDrawer({ section, onClose }: { section: LandingSection; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 bg-black/35 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar editor" />
      <aside className="absolute right-0 top-0 grid h-full w-full max-w-xl grid-rows-[auto_1fr] border-l border-[var(--line)] bg-[var(--surface)] shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-5">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Editar seccion</p>
            <h2 className="mt-1 text-2xl font-medium">{section.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{sectionHelp[section.section_key]}</p>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--text)]">x</button>
        </div>
        <form action={updateLandingSectionAction.bind(null, section.section_key)} className="grid gap-5 overflow-y-auto p-5">
          <input type="hidden" name="sort_order" value={section.sort_order} />
          <Field label="Titulo" name="title" defaultValue={section.title} hint="Usa una frase corta. Ideal: menos de 70 caracteres." />
          <Field label="Subtitulo / etiqueta" name="subtitle" defaultValue={section.subtitle || ""} hint="Sirve como etiqueta visual o frase secundaria." />
          <TextArea label="Descripcion" name="description" defaultValue={section.description || ""} />
          {section.section_key === "hero" ? <Field label="Badge superior" name="metadata_badge" defaultValue={String(section.metadata.badge || "")} /> : null}
          {section.section_key === "demo_form" ? (
            <>
              <Field label="Mensaje de exito" name="metadata_success_message" defaultValue={String(section.metadata.successMessage || "")} />
              <Field label="Texto debajo del boton" name="metadata_legal_text" defaultValue={String(section.metadata.legalText || "")} />
            </>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="CTA principal" name="primary_cta_label" defaultValue={section.primary_cta_label || ""} />
            <Field label="URL CTA principal" name="primary_cta_url" defaultValue={section.primary_cta_url || ""} />
            <Field label="CTA secundario" name="secondary_cta_label" defaultValue={section.secondary_cta_label || ""} />
            <Field label="URL CTA secundario" name="secondary_cta_url" defaultValue={section.secondary_cta_url || ""} />
          </div>
          <ImageUploader name="image_light_url" label="Imagen modo claro" defaultValue={section.image_light_url} storagePath={`landing/${section.section_key}/light`} preview="wide" hint="Recomendado: imagen horizontal clara y legible. Maximo 2 MB." />
          <ImageUploader name="image_dark_url" label="Imagen modo oscuro opcional" defaultValue={section.image_dark_url} storagePath={`landing/${section.section_key}/dark`} preview="wide" hint="Opcional. Si queda vacio se usa la imagen principal." />
          <Field label="Texto alternativo de imagen" name="alt_text" defaultValue={section.alt_text || ""} hint="Describe la imagen para accesibilidad y SEO." />
          <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
            <input type="checkbox" name="is_visible" defaultChecked={section.is_visible} />
            <span>Mostrar esta seccion en la landing</span>
          </label>
          <div className="sticky bottom-0 -mx-5 border-t border-[var(--line)] bg-[var(--surface)]/90 p-5 backdrop-blur">
            <Button type="submit" className="w-full">Guardar borrador</Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function BusinessTypesEditor({ content }: { content: LandingContent }) {
  return (
    <section className="grid gap-4">
      {content.businessTypes.map((item) => (
        <form key={item.name} action={updateLandingBusinessTypeAction.bind(null, item.name)} className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel md:grid-cols-2">
          <input type="hidden" name="current_name" value={item.name} />
          <input type="hidden" name="sort_order" value={item.sort_order} />
          <Field label="Nombre del rubro" name="name" defaultValue={item.name} />
          <Field label="Descripcion" name="description" defaultValue={item.description || ""} />
          <ImageUploader name="image_light_url" label="Imagen modo claro" defaultValue={item.image_light_url} storagePath={`landing/rubros/${item.name}/light`} preview="wide" />
          <ImageUploader name="image_dark_url" label="Imagen modo oscuro opcional" defaultValue={item.image_dark_url} storagePath={`landing/rubros/${item.name}/dark`} preview="wide" />
          <Field label="Texto alternativo" name="alt_text" defaultValue={item.alt_text || ""} />
          <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
            <input type="checkbox" name="is_visible" defaultChecked={item.is_visible} />
            <span>Mostrar rubro</span>
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Guardar rubro</Button>
          </div>
        </form>
      ))}
    </section>
  );
}

function SeoEditor({ content }: { content: LandingContent }) {
  const seo = content.seo;
  return (
    <form action={updateLandingSeoAction} className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel md:grid-cols-2">
      <Field label="Titulo para Google" name="meta_title" defaultValue={seo.meta_title || ""} />
      <Field label="Descripcion para Google" name="meta_description" defaultValue={seo.meta_description || ""} />
      <Field label="Titulo cuando compartes el link" name="og_title" defaultValue={seo.og_title || ""} />
      <Field label="Descripcion cuando compartes el link" name="og_description" defaultValue={seo.og_description || ""} />
      <ImageUploader name="og_image_url" label="Imagen cuando compartes el link" defaultValue={seo.og_image_url} storagePath="landing/seo" preview="wide" />
      <Field label="URL canonica" name="canonical_url" defaultValue={seo.canonical_url || ""} />
      <Field label="Palabras clave" name="keywords" defaultValue={seo.keywords || ""} />
      <div className="md:col-span-2">
        <Button type="submit">Guardar SEO</Button>
      </div>
    </form>
  );
}

function PreviewPanel({ content, previewSize, previewTheme, setPreviewSize, setPreviewTheme }: { content: LandingContent; previewSize: PreviewSize; previewTheme: PreviewTheme; setPreviewSize: (value: PreviewSize) => void; setPreviewTheme: (value: PreviewTheme) => void }) {
  const style = previewTheme === "dark" ? darkPreviewVars : lightPreviewVars;
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active={previewSize === "desktop"} onClick={() => setPreviewSize("desktop")}>Desktop</TabButton>
        <TabButton active={previewSize === "mobile"} onClick={() => setPreviewSize("mobile")}>Movil</TabButton>
        <TabButton active={previewTheme === "light"} onClick={() => setPreviewTheme("light")}>Claro</TabButton>
        <TabButton active={previewTheme === "dark"} onClick={() => setPreviewTheme("dark")}>Oscuro</TabButton>
      </div>
      <div className="overflow-auto rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface-muted)] p-4">
        <div className={previewSize === "mobile" ? "mx-auto w-[390px] max-w-full overflow-hidden rounded-[32px] border border-[var(--line)]" : "overflow-hidden rounded-[24px] border border-[var(--line)]"} style={style}>
          <SimiLanding content={content} previewMode forcedTheme={previewTheme} />
        </div>
      </div>
    </section>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`focus-ring min-h-10 rounded-full px-4 text-sm font-medium ${active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface)] text-[var(--text)] shadow-panel"}`}>
      {children}
    </button>
  );
}

function Field({ label, name, defaultValue, hint }: { label: string; name: string; defaultValue?: string; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]" />
      {hint ? <span className="text-xs leading-5 text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={4} className="focus-ring rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" />
    </label>
  );
}

const lightPreviewVars = {
  "--background": "#f8fafc",
  "--surface": "#ffffff",
  "--surface-muted": "#fff4e5",
  "--text": "#0f172a",
  "--text-muted": "rgba(15, 23, 42, 0.62)",
  "--line": "rgba(0, 0, 0, 0.1)",
  "--accent": "#ff6a00",
  "--accent-strong": "#ff3d00",
  "--accent-soft": "#fff4e5",
  "--simi-aji-amarillo": "#ffc107"
} as CSSProperties;

const darkPreviewVars = {
  "--background": "#080d16",
  "--surface": "#101827",
  "--surface-muted": "#172235",
  "--text": "#f5f5f7",
  "--text-muted": "rgba(235, 235, 245, 0.62)",
  "--line": "rgba(255, 255, 255, 0.12)",
  "--accent": "#ff8a1f",
  "--accent-strong": "#ff6a00",
  "--accent-soft": "rgba(255, 106, 0, 0.14)",
  "--simi-aji-amarillo": "#ffd24a"
} as CSSProperties;
