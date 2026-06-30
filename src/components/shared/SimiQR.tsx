"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/shared/Button";
import { buildMenuQrFileName } from "@/lib/qr";

type SimiQRProps = {
  url: string;
  logoUrl?: string | null;
  size?: number;
  slug?: string;
};

export function SimiQR({ url, logoUrl, size = 256, slug = "menu" }: SimiQRProps) {
  const canvasId = `simi-qr-${slug.replace(/[^a-z0-9-]/gi, "-")}`;

  function downloadQr() {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = buildMenuQrFileName(slug);
    link.click();
  }

  return (
    <div className="grid justify-items-center gap-4">
      <div className="relative rounded-[var(--radius-card)] bg-white p-4 shadow-panel">
        <QRCodeCanvas id={canvasId} value={url} size={size} includeMargin level="H" />
        {logoUrl ? (
          <img
            alt=""
            src={logoUrl}
            className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-xl border-4 border-white bg-white object-cover"
          />
        ) : null}
      </div>
      <Button type="button" onClick={downloadQr}>
        Descargar QR
      </Button>
    </div>
  );
}
