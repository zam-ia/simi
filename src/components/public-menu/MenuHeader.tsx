import type { Client } from "@/types/menu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type MenuHeaderProps = {
  client: Client;
};

export function MenuHeader({ client }: MenuHeaderProps) {
  const secondaryColor = client.secondary_color || "#1F1F1F";
  const heroImage = client.hero_banner_image_url || client.promo_banner_image_url || null;
  const background = heroImage
    ? `linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.42)), url("${heroImage}")`
    : `radial-gradient(circle at 82% 18%, color-mix(in srgb, ${client.primary_color} 35%, transparent), transparent 28%), linear-gradient(145deg, ${client.primary_color} 0%, color-mix(in srgb, ${secondaryColor} 82%, #111827) 100%)`;

  return (
    <header className="relative pb-20 text-white lg:pb-24">
      <div className="min-h-[230px] bg-cover bg-center px-4 pt-4 sm:px-5 lg:min-h-[300px] lg:px-8 lg:pt-6" style={{ background }}>
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <a href="#menu-content" className="focus-ring inline-flex min-h-11 flex-1 items-center gap-2 rounded-full bg-white/94 px-4 text-sm font-medium text-[#1d1d1f] shadow-panel backdrop-blur">
            <SearchIcon className="h-5 w-5 text-[var(--text-muted)]" />
            Buscar platos en {client.name}
          </a>
          <ThemeToggle compact />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-5 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 rounded-[28px] border border-white/55 bg-[var(--surface)] p-4 text-[var(--text)] shadow-soft lg:gap-5 lg:p-5">
          {client.logo_url ? (
            <img alt={client.name} src={client.logo_url} className="h-[72px] w-[72px] shrink-0 rounded-[22px] border border-[var(--line)] bg-white object-cover shadow-panel lg:h-24 lg:w-24 lg:rounded-[26px]" />
          ) : (
            <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] bg-[var(--surface-muted)] text-3xl font-medium shadow-panel lg:h-24 lg:w-24 lg:rounded-[26px]">{client.name.slice(0, 1)}</div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-medium leading-tight lg:text-4xl">{client.name}</h1>
            {client.address ? <p className="mt-1 line-clamp-1 text-sm leading-5 text-[var(--text-muted)]">{client.address}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5">Carta digital</span>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5">Reservas y pedidos</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
