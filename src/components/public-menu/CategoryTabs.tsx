"use client";

import { useEffect, useState } from "react";
import type { CategoryWithItems } from "@/types/menu";

type CategoryTabsProps = {
  categories: CategoryWithItems[];
  accentColor: string;
};

export function CategoryTabs({ categories, accentColor }: CategoryTabsProps) {
  const [activeId, setActiveId] = useState(categories[0]?.id || "");

  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry) setActiveId(visibleEntry.target.id);
      },
      {
        rootMargin: "-118px 0px -58% 0px",
        threshold: [0.12, 0.35, 0.6]
      }
    );

    categories.forEach((category) => {
      const element = document.getElementById(category.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  if (categories.length === 0) return null;

  return (
    <div className="sticky top-0 z-30 min-w-0 max-w-full overflow-hidden border-b border-[var(--line)] bg-[var(--background)]/88 py-3 backdrop-blur-xl lg:rounded-[24px] lg:border lg:border-white/70 lg:bg-[var(--surface)]/88 lg:px-3 lg:shadow-panel">
      <nav className="flex min-w-0 max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:px-0" aria-label="Categorias del menu">
        {categories.map((category) => {
          const isActive = category.id === activeId;

          return (
            <a
              key={category.id}
              href={`#${category.id}`}
              onClick={() => setActiveId(category.id)}
              className="focus-ring shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-panel transition"
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      color: "#fff",
                      boxShadow: "0 8px 22px rgba(0, 0, 0, 0.12)"
                    }
                  : undefined
              }
            >
              {category.name}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
