import { businessTypeLabels, demoMeetingChannels, demoStatusLabels, demoStatusOptions } from "@/constants/commercial";
import { Button } from "@/components/shared/Button";
import { convertDemoRequestToClientAction, scheduleDemoRequestAction, updateDemoRequestStatusAction } from "@/lib/actions";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { getAdminDemoRequests } from "@/lib/commercial-data";
import { buildWhatsappUrl } from "@/lib/utils";
import type { DemoRequest, DemoRequestStatus } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminDemosPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireSuperAdmin(context);
  const { requests, missingCommercialTables } = await getAdminDemoRequests();

  const metrics = {
    new: requests.filter((request) => request.status === "NUEVA").length,
    scheduled: requests.filter((request) => request.status === "DEMO_AGENDADA").length,
    followUp: requests.filter((request) => request.status === "SEGUIMIENTO").length,
    converted: requests.filter((request) => request.status === "CONVERTIDO").length
  };

  return (
    <div className="grid gap-4 lg:gap-5">
      <header className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-soft lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm text-[var(--text-muted)]">CRM comercial</p>
          <h2 className="mt-2 text-3xl font-medium">Demos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Gestiona solicitudes de demo, agenda reuniones, haz seguimiento y convierte prospectos en clientes.</p>
          {resolvedSearchParams.saved ? <p className="mt-3 text-sm text-green-700 dark:text-green-300">Cambios guardados correctamente.</p> : null}
          {resolvedSearchParams.error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
          {missingCommercialTables ? <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 015_commercial_layer.sql en Supabase para activar solicitudes de demo.</p> : null}
        </div>
        <a href="/#demo" target="_blank" className="focus-ring rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white shadow-panel">Ver formulario publico</a>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Nuevas" value={metrics.new} />
        <Metric label="Agendadas" value={metrics.scheduled} />
        <Metric label="Seguimiento" value={metrics.followUp} />
        <Metric label="Convertidas" value={metrics.converted} />
      </section>

      {requests.length ? (
        <section className="grid gap-4">
          {requests.map((request) => <DemoRequestCard key={request.id} request={request} />)}
        </section>
      ) : (
        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-panel">
          <h3 className="text-xl font-medium">Aun no hay solicitudes de demo</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Cuando un negocio complete una solicitud, aparecera aqui para seguimiento comercial.</p>
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
    </div>
  );
}

function DemoRequestCard({ request }: { request: DemoRequest }) {
  const whatsappText = [
    `Hola ${request.contact_name}, soy de SIMI.`,
    `Gracias por solicitar una demo para ${request.business_name}.`,
    "Quisiera agendar una demostracion breve para mostrarte como se veria en tu negocio."
  ].join("\n");
  const statusTone = getStatusTone(request.status);

  return (
    <article className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel xl:grid-cols-[1fr_360px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-muted)]">{businessTypeLabels[request.business_type]} - {request.city}</p>
            <h3 className="mt-1 text-2xl font-medium">{request.business_name}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Contacto: {request.contact_name} - {request.whatsapp}</p>
            {request.social_url ? <p className="mt-1 text-sm text-[var(--text-muted)]">Red social: {request.social_url}</p> : null}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>{demoStatusLabels[request.status]}</span>
        </div>

        {request.comment ? <p className="mt-4 rounded-[var(--radius-card)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--text-muted)]">{request.comment}</p> : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Info label="Fecha demo" value={request.meeting_date ? `${request.meeting_date} ${request.meeting_time || ""}` : "Sin agendar"} />
          <Info label="Canal" value={request.meeting_channel || "Pendiente"} />
          <Info label="Plan interesado" value={request.plan_interest || "Sin definir"} />
          <Info label="Responsable" value={request.owner_email || "Sin asignar"} />
        </div>
      </div>

      <div className="grid gap-3 rounded-[20px] bg-[var(--background)] p-4">
        <a href={buildWhatsappUrl(request.whatsapp, whatsappText)} target="_blank" className="focus-ring rounded-full bg-green-600 px-4 py-2 text-center text-sm font-medium text-white shadow-panel">Contactar por WhatsApp</a>

        <form action={scheduleDemoRequestAction.bind(null, request.id)} className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <input name="meeting_date" type="date" defaultValue={request.meeting_date || ""} className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
            <input name="meeting_time" type="time" defaultValue={request.meeting_time || ""} className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
          </div>
          <select name="meeting_channel" defaultValue={request.meeting_channel || "Meet"} className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm">
            {demoMeetingChannels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
          </select>
          <input name="meeting_link" defaultValue={request.meeting_link || ""} placeholder="Link de reunion" className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
          <input name="owner_email" defaultValue={request.owner_email || ""} placeholder="Responsable" className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
          <Button type="submit" variant="secondary" className="w-full">Agendar demo</Button>
        </form>

        <form action={updateDemoRequestStatusAction.bind(null, request.id)} className="grid gap-2">
          <select name="status" defaultValue={request.status} className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm">
            {demoStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input name="plan_interest" defaultValue={request.plan_interest || ""} placeholder="Plan interesado" className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
          <textarea name="follow_up_note" defaultValue={request.follow_up_note || ""} placeholder="Nota de seguimiento" rows={3} className="focus-ring rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary" className="w-full">Guardar seguimiento</Button>
        </form>

        {!request.converted_client_id ? (
          <form action={convertDemoRequestToClientAction.bind(null, request.id)} className="grid gap-2 border-t border-[var(--line)] pt-3">
            <input name="owner_email" defaultValue={request.owner_email || ""} placeholder="Email admin del negocio" className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
            <input name="plan_name" defaultValue={request.plan_interest || ""} placeholder="Plan asignado" className="focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm" />
            <Button type="submit" className="w-full">Convertir a cliente</Button>
          </form>
        ) : (
          <p className="rounded-[var(--radius-card)] bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/35 dark:text-green-100">Solicitud convertida en cliente.</p>
        )}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--background)] p-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function getStatusTone(status: DemoRequestStatus) {
  if (status === "NUEVA") return "bg-blue-50 text-blue-800 dark:bg-blue-950/35 dark:text-blue-100";
  if (status === "DEMO_AGENDADA") return "bg-amber-50 text-amber-800 dark:bg-amber-950/35 dark:text-amber-100";
  if (status === "CONVERTIDO") return "bg-green-50 text-green-800 dark:bg-green-950/35 dark:text-green-100";
  if (status === "NO_INTERESADO" || status === "DESCARTADO") return "bg-red-50 text-red-800 dark:bg-red-950/35 dark:text-red-100";
  return "bg-[var(--surface-muted)] text-[var(--text-muted)]";
}
