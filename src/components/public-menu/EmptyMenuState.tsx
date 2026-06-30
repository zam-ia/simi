import { buildWhatsappUrl } from "@/lib/utils";
import type { Client } from "@/types/menu";

type EmptyMenuStateProps = {
  client: Client;
};

export function EmptyMenuState({ client }: EmptyMenuStateProps) {
  const whatsappUrl = buildWhatsappUrl(client.whatsapp_number, "Hola, quiero hacer un pedido");

  return (
    <section className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-panel">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-muted)] text-xl">+</div>
      <h2 className="mt-4 text-xl font-medium">Este menu se esta actualizando.</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--text-muted)]">Vuelve pronto o comunicate por WhatsApp para consultar disponibilidad.</p>
      {client.whatsapp_number ? (
        <a className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#25D366] px-5 text-sm font-medium text-white" href={whatsappUrl} target="_blank" rel="noreferrer">
          Pedir por WhatsApp
        </a>
      ) : null}
    </section>
  );
}
