"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  TableOfContents,
  type TableOfContentsItem,
} from "./TableOfContents";

type LegalSidebarProps = {
  items: TableOfContentsItem[];
  activeId: string;
  onItemSelect: (id: string) => void;
};

export function LegalSidebar({
  items,
  activeId,
  onItemSelect,
}: LegalSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeLabel =
    items.find((item) => item.id === activeId)?.label ?? "On this page";

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-transparent px-4 py-3 text-left transition-colors hover:bg-primary-light/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-expanded={isOpen}
          aria-controls="legal-toc-mobile"
          onClick={() => setIsOpen((previous) => !previous)}
        >
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-muted">
              On this page
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-foreground md:text-sm">
              {activeLabel}
            </span>
          </span>
          <ChevronDown
            className={`size-5 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <div id="legal-toc-mobile" className="mt-3 bg-transparent py-1">
            <TableOfContents
              items={items}
              activeId={activeId}
              onItemSelect={onItemSelect}
              onNavigate={() => setIsOpen(false)}
            />
          </div>
        ) : null}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-28 bg-transparent pr-2">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
            On this page
          </p>
          <TableOfContents
            items={items}
            activeId={activeId}
            onItemSelect={onItemSelect}
          />
        </div>
      </aside>
    </>
  );
}
