import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { assignReservationTableAction, updateReservationSettingsAction, updateReservationStatusAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminReservationsCenter } from "@/lib/menu-data";
import { buildWhatsappUrl } from "@/lib/utils";
import type { Client, ClientTable, Reservation, ReservationEvent, ReservationSettings, ReservationStatus } from "@/types/menu";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const reservationStatusLabels: Record<ReservationStatus, string> = {
  pending: "Solicitada",
  confirmed: "Confirmada",
  waiting: "En espera",
  rescheduled: "Reprogramada",
  arrived: "Cliente llego",
  seated: "En mesa",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistio",
  rejected: "Rechazada"
};

const kanbanColumns: Array<{ id: ReservationStatus; title: string }> = [
  { id: "pending", title: "Solicitadas" },
  { id: "confirmed", title: "Confirmadas" },
  { id: "arrived", title: "Cliente llego" },
  { id: "seated", title: "En mesa" },
  { id: "completed", title: "Completadas" },
  { id: "cancelled", title: "Canceladas" }
];

export default async function AdminReservationsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; tab?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "reservations");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, center] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("id,name").eq("id", client!.id) : supabase.from("clients").select("id,name").order("name", { ascending: true }),
    getAdminReservationsCenter(clientId)
  ]);

  const clientRows = (clients || []) as Pick<Client, "id" | "name">[];
  const clientNames = new Map(clientRows.map((row) => [row.id, row.name]));
  const tableById = new Map(center.tables.map((table) => [table.id, table]));
  const tab = resolvedSearchParams.tab || "agenda";
  const today = new Date().toISOString().slice(0, 10);
  const todayReservations = center.reservations.filter((reservation) => reservation.reservation_date === today);
  const pendingReservations = center.reservations.filter((reservation) => reservation.status === "pending" || reservation.status === "waiting" || reservation.status === "rescheduled");
  const metrics = {
    today: todayReservations.length,
    pending: pendingReservations.length,
    confirmed: center.reservations.filter((reservation) => reservation.status === "confirmed").length,
    seated: center.reservations.filter((reservation) => reservation.status === "seated").length,
    alerts: center.reservations.filter((reservation) => getReservationAlert(reservation).level !== "normal").length
  };

  return (
    <div className="grid gap-4 lg:gap-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-medium">Reservas</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Gestiona solicitudes, mesas y confirmaciones del local.</p>
          {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Reserva actualizada correctamente.</p> : null}
          {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
          {center.missingReservationTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 010 en Supabase para activar historial avanzado de reservas.</p> : null}
        </div>
        <p className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">Modo manual por defecto.</p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Hoy" value={metrics.today} tone="blue" />
        <Metric label="Pendientes" value={metrics.pending} tone="amber" />
        <Metric label="Confirmadas" value={metrics.confirmed} tone="green" />
        <Metric label="En mesa" value={metrics.seated} tone="purple" />
        <Metric label="Alertas" value={metrics.alerts} tone="red" />
      </section>

      <nav className="flex flex-wrap gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--surface)]/92 p-3 shadow-panel">
        <Tab href="/admin/reservations?tab=agenda" active={tab === "agenda"}>Agenda</Tab>
        <Tab href="/admin/reservations?tab=requests" active={tab === "requests"}>Solicitudes</Tab>
        <Tab href="/admin/reservations?tab=kanban" active={tab === "kanban"}>Kanban</Tab>
        <Tab href="/admin/reservations?tab=tables" active={tab === "tables"}>Mesas</Tab>
        <Tab href="/admin/reservations?tab=history" active={tab === "history"}>Historial</Tab>
        <Tab href="/admin/reservations?tab=config" active={tab === "config"}>Configuracion</Tab>
      </nav>

      {tab === "requests" ? (
        <ReservationList reservations={pendingReservations} tables={center.tables} tableById={tableById} events={center.events} clientNames={clientNames} clients={clientRows} role={role} clientId={client?.id} />
      ) : tab === "kanban" ? (
        <ReservationKanban reservations={center.reservations} tables={center.tables} tableById={tableById} events={center.events} clientNames={clientNames} clients={clientRows} role={role} clientId={client?.id} />
      ) : tab === "tables" ? (
        <TablesView tables={center.tables} reservations={center.reservations} />
      ) : tab === "history" ? (
        <ReservationHistory events={center.events} reservations={center.reservations} />
      ) : tab === "config" ? (
        <ReservationConfigView role={role} clientId={client?.id} clients={clientRows} settings={center.settings} />
      ) : (
        <AgendaView reservations={todayReservations.length ? todayReservations : center.reservations} tables={center.tables} tableById={tableById} events={center.events} clientNames={clientNames} clients={clientRows} role={role} clientId={client?.id} />
      )}
    </div>
  );
}

