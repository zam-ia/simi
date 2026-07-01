import { Badge } from "@/components/shared/Badge";
import { formatPrice } from "@/lib/utils";
import type { MenuItem } from "@/types/menu";

type MenuItemCardProps = {
  item: MenuItem;
  accentColor: string;
  onAdd?: (item: MenuItem) => void;
};

export function MenuItemCard({ item, accentColor, onAdd }: MenuItemCardProps) {
  return (
    <article className={`grid grid-cols-[104px_1fr] gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-panel transition md:grid-cols-1 md:gap-0 md:overflow-hidden md:p-0 ${item.is_available ? "hover:-translate-y-0.5" : "opacity-60 grayscale"}`}>
      <div className="relative h-24 w-24 overflow-hidden rounded-[16px] bg-[var(--surface-muted)] md:h-44 md:w-full md:rounded-none">
        {item.image_url ? (
          <img alt={item.name} src={item.image_url} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center px-3 text-center text-xs text-[var(--text-muted)]">Sin imagen</div>
        )}
        {item.is_available && onAdd ? (
          <button
            type="button"
            className="focus-ring absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-full border border-white/70 text-lg font-medium text-white shadow-panel backdrop-blur transition-transform duration-200 ease-out active:scale-[0.97]"
            style={{ backgroundColor: accentColor }}
            onClick={() => onAdd(item)}
            aria-label={`Agregar ${item.name}`}
          >
            +
          </button>
        ) : null}
        {!item.is_available ? <div className="absolute inset-0 bg-white/45 dark:bg-black/35" /> : null}
      </div>

      <div className="min-w-0 md:grid md:min-h-[170px] md:content-between md:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-medium leading-snug">{item.name}</h3>
          {!item.is_available ? <Badge tone="red">Agotado</Badge> : null}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--text-muted)]">{item.description || (item.is_available ? "Disponible para pedir." : "Temporalmente no disponible.")}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-base font-medium" style={{ color: item.is_available ? accentColor : "var(--text-muted)" }}>
            {formatPrice(item.price)}
          </p>
          {item.is_available && onAdd ? (
            <button type="button" className="hidden rounded-full px-3 py-1.5 text-xs font-medium text-white md:inline-flex" style={{ backgroundColor: accentColor }} onClick={() => onAdd(item)}>
              Agregar
            </button>
          ) : item.is_available ? (
            <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs text-[var(--text-muted)]">Disponible</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
