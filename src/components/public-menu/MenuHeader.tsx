import type { Client } from "@/types/menu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type MenuHeaderProps = {
  client: Client;
};

export function MenuHeader({ client }: MenuHeaderProps) {
  const secondaryColor = client.secondary_color || "#111827";

  return (
    <header
      className="relative px-4 pb-5 pt-5 text-white sm:px-5"
      style={{
        background: `linear-gradient(145deg, ${client.primary_color} 0%, color-mix(in srgb, ${secondaryColor} 82%, #111827) 100%)`
      }}
    >
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-40 max-w-[480px] items-center gap-4">
        {client.logo_url ? (
          <img alt={client.name} src={client.logo_url} className="h-[72px] w-[72px] rounded-[22px] border border-white/35 bg-white object-cover shadow-panel" />
        ) : (
          <div className="grid h-[72px] w-[72px] place-items-center rounded-[22px] border border-white/35 bg-white/15 text-3xl font-medium shadow-panel">{client.name.slice(0, 1)}</div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-medium leading-tight">{client.name}</h1>
          {client.address ? <p className="mt-2 text-sm leading-5 text-white/85">{client.address}</p> : null}
        </div>
      </div>
    </header>
  );
}
