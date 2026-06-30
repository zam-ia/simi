import { YapeModal } from "@/components/public-menu/YapeModal";
import { buildWhatsappUrl } from "@/lib/utils";
import type { Client } from "@/types/menu";

type StickyOrderBarProps = {
  client: Client;
};

export function StickyOrderBar({ client }: StickyOrderBarProps) {
  const whatsappUrl = buildWhatsappUrl(client.whatsapp_number, "Hola, quiero hacer un pedido");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[var(--line)] bg-[var(--surface)]/94 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
      <div className="flex w-full max-w-[480px] gap-3">
        <YapeModal yapeNumber={client.yape_number} yapeQrUrl={client.yape_qr_url} />
        <a className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[#25D366] px-4 text-[15px] font-medium text-white shadow-panel" href={whatsappUrl} target="_blank" rel="noreferrer">
          Pedir por WhatsApp
        </a>
      </div>
    </div>
  );
}
