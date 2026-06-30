import { redirect } from "next/navigation";
import { updateNotificationWhatsappAction } from "@/lib/actions";
import { requireAdmin, requireModuleAccess } from "@/lib/auth";
import { Button, LinkButton } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const context = await requireAdmin();
  const { role, client } = context;

  if (role === "super_admin") {
    return (
      <div className="grid gap-6">
        <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
          <h2 className="text-2xl font-medium">Configuracion</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Como super administrador, la configuracion de cada negocio se edita desde su ficha de cliente.
          </p>
          <div className="mt-4">
            <LinkButton href="/admin" variant="secondary">Volver a clientes</LinkButton>
          </div>
        </section>
      </div>
    );
  }

  requireModuleAccess(context, "settings");

  if (!client) redirect("/login?error=unauthorized");

  const action = updateNotificationWhatsappAction.bind(null, client.id);

  return (
    <div className="grid gap-6">
      <section className="rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <p className="text-sm text-[var(--text-muted)]">Configuracion del negocio</p>
        <h2 className="mt-2 text-2xl font-medium">{client.name}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Define a que WhatsApp llegaran los pedidos cuando el cliente toque el boton de enviar por WhatsApp.
        </p>
      </section>

      <form action={action} className="grid gap-5 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        {searchParams.saved ? <div className="rounded-[var(--radius-card)] bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/35 dark:text-green-200">Configuracion guardada correctamente.</div> : null}
        {searchParams.error ? <div className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{searchParams.error}</div> : null}

        <Input
          label="WhatsApp de notificaciones"
          name="notification_whatsapp_number"
          defaultValue={client.notification_whatsapp_number || ""}
          placeholder="+51 999 888 777"
          hint={`Si lo dejas vacio, SIMI usara el WhatsApp publico: ${client.whatsapp_number}.`}
        />

        <div className="flex flex-wrap justify-end gap-3">
          <LinkButton href="/admin" variant="secondary">Volver</LinkButton>
          <Button type="submit">Guardar configuracion</Button>
        </div>
      </form>
    </div>
  );
}
