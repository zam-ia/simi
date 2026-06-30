import type { Client } from "@/types/menu";

type PromoBannerProps = {
  client: Client;
};

export function PromoBanner({ client }: PromoBannerProps) {
  if (!client.promo_banner_is_active || (!client.promo_banner_title && !client.promo_banner_description && !client.promo_banner_image_url)) {
    return null;
  }

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-panel"
      style={{
        boxShadow: `0 14px 34px color-mix(in srgb, ${client.primary_color} 18%, transparent)`
      }}
    >
      {client.promo_banner_image_url ? <img alt={client.promo_banner_title || "Promoción"} src={client.promo_banner_image_url} className="h-36 w-full object-cover" /> : null}
      <div className="p-4">
        <div className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium text-white" style={{ backgroundColor: client.primary_color }}>
          Promoción
        </div>
        {client.promo_banner_title ? <h2 className="text-lg font-medium leading-snug">{client.promo_banner_title}</h2> : null}
        {client.promo_banner_description ? <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">{client.promo_banner_description}</p> : null}
      </div>
    </section>
  );
}
