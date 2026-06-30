"use client";

import { useState } from "react";

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
};

const palettes: Palette[] = [
  {
    name: "Fuego directo",
    description: "Mas intensa para pollerias con comunicacion de ofertas y sabor.",
    primary: "#C62828",
    secondary: "#FFC107",
    colors: ["#C62828", "#FFC107", "#1F1F1F", "#FFFFFF"]
  },
  {
    name: "Brasa moderna",
    description: "Rojo vivo con acento naranja para una carta mas energetica.",
    primary: "#F4431F",
    secondary: "#C62828",
    colors: ["#F4431F", "#C62828", "#1F1F1F", "#FFFFFF"]
  },
  {
    name: "Premium familiar",
    description: "Negro como estructura y rojo como acento para verse mas solido.",
    primary: "#1F1F1F",
    secondary: "#C62828",
    colors: ["#1F1F1F", "#C62828", "#FFC107", "#FFFFFF"]
  }
];

export function BrandColorPicker({ initialPrimary, initialSecondary, initialUseSecondary }: BrandColorPickerProps) {
  const [primaryColor, setPrimaryColor] = useState(initialPrimary);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondary);
  const [useSecondaryColor, setUseSecondaryColor] = useState(initialUseSecondary);

  function applyPalette(palette: Palette) {
    setPrimaryColor(palette.primary);
    setSecondaryColor(palette.secondary);
    setUseSecondaryColor(true);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 lg:grid-cols-3">
        {palettes.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => applyPalette(palette)}
            className="focus-ring grid gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-muted)] p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:shadow-panel"
          >
            <span className="text-sm font-medium text-[var(--text)]">{palette.name}</span>
            <span className="text-xs leading-5 text-[var(--text-muted)]">{palette.description}</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {palette.colors.map((color) => (
                <span key={color} className="h-7 flex-1 rounded-[8px] border border-black/10" style={{ backgroundColor: color }} />
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--text)]">Color principal</span>
          <input
            className="focus-ring h-11 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-2"
            name="primary_color"
            type="color"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--text)]">Segundo color opcional</span>
          <div className="flex items-center gap-3 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <input type="checkbox" name="use_secondary_color" checked={useSecondaryColor} onChange={(event) => setUseSecondaryColor(event.target.checked)} />
            <input
              className="focus-ring h-8 flex-1 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-1"
              name="secondary_color"
              type="color"
              value={secondaryColor}
              onChange={(event) => setSecondaryColor(event.target.value)}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
