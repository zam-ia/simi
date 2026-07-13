"use client";

import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { SimiQR } from "@/components/shared/SimiQR";

type QRModalProps = {
  url: string;
  slug: string;
  logoUrl?: string | null;
};

export function QRModal({ url, slug, logoUrl }: QRModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
        <QrCode className="h-4 w-4" aria-hidden="true" />
        QR
      </Button>
      <Modal title="QR del menú" description="Descarga o copia el enlace listo para compartir." isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="grid gap-4">
          <SimiQR url={url} slug={slug} logoUrl={logoUrl} />
          <div className="rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-muted)] break-all">{url}</div>
          <Button type="button" variant="secondary" onClick={copyUrl}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
