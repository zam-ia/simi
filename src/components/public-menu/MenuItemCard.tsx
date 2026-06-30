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
    <article className={`grid grid-cols-[96px_1fr] gap-3 rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-panel transition ${item.is_available ? "hover:-translate-y-0.5" : "opacity-60 grayscale"}`}>
      <div className="relative h-24 w-24 overflow-hidden rounded-[16px] bg-[var(--surface-muted)]">
        {item.image_url ? (
          <img alt={item.name} src={item.image_url} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center px-3 text-center text-xs text-[var(--text-muted)]">Sin imagen</div>
        )}
        {!item.is_available ? <div className="absolute inset-0 bg-white/45 dark:bg-black/35" /> : null}
      </div>

      <div className="min-w-0">
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
            <button type="button" className="rounded-full px-3 py-1.5 text-xs font-medium text-white" style={{ backgroundColor: accentColor }} onClick={() => onAdd(item)}>
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