function AgendaView(props: ReservationListProps) {
  const grouped = props.reservations.reduce<Record<string, Reservation[]>>((acc, reservation) => {
    const hour = reservation.reservation_time.slice(0, 5);
    acc[hour] = acc[hour] || [];
    acc[hour].push(reservation);
    return acc;
  }, {});

  return (
    <section className="grid gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div>
        <h3 className="text-lg font-medium">Agenda</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Reservas agrupadas por hora para operar el local.</p>
      </div>
      {Object.keys(grouped).length ? Object.entries(grouped).map(([hour, reservations]) => (
        <div key={hour} className="grid gap-3">
          <h4 className="text-sm font-medium text-[var(--text-muted)]">{formatTime(hour)}</h4>
          <div className="grid gap-3 lg:grid-cols-2">
            {reservations.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} {...props} />)}
          </div>
        </div>
      )) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">No hay reservas para mostrar.</p>}
    </section>
  );
}

type ReservationListProps = {
  reservations: Reservation[];
  tables: ClientTable[];
  tableById: Map<string, ClientTable>;
  events: ReservationEvent[];
  clientNames: Map<string, string>;
  clients: Pick<Client, "id" | "name">[];
  role: string;
  clientId?: string;
};

function ReservationList(props: ReservationListProps) {
  return (
    <section className="grid gap-3">
      {props.reservations.length ? props.reservations.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} {...props} />) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">No hay solicitudes pendientes.</p>}
    </section>
  );
}

