import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button, LinkButton } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import type { Client } from "@/types/menu";

type ClientFormProps = {
  client?: Client;
  action: (formData: FormData) => void;
  error?: string;
};

const suggestedColors = [
  { name: "Rojo pollería", value: "#D71920" },
  { name: "Amarillo promo", value: "#F4C430" },
  { name: "Negro premium", value: "#111111" }
];

export function ClientForm({ client, action, error }: ClientFormProps) {
  const storageBase = client ? `clients/${client.id}` : "clients/pending";
  const hasSecondaryColor = Boolean(client?.secondary_color);

  return (
    <form action={action} className="grid gap-5">
      {error ? <div className="rounded-[var(--radius-card)] bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/35 dark:text-red-200">{error}</div> : null}

      <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Datos del negocio</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Lo básico para identificar la carta y recibir pedidos.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Nombre del negocio" name="name" required defaultValue={client?.name} placeholder="Pollería El Sabor" />
          <Input label="Slug del enlace" name="slug" required defaultValue={client?.slug} placeholder="polleria-el-sabor" hint="Este enlace se imprime en el QR. Evita cambiarlo después." />
          <Input label="Dirección" name="address" defaultValue={client?.address || ""} placeholder="Av. Principal 123, Lima" />
          <Input label="WhatsApp público" name="whatsapp_number" required defaultValue={client?.whatsapp_number || "+51 987 088 359"} placeholder="+51 987 088 359" hint="Aparece en la carta para contacto general." />
          <Input label="WhatsApp de notificaciones" name="notification_whatsapp_number" defaultValue={client?.notification_whatsapp_number || ""} placeholder="+51 999 888 777" hint="Aquí llegarán los pedidos por WhatsApp. Si lo dejas vacío, se usa el WhatsApp público." />
          <Input label="Número Yape" name="yape_number" defaultValue={client?.yape_number || ""} placeholder="987088359" />
        </div>
        <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={client?.is_active ?? true} />
          <span>Negocio activo y visible públicamente</span>
        </label>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Identidad visual</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Puedes usar uno o dos colores del negocio. En pollerías suele funcionar rojo, amarillo y negro.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Color principal" name="primary_color" type="color" defaultValue={client?.primary_color || "#D71920"} />
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--text)]">Segundo color opcional</span>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="use_secondary_color" defaultChecked={hasSecondaryColor} />
              <input className="focus-ring h-11 flex-1 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-2" name="secondary_color" type="color" defaultValue={client?.secondary_color || "#F4C430"} />
            </div>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedColors.map((color) => (
            <span key={color.value} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-2 text-xs text-[var(--text-muted)]">
              <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color.value }} />
              {color.name}
            </span>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageUploader
            name="logo_url"
            label="Logo del negocio"
            defaultValue={client?.logo_url}
            storagePath={`${storageBase}/logo`}
            hint="Ideal: PNG o WebP con fondo transparente o limpio. Tamaño recomendado: 512 x 512 px. Máximo 2 MB."
          />
          <ImageUploader
            name="yape_qr_url"
            label="QR de Yape"
            defaultValue={client?.yape_qr_url}
            storagePath={`${storageBase}/yape`}
            hint="Ideal: PNG nítido y cuadrado. Tamaño recomendado: 800 x 800 px para que se escanee bien. Máximo 2 MB."
          />
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
        <div>
          <h2 className="text-lg font-medium">Banner de promoción</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Opcional. Aparece arriba de las categorías en la carta pública.</p>
        </div>
        <label className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-sm">
          <input type="checkbox" name="promo_banner_is_active" defaultChecked={Boolean(client?.promo_banner_is_active)} />
          <span>Mostrar banner promocional</span>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Título del banner" name="promo_banner_title" defaultValue={client?.promo_banner_title || ""} placeholder="Combo familiar de la semana" />
          <Input label="Texto corto" name="promo_banner_description" defaultValue={client?.promo_banner_description || ""} placeholder="Pollo entero + papas + gaseosa" />
        </div>
        <ImageUploader
          name="promo_banner_image_url"
          label="Imagen del banner"
          defaultValue={client?.promo_banner_image_url}
          storagePath={`${storageBase}/promo`}
          preview="wide"
          hint="Ideal para banner superior del menú: JPG o WebP horizontal. Tamaño recomendado: 1200 x 480 px. En móvil se recorta al centro. Máximo 2 MB."
        />
      </section>

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--line)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-end gap-3">
          <LinkButton href="/admin" variant="secondary">
            Volver
          </LinkButton>
          <Button type="submit">{client ? "Guardar cambios" : "Crear cliente"}</Button>
        </div>
      </div>
    </form>
  );
}
