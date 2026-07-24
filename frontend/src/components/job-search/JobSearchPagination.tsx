"use client";

import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type JobSearchPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function buildPageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: (number | "…")[] = [1];

  if (page > 3) {
    items.push("…");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (page < totalPages - 2) {
    items.push("…");
  }

  items.push(totalPages);
  return items;
}

export function JobSearchPagination({
  page,
  totalPages,
  onPageChange,
}: JobSearchPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = buildPageItems(page, totalPages);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Job results pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {items.map((item, index) =>
        item === "…" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex size-9 items-center justify-center text-sm text-muted"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              item === page
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground hover:border-primary/40",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="Next page"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
