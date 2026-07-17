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

const SCROLL_OFFSET_PX = 128;
const MOBILE_SCROLL_OFFSET_PX = 96;

function isMobileViewport() {
  return window.matchMedia("(max-width: 1023px)").matches;
}

function scrollToSection(id: string, offsetPx: number) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  const top = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - offsetPx,
  );

  window.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
}

export function TableOfContents({
  items,
  activeId,
  onItemSelect,
  onNavigate,
  className,
}: TableOfContentsProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();

    if (!document.getElementById(id)) {
      return;
    }

    // Activate first so only this section is highlighted during navigation.
    onItemSelect?.(id);

    const isMobileAccordion = Boolean(onNavigate) && isMobileViewport();

    if (isMobileAccordion) {
      // Close accordion first — its height shifts section positions.
      onNavigate?.();

      window.setTimeout(() => {
        scrollToSection(id, MOBILE_SCROLL_OFFSET_PX);
      }, 50);
      return;
    }

    scrollToSection(id, SCROLL_OFFSET_PX);
    onNavigate?.();
  };

  return (
    <nav aria-label="On this page sections" className={className}>
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
                  "block rounded-lg border-l-[3px] px-3 py-2.5 text-xs font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:text-sm",
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
