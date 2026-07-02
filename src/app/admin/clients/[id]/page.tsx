import { CategoryManager } from "@/components/admin/CategoryManager";
import { ClientForm } from "@/components/admin/ClientForm";
import { MenuItemManager } from "@/components/admin/MenuItemManager";
import { MenuPreview } from "@/components/admin/MenuPreview";
import { QRModal } from "@/components/admin/QRModal";
import { TableManager } from "@/components/admin/TableManager";
import { LinkButton } from "@/components/shared/Button";
import { updateClientAction } from "@/lib/actions";
import { requireAdmin, requireClientAccess, requireModuleAccess } from "@/lib/auth";
import { getAdminClientMenu, getAdminClientTables } from "@/lib/menu-data";
import { getPublicMenuUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "menu");
  requireClientAccess(context, resolvedParams.id);

  const [{ client, categories, categoriesWithItems }, tables] = await Promise.all([getAdminClientMenu(resolvedParams.id), getAdminClientTables(resolvedParams.id)]);
  const action = updateClientAction.bind(null, client.id);
  const publicUrl = getPublicMenuUrl(client.slug);
  const promoItems = categoriesWithItems.flatMap((category) => category.items).map((item) => ({ id: item.id, name: item.name, price: item.price }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-medium">{client.name}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Edita datos del negocio, categorías, productos y QR.</p>
          {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Cambios guardados correctamente.</p> : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={publicUrl} variant="secondary" target="_blank">
            Ver menú público
          </LinkButton>
          <QRModal url={publicUrl} slug={client.slug} logoUrl={client.logo_url} />
        </div>
      </div>

      <ClientForm client={client} action={action} error={resolvedSearchParams.error} promoItems={promoItems} />
      <MenuPreview url={publicUrl} />
      <CategoryManager clientId={client.id} categories={categories} />
      <TableManager client={client} tables={tables} />
      <MenuItemManager clientId={client.id} categories={categoriesWithItems} />
    </div>
  );
}
