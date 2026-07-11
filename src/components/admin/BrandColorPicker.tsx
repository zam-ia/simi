"use client";

import { useMemo, useState } from "react";
import type { BusinessType } from "@/types/menu";

type Palette = {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  colors: string[];
};

type BrandColorPickerProps = {
  initialPrimary: string;
  initialSecondary: string;
  initialUseSecondary: boolean;
  businessType?: BusinessType;
  businessName?: string;
};

const universalPalettes: Palette[] = [
  {
    name: "Marca vibrante",
    description: "Alto contraste para ofertas, productos destacados y acciones rápidas.",
    primary: "#E62E24",
    secondary: "#FF7A1A",
    colors: ["#E62E24", "#FF7A1A", "#1D1D1F", "#FFFFFF"]
  },
  {
    name: "Fresco y natural",
    description: "Verde profundo con acento cálido para cartas artesanales o saludables.",
    primary: "#16794B",
    secondary: "#F4B740",
    colors: ["#16794B", "#F4B740", "#F5F5F7", "#1D1D1F"]
  },
  {
    name: "Elegante contemporáneo",
    description: "Base oscura con un acento limpio para una presencia más sobria.",
    primary: "#202124",
    secondary: "#2F80ED",
    colors: ["#202124", "#2F80ED", "#F5F5F7", "#FFFFFF"]
  }
];

const paletteByBusinessType: Record<BusinessType, Palette> = {
  fast_food: {
    name: "Venta rápida",
    description: "Rojo y amarillo para combos, promociones y decisiones inmediatas.",
    primary: "#D92D20",
    secondary: "#F5B700",
    colors: ["#D92D20", "#F5B700", "#161616", "#FFFFFF"]
  },
  restaurant: {
    name: "Restaurante urbano",
    description: "Verde oscuro y coral para una carta versátil y moderna.",
    primary: "#165D4C",
    secondary: "#EF6A5B",
    colors: ["#165D4C", "#EF6A5B", "#F6F6F4", "#202124"]
  },
  polleria: {
    name: "Brasa y sabor",
    description: "Rojo intenso y dorado para pollerías, parrillas y ofertas familiares.",
    primary: "#C62828",
    secondary: "#FFC107",
    colors: ["#C62828", "#FFC107", "#1F1F1F", "#FFFFFF"]
  },
  coffee_shop: {
    name: "Café contemporáneo",
    description: "Verde bosque y ámbar para bebidas, recojo y consumo en local.",
    primary: "#245B4A",
    secondary: "#D99028",
    colors: ["#245B4A", "#D99028", "#F4F1EC", "#1D1D1F"]
  },
  bakery: {
    name: "Horno artesanal",
    description: "Terracota y azul petróleo para panes, desayunos y pedidos diarios.",
    primary: "#B84A3A",
    secondary: "#176B73",
    colors: ["#B84A3A", "#176B73", "#FFF7F0", "#222222"]
  },
  pastry_shop: {
    name: "Pastelería editorial",
    description: "Frambuesa y dorado suave para vitrinas, tortas y pedidos programados.",
    primary: "#B4235A",
    secondary: "#E3A72F",
    colors: ["#B4235A", "#E3A72F", "#FFF7FB", "#222222"]
  },
  ice_cream_shop: {
    name: "Heladería fresca",
    description: "Azul brillante y coral para sabores, novedades y pedidos ligeros.",
    primary: "#087EA4",
    secondary: "#F45B69",
    colors: ["#087EA4", "#F45B69", "#F4FBFF", "#1D1D1F"]
  },
  catering: {
    name: "Eventos y catering",
    description: "Turquesa oscuro y dorado para propuestas, agenda y entregas programadas.",
    primary: "#0F766E",
    secondary: "#C9952E",
    colors: ["#0F766E", "#C9952E", "#F7F9F8", "#1F2937"]
  },
  other_gastronomic: {
    name: "Gastronomía flexible",
    description: "Azul confiable y coral para adaptar SIMI a distintos conceptos.",
    primary: "#2463EB",
    secondary: "#F06449",
    colors: ["#2463EB", "#F06449", "#F5F7FB", "#1D1D1F"]
  }
};

export function BrandColorPicker({ initialPrimary, initialSecondary, initialUseSecondary, businessType = "restaurant", businessName = "Tu negocio" }: BrandColorPickerProps) {
  const [primaryColor, setPrimaryColor] = useState(initialPrimary);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondary);
  const [useSecondaryColor, setUseSecondaryColor] = useState(initialUseSecondary);
  const palettes = useMemo(() => [paletteByBusinessType[businessType], ...universalPalettes], [businessType]);

  function applyPalette(palette: Palette) {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setUseSecondaryColor(true);
  }

  const previewBackground = useSecondaryColor
    ? `linear-gradient(120deg, ${primaryColor}, ${secondaryColor})`
    : primaryColor;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {palettes.map((palette) => {
          const isSelected = primaryColor.toLowerCase() === palette.primary.toLowerCase() && useSecondaryColor && secondaryColor.toLowerCase() === palette.secondary.toLowerCase();
          return (
            <button
              key={palette.name}
              type="button"
              onClick={() => applyPalette(palette)}
              className={`focus-ring grid gap-3 rounded-[var(--radius-card)] border bg-[var(--surface-muted)] p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:shadow-panel ${isSelected ? "border-[var(--accent)] shadow-panel" : "border-[var(--line)]"}`}
              aria-pressed={isSelected}
            >
              <span className="text-sm font-medium text-[var(--text)]">{palette.name}</span>
              <span className="text-xs leading-5 text-[var(--text-muted)]">{palette.description}</span>
              <span className="flex gap-1.5" aria-hidden="true">
                {palette.colors.map((color) => (
                  <span key={color} className="h-7 flex-1 rounded-[8px] border border-black/10" style={{ backgroundColor: color }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="grid gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--text)]">Color principal</span>
            <input className="focus-ring h-11 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-2" name="primary_color" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
            <span className="text-xs text-[var(--text-muted)]">{primaryColor.toUpperCase()}</span>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium text-[var(--text)]">Segundo color opcional</span>
            <div className="flex items-center gap-3 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
              <input type="checkbox" name="use_secondary_color" checked={useSecondaryColor} onChange={(event) => setUseSecondaryColor(event.target.checked)} />
              <input className="focus-ring h-8 flex-1 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-1" name="secondary_color" type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
            </div>
            <span className="text-xs text-[var(--text-muted)]">{useSecondaryColor ? secondaryColor.toUpperCase() : "Sin segundo color"}</span>
          </label>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-panel">
          <div className="p-5 text-white" style={{ background: previewBackground }}>
            <p className="text-xs text-white/75">Vista rápida de la carta</p>
            <h3 className="mt-2 text-xl font-medium">{businessName}</h3>
            <p className="mt-1 text-sm text-white/82">Carta digital · Pedidos · Reservas</p>
          </div>
          <div className="grid gap-3 p-4">
            <div className="h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
            <div className="h-3 w-full rounded-full bg-[var(--surface-muted)]" />
            <button type="button" className="min-h-10 rounded-full px-4 text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>Agregar al pedido</button>
          </div>
        </div>
      </div>
    </div>
  );
}
