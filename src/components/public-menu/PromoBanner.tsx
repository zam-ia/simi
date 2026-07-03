import { formatPrice } from "@/lib/utils";
import type { Client, MenuItem } from "@/types/menu";

type PromoBannerProps = {
  client: Client;
  promoItem?: MenuItem | null;
  onAddPromo?: (item: MenuItem) => void;
  onBrowseMenu?: () => void;
};

export function PromoBanner({ client, promoItem, onAddPromo, onBrowseMenu }: PromoBannerProps) {
  if (!client.promo_banner_is_active || (!client.promo_banner_title && !client.promo_banner_description && !client.promo_banner_image_url)) {
    return null;
  }

  const canAddPromo = Boolean(promoItem?.is_available && onAddPromo);

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-[30px] border border-white/70 bg-[var(--surface)] shadow-soft">
      {client.promo_banner_image_url ? (
        <div className="relative h-48 overflow-hidden bg-[var(--surface-muted)] sm:h-56">
          <img alt={client.promo_banner_title || "Promocion"} src={client.promo_banner_image_url} className="h-full w-full object-cover" />
          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-[#1d1d1f] shadow-panel">Promocion</div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 p-4">
        <div>
          {!client.promo_banner_image_url ? (
            <div className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: client.primary_color }}>
              Promocion
            </div>
          ) : null}
          {client.promo_banner_title ? <h2 className="text-xl font-medium leading-snug">{client.promo_banner_title}</h2> : null}
          {client.promo_banner_description ? <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">{client.promo_banner_description}</p> : null}
          {promoItem ? <p className="mt-2 text-sm font-medium" style={{ color: client.primary_color }}>{formatPrice(promoItem.price)}</p> : null}
        </div>
        <button
          type="button"
          className="simi-gradient min-h-12 rounded-full px-5 text-sm font-medium text-white shadow-panel transition-transform duration-200 ease-out active:scale-[0.97]"
          onClick={() => {
            if (canAddPromo && promoItem) {
              onAddPromo?.(promoItem);
              return;
            }
            onBrowseMenu?.();
          }}
        >
          Lo quiero
        </button>
      </div>
    </section>
  );
}
