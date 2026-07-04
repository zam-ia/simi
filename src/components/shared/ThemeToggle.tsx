"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const currentTheme = (document.documentElement.dataset.theme as Theme | undefined) || "light";
    setTheme(currentTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("simi-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`focus-ring group inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-medium text-[var(--text)] shadow-panel transition-all duration-200 ease-out hover:bg-[var(--surface-muted)] active:scale-[0.97] ${compact ? "w-10 px-0" : "px-3"}`}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <span className="relative grid h-5 w-5 place-items-center overflow-hidden">
        <SunIcon className={`absolute h-5 w-5 text-amber-500 transition-all duration-300 ease-out ${theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />
        <MoonIcon className={`absolute h-5 w-5 text-sky-500 transition-all duration-300 ease-out ${theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`} />
      </span>
      <span className={compact ? "hidden" : ""}>{theme === "dark" ? "Claro" : "Oscuro"}</span>
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.64 5.64 4.22 4.22M19.78 19.78l-1.42-1.42M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20.2 14.8A7.7 7.7 0 0 1 9.2 3.8 8.7 8.7 0 1 0 20.2 14.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
