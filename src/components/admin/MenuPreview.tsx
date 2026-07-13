"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";

type Device = "mobile" | "tablet" | "desktop";

type MenuPreviewProps = {
  url: string;
};

const devices: Record<Device, { label: string; width: string; height: string }> = {
  mobile: { label: "Movil", width: "390px", height: "620px" },
  tablet: { label: "Tablet", width: "640px", height: "680px" },
  desktop: { label: "Escritorio", width: "100%", height: "680px" }
};

export function MenuPreview({ url }: MenuPreviewProps) {
  const [device, setDevice] = useState<Device>("mobile");
  const [refreshKey, setRefreshKey] = useState(() => Date.now());
  const currentDevice = devices[device];
  const previewUrl = useMemo(() => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}preview=${refreshKey}`;
  }, [refreshKey, url]);

  return (
    <section className="grid min-w-0 gap-3 rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium">Vista previa</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Se refresca contra la carta publica guardada. Si acabas de subir una imagen, primero guarda cambios.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button type="button" variant="secondary" onClick={() => setRefreshKey(Date.now())}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-[var(--radius-panel)] bg-[var(--surface-muted)] p-3">
        <div className="mx-auto overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--background)] shadow-soft" style={{ width: currentDevice.width, maxWidth: "100%", height: currentDevice.height }}>
          <iframe key={`${device}-${refreshKey}`} title="Vista previa del menu" src={previewUrl} className="h-full w-full border-0" />
        </div>
      </div>
    </section>
  );
}
