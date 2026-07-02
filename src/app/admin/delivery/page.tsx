import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { assignCourierToOrderAction, createCourierAction, createDeliveryZoneAction, deleteDeliveryZoneAction, updateCourierAction, updateDeliveryAssignmentStatusAction, updateDeliverySettingsAction, updateDeliveryZoneAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { getAdminDeliveryCenter } from "@/lib/menu-data";
import { buildWhatsappUrl, formatPrice } from "@/lib/utils";
import type { Client, ClientDeliveryZone, Courier, DeliveryAssignment, DeliverySettings, DeliveryStatus, DeliveryStatusEvent, OrderWithDetails } from "@/types/menu";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  PENDIENTE_ASIGNACION: "Pendiente",
  ASIGNADO: "Asignado",
  REPARTIDOR_EN_LOCAL: "En local",
  RECOGIDO: "Recogido",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  FALLIDO: "Fallido",
  CANCELADO: "Cancelado",
  INCIDENCIA: "Incidencia"
};

const dispatchColumns: Array<{ status: DeliveryStatus; title: string; description: string }> = [
  { status: "PENDIENTE_ASIGNACION", title: "Pendiente", description: "Listos sin repartidor" },
  { status: "ASIGNADO", title: "Asignado", description: "Repartidor asignado" },
  { status: "RECOGIDO", title: "Recogido", description: "Pedido recogido" },
  { status: "EN_CAMINO", title: "En camino", description: "Saliendo al cliente" },
  { status: "ENTREGADO", title: "Entregado", description: "Flujo cerrado" },
  { status: "INCIDENCIA", title: "Incidencia", description: "Requiere revision" }
];

export default async function AdminDeliveryPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; tab?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const context = await requireAdmin();
  requireModuleAccess(context, "delivery");
  const { supabase, role, client } = context;
  const clientId = role === "business_admin" ? client!.id : undefined;
  const [{ data: clients }, delivery] = await Promise.all([
    role === "business_admin" ? supabase.from("clients").select("*").eq("id", client!.id) : supabase.from("clients").select("*").order("name", { ascending: true }),
    getAdminDeliveryCenter(clientId)
  ]);

  const clientRows = (clients || []) as Client[];
  const tab = resolvedSearchParams.tab || "dispatch";
  const assignmentByOrder = new Map(delivery.assignments.map((assignment) => [assignment.order_id, assignment]));
  const courierById = new Map(delivery.couriers.map((courier) => [courier.id, courier]));
  const zoneById = new Map(delivery.zones.map((zone) => [zone.id, zone]));
  const clientNames = new Map(clientRows.map((row) => [row.id, row.name]));
  const dispatchItems = delivery.orders.map((order) => ({
    order,
    assignment: assignmentByOrder.get(order.id) || null,
    status: assignmentByOrder.get(order.id)?.status || "PENDIENTE_ASIGNACION" as DeliveryStatus
  }));

  const metrics = {
    pending: dispatchItems.filter((item) => item.status === "PENDIENTE_ASIGNACION").length,
    assigned: dispatchItems.filter((item) => item.status === "ASIGNADO").length,
    onTheWay: dispatchItems.filter((item) => item.status === "EN_CAMINO" || item.status === "RECOGIDO").length,
    delivered: dispatchItems.filter((item) => item.status === "ENTREGADO").length,
    incidents: dispatchItems.filter((item) => item.status === "INCIDENCIA" || item.status === "FALLIDO").length
  };

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-medium">Delivery</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Asigna repartidores, controla zonas y monitorea entregas.</p>
          {resolvedSearchParams.saved ? <p className="mt-2 text-sm text-green-700 dark:text-green-300">Delivery actualizado correctamente.</p> : null}
          {resolvedSearchParams.error ? <p className="mt-2 text-sm text-red-700 dark:text-red-300">{resolvedSearchParams.error}</p> : null}
          {delivery.missingDeliveryTables ? <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Aplica la migracion 010 en Supabase para activar repartidores, asignaciones e historial.</p> : null}
        </div>
        <p className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">Despachos conectados a pedidos listos.</p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Pendientes" value={metrics.pending} tone="amber" />
        <Metric label="Asignados" value={metrics.assigned} tone="blue" />
        <Metric label="En ruta" value={metrics.onTheWay} tone="purple" />
        <Metric label="Entregados" value={metrics.delivered} tone="green" />
        <Metric label="Incidencias" value={metrics.incidents} tone="red" />
      </section>

      <nav className="flex flex-wrap gap-2 rounded-[22px] border border-[var(--line)] bg-[var(--surface)]/92 p-3 shadow-panel">
        <Tab href="/admin/delivery?tab=dispatch" active={tab === "dispatch"}>Despachos</Tab>
        <Tab href="/admin/delivery?tab=zones" active={tab === "zones"}>Zonas</Tab>
        <Tab href="/admin/delivery?tab=couriers" active={tab === "couriers"}>Repartidores</Tab>
        <Tab href="/admin/delivery?tab=history" active={tab === "history"}>Historial</Tab>
        <Tab href="/admin/delivery?tab=config" active={tab === "config"}>Configuracion</Tab>
      </nav>

      {tab === "zones" ? (
        <ZonesView role={role} clientId={client?.id} clients={clientRows} zones={delivery.zones} />
      ) : tab === "couriers" ? (
        <CouriersView role={role} clientId={client?.id} clients={clientRows} couriers={delivery.couriers} zones={delivery.zones} />
      ) : tab === "history" ? (
        <HistoryView events={delivery.events} assignments={delivery.assignments} orders={delivery.orders} couriers={delivery.couriers} />
      ) : tab === "config" ? (
        <DeliveryConfigView role={role} clientId={client?.id} clients={clientRows} settings={delivery.settings} />
      ) : (
        <DispatchView role={role} clientId={client?.id} clients={clientRows} items={dispatchItems} couriers={delivery.couriers} courierById={courierById} zoneById={zoneById} clientNames={clientNames} />
      )}
    </div>
  );
}

