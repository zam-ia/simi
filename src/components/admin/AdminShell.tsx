"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { signOutAction } from "@/lib/actions";
import { Button, LinkButton } from "@/components/shared/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

export type AdminShellItem = {
  label: string;
  href: string;
  icon: string;
  isExact?: boolean;
};

type AdminShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  userEmail: string;
  items: AdminShellItem[];
  primaryAction?: {
    label: string;
    href: string;
  };
};

export function AdminShell({ children, title, subtitle, userEmail, items, primaryAction }: AdminShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeLabel = useMemo(() => items.find((item) => isActive(pathname, item))?.label || "Panel", [items, pathname]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {isMobileOpen ? <button type="button" aria-label="Cerrar menu" className="fixed inset-0 z-40 bg-black/28 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileOpen(false)} /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--line)] bg-[var(--surface)]/92 px-3 py-4 shadow-panel backdrop-blur-xl transition-all duration-300 ease-out lg:translate-x-0",
          isCollapsed ? "lg:w-[88px]" : "lg:w-[280px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <Link href="/admin" className="flex min-w-0 items-center gap-3" onClick={() => setIsMobileOpen(false)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[var(--accent)] text-base font-medium text-white shadow-panel">S</span>
            <span className={cn("min-w-0 transition-opacity duration-200", isCollapsed ? "lg:hidden" : "")}>
              <span className="block text-sm font-medium text-[var(--text)]">SIMI</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">{title}</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            className="focus-ring hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text)] transition-transform duration-200 ease-out lg:inline-flex"
            aria-label={isCollapsed ? "Desplegar menu" : "Contraer menu"}
            title={isCollapsed ? "Desplegar menu" : "Contraer menu"}
          >
            <ChevronIcon className={cn("h-4 w-4 transition-transform duration-300 ease-out", isCollapsed ? "rotate-180" : "")} />
          </button>
        </div>

        <nav className="mt-6 grid gap-1">
          {items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "focus-ring group flex min-h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-medium transition-all duration-200 ease-out",
                  active ? "bg-[var(--text)] text-[var(--surface)] shadow-panel" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]",
                  isCollapsed ? "lg:justify-center lg:px-0" : ""
                )}
                title={item.label}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[12px] bg-black/[0.05] text-base dark:bg-white/[0.08]">{item.icon}</span>
                <span className={cn("truncate", isCollapsed ? "lg:hidden" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3 border-t border-[var(--line)] px-2 pt-4">
          <div className={cn("grid gap-1", isCollapsed ? "lg:hidden" : "")}>
            <span className="truncate text-xs text-[var(--text-muted)]">{userEmail}</span>
            {subtitle ? <span className="truncate text-xs font-medium text-[var(--text)]">{subtitle}</span> : null}
          </div>
          <div className={cn("grid gap-2", isCollapsed ? "lg:place-items-center" : "")}>
            <ThemeToggle compact={isCollapsed} />
            {primaryAction ? (
              <LinkButton href={primaryAction.href} className={cn("w-full", isCollapsed ? "lg:hidden" : "")}>
                {primaryAction.label}
              </LinkButton>
            ) : null}
            <form action={signOutAction} className="w-full">
              <Button type="submit" variant="secondary" className={cn("w-full", isCollapsed ? "lg:h-10 lg:w-10 lg:px-0" : "")} title="Salir">
                <span className={cn(isCollapsed ? "lg:hidden" : "")}>Salir</span>
                <span className={cn("hidden text-base", isCollapsed ? "lg:inline" : "")}>↗</span>
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className={cn("min-h-screen transition-[padding] duration-300 ease-out", isCollapsed ? "lg:pl-[88px]" : "lg:pl-[280px]")}>
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--background)]/82 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-8">
            <button type="button" className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text)] lg:hidden" onClick={() => setIsMobileOpen(true)} aria-label="Abrir menu">
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-xs text-[var(--text-muted)]">{activeLabel}</p>
              <h1 className="truncate text-lg font-medium text-[var(--text)]">{title}</h1>
            </div>
            <div className="hidden sm:block">
              <ThemeToggle compact />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function isActive(pathname: string, item: AdminShellItem) {
  if (item.isExact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
