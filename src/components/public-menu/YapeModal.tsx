"use client";

import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";

type YapeModalProps = {
  yapeNumber?: string | null;
  yapeQrUrl?: string | null;
};

export function YapeModal({ yapeNumber, yapeQrUrl }: YapeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    if (!yapeNumber) return;
    await navigator.clipboard.writeText(yapeNumber);
    setCopied(true);
  }

  return (
    <>
      <button className="min-h-12 flex-1 rounded-full bg-[#6C2FD9] px-4 text-[15px] font-medium text-white shadow-panel" type="button" onClick={() => setIsOpen(true)}>
        Pagar con Yape
      </button>
      <Modal title="Paga con Yape" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {yapeNumber || yapeQrUrl ? (
          <div className="grid justify-items-center gap-4">
            {yapeQrUrl ? <img alt="QR de Yape" src={yapeQrUrl} className="max-h-72 rounded-[20px] border border-[var(--line)] bg-white object-contain p-2 shadow-panel" /> : null}
            {yapeNumber ? <p className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-lg font-medium">{yapeNumber}</p> : null}
            {yapeNumber ? (
              <Button type="button" variant="secondary" onClick={copyNumber}>
                {copied ? "Número copiado" : "Copiar número Yape"}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Este negocio aún no tiene Yape registrado.</p>
        )}
      </Modal>
    </>
  );
}
