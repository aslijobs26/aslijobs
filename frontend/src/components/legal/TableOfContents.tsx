"use client";

import { cn } from "@/utils/cn";
import type { MouseEvent } from "react";

export type TableOfContentsItem = {
  id: string;
  label: string;
};

type TableOfContentsProps = {
  items: TableOfContentsItem[];
  activeId: string;
  onItemSelect?: (id: string) => void;
  onNavigate?: () => void;
  className?: string;
};

const SCROLL_OFFSET_PX = 140;

export function TableOfContents({
  items,
  activeId,
  onItemSelect,
  onNavigate,
  className,
}: TableOfContentsProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    onItemSelect?.(id);

    const top = Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX,
    );

    window.scrollTo({ top, behavior: "smooth" });
    window.history.replaceState(null, "", `#${id}`);
    onNavigate?.();
  };

  return (
    <nav aria-label="Terms and Conditions sections" className={className}>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = item.id === activeId;

          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => handleClick(event, item.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "border-primary bg-primary-light/80 text-primary"
                    : "border-transparent text-muted hover:bg-primary-light/40 hover:text-primary",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
