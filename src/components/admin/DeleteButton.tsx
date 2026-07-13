"use client";

import { Trash2 } from "lucide-react";

type DeleteButtonProps = {
  label?: string;
  message: string;
};

export function DeleteButton({ label = "Eliminar", message }: DeleteButtonProps) {
  return (
    <button
      className="focus-ring inline-flex min-h-9 items-center justify-center rounded-[var(--radius-input)] border border-red-200 px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/35"
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
