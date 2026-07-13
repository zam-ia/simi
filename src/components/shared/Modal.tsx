"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  contentClassName?: string;
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl"
};

export function Modal({ title, description, isOpen, onClose, children, size = "md", contentClassName }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/48 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="simi-modal-title"
        className={cn("flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--surface)] shadow-soft", sizes[size])}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--line)] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 id="simi-modal-title" className="text-lg font-medium text-[var(--text)]">{title}</h2>
            {description ? <p className="mt-1 text-sm leading-5 text-[var(--text-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className={cn("min-h-0 overflow-y-auto p-4 sm:p-5", contentClassName)}>{children}</div>
      </section>
    </div>
  );
}
