"use client";

import { useState } from "react";

type Device = "mobile" | "tablet" | "desktop";

type MenuPreviewProps = {
  url: string;
};

const devices: Record<Device, { label: string; width: string; height: string }> = {
  mobile: { label: "Móvil", width: "390px", height: "680px" },
  tablet: { label: "Tablet", width: "640px", height: "760px" },
  desktop: { label: "Escritorio", width: "100%", height: "760px" }
};

export function MenuPreview({ url }: MenuPreviewProps) {
  const [device, setDevice] = useState<Device>("mobile");
  const currentDevice = devices[device];

  return (
    <section className="grid gap-4 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Vista previa</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Revisa cómo verá la carta el comensal antes de compartir el QR.</p>
        </div>
        <div className="flex rounded-full bg-[var(--surface-muted)] p-1">
          {(Object.keys(devices) as Device[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${device === key ? "bg-[var(--surface)] text-[var(--text)] shadow-panel" : "text-[var(--text-muted)]"}`}
            >
              {devices[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-[24px] bg-[var(--surface-muted)] p-4">
        <div className="mx-auto overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--background)] shadow-soft" style={{ width: currentDevice.width, maxWidth: "100%", height: currentDevice.height }}>
          <iframe title="Vista previa del menú" src={url} className="h-full w-full border-0" />
        </div>
      </div>
    </section>
  );
}
