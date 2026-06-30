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
    <div className="sticky top-0 z-30 -mx-4 border-b border-[var(--line)] bg-[var(--background)]/92 px-4 py-3 backdrop-blur-xl sm:-mx-5 sm:px-5 lg:mx-0 lg:rounded-[var(--radius-panel)] lg:border lg:px-3">
      <nav className="mx-auto flex max-w-[1320px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Categorias del menu">
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
