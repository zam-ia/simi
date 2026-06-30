import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--text)]">{label}</span>
      <textarea
        className={cn(
          "focus-ring min-h-24 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] shadow-[0_1px_0_rgba(0,0,0,0.02)] placeholder:text-[var(--text-muted)]",
          className
        )}
        {...props}
      />
    </label>
  );
}