function ReservationKanban(props: ReservationListProps) {
  return (
    <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="grid grid-flow-col auto-cols-[minmax(300px,330px)] gap-4">
        {kanbanColumns.map((column) => {
          const reservations = props.reservations.filter((reservation) => reservation.status === column.id || (column.id === "cancelled" && ["cancelled", "no_show", "rejected"].includes(reservation.status)));
          return (
            <section key={column.id} className="grid h-fit gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium">{column.title}</h3><span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-medium">{reservations.length}</span></div>
              {reservations.length ? reservations.map((reservation) => <ReservationCard key={reservation.id} reservation={reservation} {...props} compact />) : <p className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">Sin reservas.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ReservationCard({ reservation, tables, tableById, clientNames, clients, role, clientId, compact = false }: ReservationListProps & { reservation: Reservation; compact?: boolean }) {
  const alert = getReservationAlert(reservation);
  const table = reservation.table_id ? tableById.get(reservation.table_id) : null;
  const availableTables = tables.filter((row) => row.client_id === reservation.client_id && row.is_active && row.status !== "inactive");
  return (
    <article className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{reservation.reservation_code}</p>
          <h3 className="mt-1 text-lg font-medium">{reservation.customer_name}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{clientNames.get(reservation.client_id) || "Negocio"} - {reservation.party_size} persona{reservation.party_size === 1 ? "" : "s"}</p>
        </div>
        <div className="text-right"><p className="text-sm font-medium">{formatTime(reservation.reservation_time)}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{reservation.reservation_date}</p></div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-medium ${alert.className}`}>{alert.label}</span>
        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--text-muted)]">{reservationStatusLabels[reservation.status]}</span>
        <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[var(--text-muted)]">Mesa: {table?.label || "Sin asignar"}</span>
      </div>
      {reservation.notes && !compact ? <p className="rounded-[14px] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)]">{reservation.notes}</p> : null}
      <div className="grid gap-2 sm:grid-cols-3">
        {getReservationActions(reservation.status).map((action) => (
          <StatusForm key={action.status} reservation={reservation} status={action.status} label={action.label} role={role} clientId={clientId} clients={clients} />
        ))}
        {reservation.customer_phone ? <a className="inline-flex min-h-9 items-center justify-center rounded-full bg-[#25D366] px-3 text-xs font-medium text-white" href={buildWhatsappUrl(reservation.customer_phone, `Hola ${reservation.customer_name}, te escribimos por tu reserva ${reservation.reservation_code} para el ${reservation.reservation_date} a las ${formatTime(reservation.reservation_time)}.`)} target="_blank" rel="noreferrer">WhatsApp</a> : null}
      </div>
      {!compact ? (
        <form action={assignReservationTableAction.bind(null, reservation.id)} className="grid gap-2 rounded-[14px] bg-[var(--surface-muted)] p-3 sm:grid-cols-[1fr_auto]">
          {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} defaultValue={reservation.client_id} compact />}
          <select name="table_id" required className="focus-ring min-h-10 rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm">
            <option value="">Asignar mesa</option>
            {availableTables.map((row) => <option key={row.id} value={row.id}>{row.label} - {row.seats || 4} personas</option>)}
          </select>
          <Button type="submit" variant="secondary">Asignar</Button>
        </form>
      ) : null}
    </article>
  );
}

function TablesView({ tables, reservations }: { tables: ClientTable[]; reservations: Reservation[] }) {
  const reservationByTable = new Map(reservations.filter((reservation) => reservation.table_id && !["completed", "cancelled", "no_show", "rejected"].includes(reservation.status)).map((reservation) => [reservation.table_id, reservation]));
  return (
    <section className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
      <div className="border-b border-[var(--line)] p-4"><h3 className="text-lg font-medium">Mesas</h3><p className="mt-1 text-sm text-[var(--text-muted)]">Estado de mesas y reserva actual.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-[var(--surface-muted)] text-left text-xs text-[var(--text-muted)]"><tr><th className="px-4 py-3">Mesa</th><th className="px-4 py-3">Capacidad</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Reserva actual</th></tr></thead>
          <tbody>{tables.map((table) => { const reservation = reservationByTable.get(table.id); return <tr key={table.id} className="border-t border-[var(--line)]"><td className="px-4 py-3 font-medium">{table.label}</td><td className="px-4 py-3">{table.seats || 4}</td><td className="px-4 py-3">{table.status}</td><td className="px-4 py-3">{reservation ? `${reservation.reservation_code} - ${reservation.customer_name}` : "Sin reserva"}</td></tr>; })}</tbody>
        </table>
      </div>
    </section>
  );
}

function ReservationHistory({ events, reservations }: { events: ReservationEvent[]; reservations: Reservation[] }) {
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  return <section className="grid gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">{events.length ? events.map((event) => { const reservation = reservationById.get(event.reservation_id); return <div key={event.id} className="rounded-[14px] bg-[var(--surface-muted)] p-3 text-sm"><p className="font-medium">{reservation?.reservation_code || "Reserva"} - {reservationStatusLabels[event.to_status as ReservationStatus] || event.to_status}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(event.created_at).toLocaleString("es-PE")}{event.actor_email ? ` - ${event.actor_email}` : ""}</p>{event.note ? <p className="mt-1 text-xs text-[var(--text-muted)]">{event.note}</p> : null}</div>; }) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay historial de reservas.</p>}</section>;
}

function StatusForm({ reservation, status, label, role, clientId, clients }: { reservation: Reservation; status: ReservationStatus; label: string; role: string; clientId?: string; clients: Pick<Client, "id" | "name">[] }) {
  return <form action={updateReservationStatusAction.bind(null, reservation.id)}>{role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} defaultValue={reservation.client_id} compact />}<input type="hidden" name="status" value={status} /><button type="submit" className="min-h-9 w-full rounded-full bg-[var(--surface-muted)] px-3 text-xs font-medium">{label}</button></form>;
}

function getReservationActions(status: ReservationStatus): Array<{ status: ReservationStatus; label: string }> {
  if (status === "pending" || status === "waiting" || status === "rescheduled") return [{ status: "confirmed", label: "Confirmar" }, { status: "rejected", label: "Rechazar" }];
  if (status === "confirmed") return [{ status: "arrived", label: "Cliente llego" }, { status: "cancelled", label: "Cancelar" }];
  if (status === "arrived") return [{ status: "seated", label: "En mesa" }, { status: "no_show", label: "No asistio" }];
  if (status === "seated") return [{ status: "completed", label: "Completar" }];
  return [{ status: status, label: "Ver resumen" }];
}

function getReservationAlert(reservation: Reservation) {
  const reservationDate = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
  const minutes = Math.round((reservationDate.getTime() - Date.now()) / 60000);
  if (reservation.status === "pending" && minutes < 60) return { label: "Confirmar pronto", level: "warning" as const, className: "bg-amber-100 text-amber-800" };
  if (reservation.status === "confirmed" && !reservation.table_id && minutes < 30) return { label: "Sin mesa", level: "warning" as const, className: "bg-amber-100 text-amber-800" };
  if (!["completed", "cancelled", "no_show", "rejected"].includes(reservation.status) && minutes < -30) return { label: "Vencida", level: "critical" as const, className: "bg-red-100 text-red-700" };
  if (reservation.status === "completed") return { label: "Completada", level: "normal" as const, className: "bg-green-100 text-green-700" };
  return { label: "En agenda", level: "normal" as const, className: "bg-blue-100 text-blue-700" };
}

function ReservationConfigView({ role, clientId, clients, settings }: { role: string; clientId?: string; clients: Pick<Client, "id" | "name">[]; settings: ReservationSettings | null }) {
  return (
    <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div>
        <h3 className="text-lg font-medium">Configuracion de reservas</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Controla confirmacion, capacidad por bloque, horarios y reglas del local.</p>
      </div>
      <form action={updateReservationSettingsAction} className="mt-5 grid gap-4 md:grid-cols-2">
        {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} defaultValue={settings?.client_id || ""} />}
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Modo de confirmacion</span>
          <select name="confirmation_mode" defaultValue={settings?.confirmation_mode || "MANUAL"} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3">
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATICA">Automatica si hay capacidad</option>
          </select>
        </label>
        <Input name="default_duration_minutes" label="Duracion promedio" type="number" min="15" defaultValue={settings?.default_duration_minutes || 90} />
        <Input name="slot_interval_minutes" label="Bloques cada" type="number" min="15" defaultValue={settings?.slot_interval_minutes || 30} />
        <Input name="max_people_per_block" label="Capacidad maxima por bloque" type="number" min="1" defaultValue={settings?.max_people_per_block || 20} />
        <Input name="min_notice_hours" label="Anticipacion minima en horas" type="number" min="0" defaultValue={settings?.min_notice_hours || 2} />
        <Input name="max_days_ahead" label="Dias maximos para reservar" type="number" min="1" defaultValue={settings?.max_days_ahead || 30} />
        <Input name="max_people_per_reservation" label="Personas maximas por reserva" type="number" min="1" defaultValue={settings?.max_people_per_reservation || 12} />
        <Input name="deposit_amount" label="Monto de adelanto" type="number" step="0.1" min="0" defaultValue={settings?.deposit_amount || ""} />
        <div className="grid gap-3 rounded-[18px] bg-[var(--surface-muted)] p-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input name="reservations_enabled" type="checkbox" defaultChecked={settings?.reservations_enabled ?? true} /> Reservas activas</label>
          <label className="flex items-center gap-2 text-sm"><input name="require_deposit" type="checkbox" defaultChecked={settings?.require_deposit ?? false} /> Requerir adelanto</label>
        </div>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium">Horarios habilitados</span>
          <textarea name="opening_hours_note" defaultValue={settings?.opening_hours_note || ""} className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Ej. Lunes a sabado 12:00 - 22:00. Domingo 12:00 - 18:00." />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium">Dias bloqueados o excepciones</span>
          <textarea name="blocked_dates_note" defaultValue={settings?.blocked_dates_note || ""} className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Ej. Feriados, eventos privados o dias sin atencion." />
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium">Mensaje automatico por WhatsApp</span>
          <textarea name="auto_whatsapp_message" defaultValue={settings?.auto_whatsapp_message || ""} className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Ej. Recibimos tu solicitud. Te confirmaremos por WhatsApp." />
        </label>
        <div className="md:col-span-2"><Button type="submit">Guardar configuracion</Button></div>
      </form>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "amber" | "blue" | "purple" | "green" | "red" }) {
  const dot = { amber: "bg-[#FF9500]", blue: "bg-[#007AFF]", purple: "bg-[#AF52DE]", green: "bg-[#34C759]", red: "bg-[#FF3B30]" }[tone];
  return <article className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel"><p className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><span className={`h-2 w-2 rounded-full ${dot}`} />{label}</p><p className="mt-2 text-3xl font-medium">{value}</p></article>;
}

function Tab({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <a href={href} className={`rounded-full px-4 py-2 text-sm font-medium ${active ? "bg-[var(--accent)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{children}</a>;
}

function ClientSelect({ clients, compact = false, defaultValue = "" }: { clients: Pick<Client, "id" | "name">[]; compact?: boolean; defaultValue?: string }) {
  return <label className={compact ? "sr-only" : "grid gap-2 text-sm"}>{!compact ? <span className="font-medium text-[var(--text)]">Negocio</span> : null}<select name="client_id" required defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]"><option value="">Selecciona un negocio</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>;
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour || 0), Number(minute || 0), 0, 0);
  return new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit" }).format(date);
}
