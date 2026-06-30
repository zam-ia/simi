import { Badge } from "@/components/shared/Badge";
import { LinkButton } from "@/components/shared/Button";
import { EmptyState } from "@/components/shared/EmptyState";
import { QRModal } from "@/components/admin/QRModal";
import { getPublicMenuUrl } from "@/lib/utils";
import type { Client } from "@/types/menu";

type ClientTableProps = {
  clients: Client[];
};

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes clientes registrados."
        description="Crea tu primer menú digital para generar su enlace público y QR permanente."
        actionLabel="Nuevo cliente"
        actionHref="/admin/clients/new"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--line)] text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-xs font-medium uppercase tracking-normal text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">URL pública</th>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {clients.map((client) => {
              const url = getPublicMenuUrl(client.slug);
              return (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{client.slug}</td>
                  <td className="px-4 py-3">
                    <Badge tone={client.is_active ? "green" : "gray"}>{client.is_active ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <a className="text-[var(--accent)] hover:underline" href={url} target="_blank" rel="noreferrer">
                      Ver menú
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <QRModal url={url} slug={client.slug} logoUrl={client.logo_url} />
                  </td>
                  <td className="px-4 py-3">
                    <LinkButton href={`/admin/clients/${client.id}`} variant="secondary">
                      Editar
                    </LinkButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
