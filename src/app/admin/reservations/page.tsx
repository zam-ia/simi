import { Button } from "@/components/shared/Button";
import { updateReservationStatusAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminGrowthModules } from "@/lib/menu-data";
import type { Client, ReservationStatus } from "@/types/menu";

export const dynamic = "force-dynamic";

const reservationStatusLabels: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  seated: "Sentado",
  completed: "Completada"
};

const statuses = Object.entries(reservationStatusLabels);

export default async function AdminReservationsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, growth] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("id,name").eq("id", client!.id) : supabase.from("clients").select("id,name").order("name", { ascending: true }),
    getAdminGrowthModules(clientId)
  ]);
  const clientNames = new Map(((clients || []) as Pick<Client, "id" | "name">[]).map((row) => [row.id, row.name]));

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-medium">Reservas</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Solicitudes recibidas desde la pagina publica del negocio.</p>
        {searchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Reserva actualizada correctamente.</p> : null}
        {searchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{searchParams.error}</p> : null}
        {growth.missingGrowthTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 009 en Supabase para habilitar este modulo.</p> : null}
      </div>

      <section className="grid gap-4">
        {growth.reservations.length ? (
          growth.reservations.map((reservation) => (
            <div key={reservation.id} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{reservation.reservation_code} · {clientNames.get(reservation.client_id) || "Negocio"}</p>
                  <h3 className="mt-1 text-lg font-medium">{reservation.customer_name}</h3>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{reservation.customer_phone} · {reservation.party_size} personas</p>
                  <p className="mt-2 text-sm">{reservation.reservation_date} · {reservation.reservation_time}</p>
                  {reservation.notes ? <p className="mt-2 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm">{reservation.notes}</p> : null}
                </div>
                <form action={updateReservationStatusAction.bind(null, reservation.id)} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="client_id" value={reservation.client_id} />
                  <select name="status" defaultValue={reservation.status} className="focus-ring min-h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]">
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <Button type="submit" variant="secondary">Actualizar</Button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay reservas registradas.</p>
        )}
      </section>
    </div>
  );
}