function DispatchView({ role, clientId, clients, items, couriers, courierById, zoneById, clientNames }: { role: string; clientId?: string; clients: Client[]; items: Array<{ order: OrderWithDetails; assignment: DeliveryAssignment | null; status: DeliveryStatus }>; couriers: Courier[]; courierById: Map<string, Courier>; zoneById: Map<string, ClientDeliveryZone>; clientNames: Map<string, string> }) {
  return (
    <div className="overflow-x-auto pb-2 [scrollbar-width:thin]">
      <div className="grid grid-flow-col auto-cols-[minmax(300px,330px)] gap-4">
        {dispatchColumns.map((column) => {
          const columnItems = items.filter((item) => item.status === column.status);
          return (
            <section key={column.status} className="grid h-fit gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface-muted)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">{column.title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{column.description}</p>
                </div>
                <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-xs font-medium">{columnItems.length}</span>
              </div>
              <div className="grid gap-3">
                {columnItems.length ? columnItems.map((item) => (
                  <DispatchCard key={item.order.id} role={role} clientId={clientId} clients={clients} item={item} couriers={couriers} courier={item.assignment?.courier_id ? courierById.get(item.assignment.courier_id) : undefined} zone={item.order.delivery_zone_id ? zoneById.get(item.order.delivery_zone_id) : undefined} clientName={clientNames.get(item.order.client_id) || "Negocio"} />
                )) : <p className="rounded-[16px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">Sin despachos.</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DispatchCard({ role, clientId, clients, item, couriers, courier, zone, clientName }: { role: string; clientId?: string; clients: Client[]; item: { order: OrderWithDetails; assignment: DeliveryAssignment | null; status: DeliveryStatus }; couriers: Courier[]; courier?: Courier; zone?: ClientDeliveryZone; clientName: string }) {
  const { order, assignment, status } = item;
  const availableCouriers = couriers.filter((row) => row.is_active && row.status !== "INACTIVO" && row.status !== "FUERA_DE_TURNO");
  return (
    <article className="grid gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">#{order.order_code}</p>
          <p className="mt-1 text-sm">{order.customer_name || "Cliente sin nombre"}</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{clientName}</p>
        </div>
        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
      </div>
      <div className="grid gap-1 text-xs text-[var(--text-muted)]">
        <p>Zona: {order.delivery_zone_name || zone?.name || "Sin zona"}</p>
        <p className="line-clamp-2">Direccion: {order.delivery_address || "Sin direccion"}</p>
        <p>Pago: {order.payment_status === "validated" ? "Validado" : "Pendiente"}</p>
        <p>Repartidor: {courier?.name || order.courier_name || "Sin asignar"}</p>
      </div>
      <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${status === "INCIDENCIA" ? "bg-red-100 text-red-700" : status === "ENTREGADO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>{deliveryStatusLabels[status]}</span>

      {assignment ? (
        <div className="grid grid-cols-2 gap-2">
          {(["RECOGIDO", "EN_CAMINO", "ENTREGADO", "INCIDENCIA"] as DeliveryStatus[]).map((nextStatus) => (
            <form key={nextStatus} action={updateDeliveryAssignmentStatusAction.bind(null, assignment.id)}>
              {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} compact defaultValue={order.client_id} />}
              <input type="hidden" name="status" value={nextStatus} />
              <button className="min-h-9 w-full rounded-full bg-[var(--surface-muted)] px-3 text-xs font-medium" type="submit">{deliveryStatusLabels[nextStatus]}</button>
            </form>
          ))}
        </div>
      ) : (
        <form action={assignCourierToOrderAction.bind(null, order.id)} className="grid gap-2">
          {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} compact defaultValue={order.client_id} />}
          <select name="courier_id" required className="focus-ring min-h-10 rounded-[14px] border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-sm">
            <option value="">Asignar repartidor</option>
            {availableCouriers.map((row) => <option key={row.id} value={row.id}>{row.name} - {row.status}</option>)}
          </select>
          <Button type="submit">Asignar</Button>
        </form>
      )}

      {order.customer_phone ? <a className="text-sm font-medium text-[#25D366]" href={buildWhatsappUrl(order.customer_phone, `Hola ${order.customer_name || ""}, tu pedido #${order.order_code} ya esta listo para delivery.`)} target="_blank" rel="noreferrer">WhatsApp cliente</a> : null}
    </article>
  );
}

function ZonesView({ role, clientId, clients, zones }: { role: string; clientId?: string; clients: Client[]; zones: ClientDeliveryZone[] }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <h3 className="text-lg font-medium">Nueva zona</h3>
        <form action={createDeliveryZoneAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} />}
          <Input name="name" label="Nombre de zona" placeholder="Ej. El Tambo" required />
          <Input name="delivery_fee" label="Costo de delivery" type="number" step="0.1" min="0" defaultValue="0" />
          <Input name="minimum_order" label="Pedido minimo" type="number" step="0.1" min="0" defaultValue="0" />
          <Input name="estimated_time" label="Tiempo estimado" placeholder="Ej. 30 a 45 min" />
          <Input name="display_order" label="Orden" type="number" defaultValue="0" />
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="font-medium text-[var(--text)]">Descripcion</span>
            <textarea name="description" className="focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" placeholder="Distritos, referencias o condiciones." />
          </label>
          <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Zona activa</label>
          <div className="md:col-span-2"><Button type="submit">Crear zona</Button></div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
        <div className="border-b border-[var(--line)] p-4">
          <h3 className="text-lg font-medium">Zonas configuradas</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Cobertura, costos, minimos y tiempos por negocio.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-[var(--surface-muted)] text-left text-xs text-[var(--text-muted)]">
              <tr><th className="px-4 py-3">Orden</th><th className="px-4 py-3">Zona</th><th className="px-4 py-3">Costo</th><th className="px-4 py-3">Minimo</th><th className="px-4 py-3">Tiempo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th></tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id} className="border-t border-[var(--line)]">
                  <td className="px-4 py-3">{zone.display_order}</td>
                  <td className="px-4 py-3 font-medium">{zone.name}<p className="mt-1 text-xs text-[var(--text-muted)]">{zone.description}</p></td>
                  <td className="px-4 py-3">{formatPrice(zone.delivery_fee)}</td>
                  <td className="px-4 py-3">{formatPrice(zone.minimum_order)}</td>
                  <td className="px-4 py-3">{zone.estimated_time || "Sin tiempo"}</td>
                  <td className="px-4 py-3">{zone.is_active ? "Activa" : "Inactiva"}</td>
                  <td className="px-4 py-3 text-right">
                    <details className="text-left">
                      <summary className="cursor-pointer rounded-full bg-[var(--surface-muted)] px-3 py-2 text-center text-xs font-medium">Editar</summary>
                      <form action={updateDeliveryZoneAction.bind(null, zone.id)} className="mt-3 grid gap-3 rounded-[18px] bg-[var(--surface-muted)] p-3">
                        <input type="hidden" name="client_id" value={zone.client_id} />
                        <Input name="name" label="Zona" defaultValue={zone.name} required />
                        <Input name="delivery_fee" label="Costo" type="number" step="0.1" min="0" defaultValue={zone.delivery_fee} />
                        <Input name="minimum_order" label="Pedido minimo" type="number" step="0.1" min="0" defaultValue={zone.minimum_order} />
                        <Input name="estimated_time" label="Tiempo" defaultValue={zone.estimated_time || ""} />
                        <Input name="display_order" label="Orden" type="number" defaultValue={zone.display_order} />
                        <textarea name="description" defaultValue={zone.description || ""} className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)]" />
                        <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={zone.is_active} /> Activa</label>
                        <div className="flex gap-2"><Button type="submit" variant="secondary">Guardar</Button><Button form={`delete-zone-${zone.id}`} type="submit" variant="danger">Eliminar</Button></div>
                      </form>
                      <form id={`delete-zone-${zone.id}`} action={deleteDeliveryZoneAction.bind(null, zone.id)}><input type="hidden" name="client_id" value={zone.client_id} /></form>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CouriersView({ role, clientId, clients, couriers, zones }: { role: string; clientId?: string; clients: Client[]; couriers: Courier[]; zones: ClientDeliveryZone[] }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <h3 className="text-lg font-medium">Nuevo repartidor</h3>
        <form action={createCourierAction} className="mt-4 grid gap-4 md:grid-cols-2">
          {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} />}
          <Input name="name" label="Nombre completo" required />
          <Input name="phone" label="Telefono" placeholder="+51 999 999 999" />
          <Input name="document_number" label="Documento" />
          <VehicleSelect />
          <Input name="vehicle_plate" label="Placa" />
          <ZoneSelect zones={zones} />
          <CourierStatusSelect />
          <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked /> Activo</label>
          <label className="grid gap-2 text-sm md:col-span-2"><span className="font-medium">Notas</span><textarea name="notes" className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" /></label>
          <div className="md:col-span-2"><Button type="submit">Crear repartidor</Button></div>
        </form>
      </section>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {couriers.length ? couriers.map((courier) => (
          <article key={courier.id} className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-medium">{courier.name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{courier.vehicle_type}{courier.vehicle_plate ? ` - ${courier.vehicle_plate}` : ""}</p></div>
              <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium">{courier.status}</span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Telefono: {courier.phone || "Sin telefono"}</p>
            {courier.phone ? <a className="mt-2 inline-flex text-sm font-medium text-[#25D366]" href={buildWhatsappUrl(courier.phone, "Hola, tenemos un delivery para asignarte.")} target="_blank" rel="noreferrer">WhatsApp</a> : null}
            <details className="mt-3">
              <summary className="cursor-pointer rounded-full bg-[var(--surface-muted)] px-3 py-2 text-center text-xs font-medium">Editar</summary>
              <form action={updateCourierAction.bind(null, courier.id)} className="mt-3 grid gap-3 rounded-[18px] bg-[var(--surface-muted)] p-3">
                <input type="hidden" name="client_id" value={courier.client_id} />
                <Input name="name" label="Nombre" defaultValue={courier.name} required />
                <Input name="phone" label="Telefono" defaultValue={courier.phone || ""} />
                <Input name="document_number" label="Documento" defaultValue={courier.document_number || ""} />
                <VehicleSelect defaultValue={courier.vehicle_type} />
                <Input name="vehicle_plate" label="Placa" defaultValue={courier.vehicle_plate || ""} />
                <ZoneSelect zones={zones} defaultValue={courier.main_zone_id || ""} />
                <CourierStatusSelect defaultValue={courier.status} />
                <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={courier.is_active} /> Activo</label>
                <textarea name="notes" defaultValue={courier.notes || ""} className="focus-ring min-h-20 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" />
                <Button type="submit" variant="secondary">Guardar</Button>
              </form>
            </details>
          </article>
        )) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay repartidores registrados.</p>}
      </section>
    </div>
  );
}

function HistoryView({ events, assignments, orders, couriers }: { events: DeliveryStatusEvent[]; assignments: DeliveryAssignment[]; orders: OrderWithDetails[]; couriers: Courier[] }) {
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
  const courierById = new Map(couriers.map((courier) => [courier.id, courier]));
  return (
    <section className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
      <div className="border-b border-[var(--line)] p-4"><h3 className="text-lg font-medium">Historial de delivery</h3><p className="mt-1 text-sm text-[var(--text-muted)]">Eventos de asignacion, ruta, entrega e incidencias.</p></div>
      <div className="grid gap-2 p-4">
        {events.length ? events.map((event) => {
          const order = orderById.get(event.order_id);
          const assignment = assignmentById.get(event.delivery_assignment_id);
          const courier = assignment?.courier_id ? courierById.get(assignment.courier_id) : null;
          return <div key={event.id} className="rounded-[16px] bg-[var(--surface-muted)] p-3 text-sm"><p className="font-medium">#{order?.order_code || "Pedido"} - {deliveryStatusLabels[event.to_status as DeliveryStatus] || event.to_status}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(event.created_at).toLocaleString("es-PE")} - {courier?.name || "Sin repartidor"}{event.actor_email ? ` - ${event.actor_email}` : ""}</p>{event.note ? <p className="mt-1 text-xs text-[var(--text-muted)]">{event.note}</p> : null}</div>;
        }) : <p className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-muted)]">Aun no hay eventos de delivery.</p>}
      </div>
    </section>
  );
}

function DeliveryConfigView({ role, clientId, clients, settings }: { role: string; clientId?: string; clients: Client[]; settings: DeliverySettings | null }) {
  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div>
        <h3 className="text-lg font-medium">Configuracion delivery</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Reglas generales para despacho, recojo y mensajes al cliente.</p>
      </div>
      <form action={updateDeliverySettingsAction} className="mt-5 grid gap-4 md:grid-cols-2">
        {role === "business_admin" && clientId ? <input type="hidden" name="client_id" value={clientId} /> : <ClientSelect clients={clients} defaultValue={settings?.client_id || ""} />}
        <Input name="base_preparation_minutes" label="Tiempo base de preparacion" type="number" min="0" defaultValue={settings?.base_preparation_minutes || 20} />
        <Input name="base_delivery_minutes" label="Tiempo base de delivery" type="number" min="0" defaultValue={settings?.base_delivery_minutes || 30} />
        <Input name="support_whatsapp" label="WhatsApp soporte delivery" defaultValue={settings?.support_whatsapp || ""} placeholder="+51 999 999 999" />
        <div className="grid gap-3 rounded-[18px] bg-[var(--surface-muted)] p-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input name="delivery_enabled" type="checkbox" defaultChecked={settings?.delivery_enabled ?? true} /> Delivery activo</label>
          <label className="flex items-center gap-2 text-sm"><input name="pickup_enabled" type="checkbox" defaultChecked={settings?.pickup_enabled ?? true} /> Recojo en local activo</label>
          <label className="flex items-center gap-2 text-sm"><input name="scheduled_orders_enabled" type="checkbox" defaultChecked={settings?.scheduled_orders_enabled ?? false} /> Permitir pedidos programados</label>
          <label className="flex items-center gap-2 text-sm"><input name="require_courier_before_departure" type="checkbox" defaultChecked={settings?.require_courier_before_departure ?? true} /> Requerir repartidor antes de salir</label>
          <label className="flex items-center gap-2 text-sm"><input name="allow_delivered_without_courier" type="checkbox" defaultChecked={settings?.allow_delivered_without_courier ?? false} /> Permitir marcar entregado sin repartidor</label>
        </div>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium">Mensaje automatico al cliente</span>
          <textarea name="automatic_customer_message" defaultValue={settings?.automatic_customer_message || ""} className="focus-ring min-h-28 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2" placeholder="Ej. Tu pedido ya salio a reparto. Gracias por comprar con nosotros." />
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

function ClientSelect({ clients, compact = false, defaultValue = "" }: { clients: Client[]; compact?: boolean; defaultValue?: string }) {
  return <label className={compact ? "sr-only" : "grid gap-2 text-sm"}>{!compact ? <span className="font-medium text-[var(--text)]">Negocio</span> : null}<select name="client_id" required defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)]"><option value="">Selecciona un negocio</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>;
}

function ZoneSelect({ zones, defaultValue = "" }: { zones: ClientDeliveryZone[]; defaultValue?: string }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium">Zona principal</span><select name="main_zone_id" defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3"><option value="">Sin zona</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label>;
}

function VehicleSelect({ defaultValue = "MOTO" }: { defaultValue?: string }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium">Vehiculo</span><select name="vehicle_type" defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3"><option value="MOTO">Moto</option><option value="BICICLETA">Bicicleta</option><option value="AUTO">Auto</option><option value="CAMINANDO">A pie</option><option value="OTRO">Otro</option></select></label>;
}

function CourierStatusSelect({ defaultValue = "DISPONIBLE" }: { defaultValue?: string }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium">Estado</span><select name="status" defaultValue={defaultValue} className="focus-ring min-h-11 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3"><option value="DISPONIBLE">Disponible</option><option value="OCUPADO">Ocupado</option><option value="FUERA_DE_TURNO">Fuera de turno</option><option value="INACTIVO">Inactivo</option></select></label>;
}
