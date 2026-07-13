import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-[var(--text)]">{label}</span>
      <input
        className={cn(
          "focus-ring min-h-10 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 text-[var(--text)] shadow-[0_1px_0_rgba(0,0,0,0.02)] placeholder:text-[var(--text-muted)]",
          className
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-[var(--text-muted)]">{hint}</span> : null}
    </label>
  );
}
