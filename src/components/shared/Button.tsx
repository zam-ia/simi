import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "border-transparent simi-gradient text-white shadow-panel hover:opacity-90",
  secondary: "border-transparent bg-black/[0.07] text-[var(--text)] hover:bg-black/[0.1] dark:bg-white/[0.12] dark:hover:bg-white/[0.16]",
  ghost: "border-transparent bg-transparent text-[var(--text)] hover:bg-[var(--surface-muted)]",
  danger: "border-transparent bg-red-600 text-white hover:bg-red-700"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({ className, variant = "primary", href, ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium",
        variants[variant],
        className
      )}
      href={href}
      {...props}
    />
  );
}
