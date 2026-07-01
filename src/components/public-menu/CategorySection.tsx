import { MenuItemCard } from "@/components/public-menu/MenuItemCard";
import type { CategoryWithItems } from "@/types/menu";

type CategorySectionProps = {
  category: CategoryWithItems;
  accentColor: string;
  onAdd?: (item: CategoryWithItems["items"][number]) => void;
  quantities?: Record<string, number>;
};

export function CategorySection({ category, accentColor, onAdd, quantities = {} }: CategorySectionProps) {
  return (
    <section id={category.id} className="scroll-mt-24 grid min-w-0 max-w-full grid-cols-1 gap-3">
      <div className="flex min-w-0 items-end justify-between gap-3">
        <h2 className="min-w-0 text-xl font-medium">{category.name}</h2>
        <span className="text-xs text-[var(--text-muted)]">{category.items.length} productos</span>
      </div>

      {category.items.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--text-muted)]">Esta categoría aún no tiene productos disponibles.</div>
      ) : (
        <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden md:grid-cols-2 2xl:grid-cols-3">
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} accentColor={accentColor} onAdd={onAdd} quantity={quantities[item.id] || 0} />
          ))}
        </div>
      )}
    </section>
  );
}
