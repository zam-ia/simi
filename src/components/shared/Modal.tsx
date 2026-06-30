"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Cerrar modal">
            Cerrar
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
