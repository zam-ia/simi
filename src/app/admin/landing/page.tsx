import Link from "next/link";
import { LandingEditor } from "@/components/admin/LandingEditor";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { getAdminLandingContent } from "@/lib/landing-content";

export const dynamic = "force-dynamic";

export default async function AdminLandingPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const { content, hasUnpublishedChanges, missingLandingTables } = await getAdminLandingContent();

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Superadmin</p>
          <h2 className="mt-2 text-3xl font-medium">Landing SIMI</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Edita textos, imagenes, rubros, SEO y vista previa de la landing publica sin tocar codigo.
          </p>
        </div>
        <Link href="/" target="_blank" className="focus-ring rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel">
          Ver landing publica
        </Link>
      </header>

      <LandingEditor
        content={content}
        hasUnpublishedChanges={hasUnpublishedChanges}
        missingLandingTables={missingLandingTables}
        saved={resolvedSearchParams.saved}
        error={resolvedSearchParams.error}
      />
    </div>
  );
}
