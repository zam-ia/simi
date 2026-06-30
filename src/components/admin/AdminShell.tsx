"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { AdminRealtimeAlerts } from "@/components/admin/AdminRealtimeAlerts";
import { Button, LinkButton } from "@/components/shared/Button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { signOutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

export type AdminShellItem = {
  label: string;
  href: string;
  icon: AdminShellIconName;
  isExact?: boolean;
};

export type AdminShellIconName = "home" | "menu" | "kitchen" | "orders" | "delivery" | "promotions" | "reservations" | "payments" | "settings" | "users";

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
  alertClientId?: string;
};

export function AdminShell({ children, title, subtitle, userEmail, items, primaryAction, alertClientId }: AdminShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeLabel = useMemo(() => items.find((item) => isActive(pathname, item))?.label || "Panel", [items, pathname]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <AdminRealtimeAlerts clientId={alertClientId} />
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
            className="focus-ring hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-muted)] text-[var(--text)] transition-all duration-200 ease-out hover:bg-[var(--surface)] hover:shadow-panel lg:inline-flex"
            aria-label={isCollapsed ? "Desplegar menu" : "Contraer menu"}
            title={isCollapsed ? "Desplegar menu" : "Contraer menu"}
          >
            <SidebarToggleIcon collapsed={isCollapsed} className="h-5 w-5" />
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
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[12px] transition-colors duration-200 ease-out", active ? "bg-white/18 text-white" : "bg-black/[0.06] text-[var(--text)] dark:bg-white/[0.1]")}>
                  <AdminShellIcon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <span className={cn("truncate", isCollapsed ? "lg:hidden" : "")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3 border-t border-[var(--line)] px-2 pt-4">
          <div className={cn("flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-muted)] p-2", isCollapsed ? "lg:justify-center" : "")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-sm font-medium text-[var(--text)] shadow-panel">{userEmail.slice(0, 1).toUpperCase()}</span>
            <div className={cn("min-w-0 flex-1", isCollapsed ? "lg:hidden" : "")}>
              <span className="block truncate text-xs text-[var(--text-muted)]">{userEmail}</span>
              {subtitle ? <span className="block truncate text-xs font-medium text-[var(--text)]">{subtitle}</span> : null}
            </div>
            <form action={signOutAction} className={cn(isCollapsed ? "lg:hidden" : "")}>
              <button type="submit" className="focus-ring grid h-9 w-9 place-items-center rounded-full text-[var(--text-muted)] transition-colors duration-200 ease-out hover:bg-[var(--surface)] hover:text-[var(--text)]" title="Cerrar sesion" aria-label="Cerrar sesion">
                <LogoutIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
          <div className={cn("grid gap-2", isCollapsed ? "lg:place-items-center" : "")}>
            {primaryAction ? (
              <LinkButton href={primaryAction.href} className={cn("w-full", isCollapsed ? "lg:hidden" : "")}>
                {primaryAction.label}
              </LinkButton>
            ) : null}
            <form action={signOutAction} className={cn("w-full", isCollapsed ? "hidden lg:block" : "hidden")}>
              <Button type="submit" variant="secondary" className="lg:h-10 lg:w-10 lg:px-0" title="Cerrar sesion" aria-label="Cerrar sesion">
                <LogoutIcon className="h-[18px] w-[18px]" />
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

function AdminShellIcon({ name, className }: { name: AdminShellIconName; className?: string }) {
  const paths: Record<AdminShellIconName, ReactNode> = {
    home: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </>
    ),
    menu: (
      <>
        <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12.5H8.5A3.5 3.5 0 0 1 5 17V4.5Z" />
        <path d="M8.5 8H15" />
        <path d="M8.5 12H15" />
        <path d="M8.5 16H13" />
      </>
    ),
    kitchen: (
      <>
        <path d="M6 12h12v8H6z" />
        <path d="M8 12V9a4 4 0 0 1 8 0v3" />
        <path d="M9 16h6" />
      </>
    ),
    orders: (
      <>
        <path d="M7 3.5h10v17l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2v-17Z" />
        <path d="M10 8h5" />
        <path d="M10 12h5" />
        <path d="M10 16h3" />
      </>
    ),
    delivery: (
      <>
        <path d="M4 7h10v9H4z" />
        <path d="M14 10h3l3 3v3h-6" />
        <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </>
    ),
    promotions: (
      <>
        <path d="M20 12V7.5A3.5 3.5 0 0 0 16.5 4H12" />
        <path d="M4 12v4.5A3.5 3.5 0 0 0 7.5 20H12" />
        <path d="m8 8 8 8" />
        <path d="M8.5 9.5h.01" />
        <path d="M15.5 14.5h.01" />
      </>
    ),
    reservations: (
      <>
        <path d="M7 4v3" />
        <path d="M17 4v3" />
        <path d="M5 6h14v14H5z" />
        <path d="M5 10h14" />
        <path d="m9 15 2 2 4-4" />
      </>
    ),
    payments: (
      <>
        <path d="M4 7h16v10H4z" />
        <path d="M4 10h16" />
        <path d="M8 14h3" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14 3h-4l-.5 2.7a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2L10 21h4l.5-2.7a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" />
      </>
    ),
    users: (
      <>
        <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M17 10.5a2.7 2.7 0 1 0 0-5.4" />
        <path d="M18 20a4.6 4.6 0 0 0-3-4.3" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </g>
    </svg>
  );
}

function SidebarToggleIcon({ collapsed, className }: { collapsed: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path className="transition-transform duration-200 ease-out" style={{ transform: collapsed ? "translateX(3px)" : "translateX(-3px)", transformOrigin: "center" }} d={collapsed ? "M15 9l3 3-3 3" : "M9 9l-3 3 3 3"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M10 6H6.5A2.5 2.5 0 0 0 4 8.5v7A2.5 2.5 0 0 0 6.5 18H10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8l4 4-4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
