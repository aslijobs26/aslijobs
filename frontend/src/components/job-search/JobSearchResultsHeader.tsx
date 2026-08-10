"use client";

import { JOB_SEARCH_SORT_OPTIONS } from "@/constants/job-search";
import type { PublicJobSort } from "@/services/public-jobs.service";
import { cn } from "@/utils/cn";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type JobSearchResultsHeaderProps = {
  total: number;
  locationLabel: string;
  sort: PublicJobSort;
  onSortChange: (sort: PublicJobSort) => void;
};

export function JobSearchResultsHeader({
  total,
  locationLabel,
  sort,
  onSortChange,
}: JobSearchResultsHeaderProps) {
  const listboxId = useId();
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const formattedTotal = total.toLocaleString("en-IN");
  const title = locationLabel
    ? `${formattedTotal} jobs found in ${locationLabel}`
    : `${formattedTotal} jobs found`;

  const selected =
    JOB_SEARCH_SORT_OPTIONS.find((option) => option.value === sort) ??
    JOB_SEARCH_SORT_OPTIONS[0]!;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-sm font-bold text-foreground sm:text-lg">{title}</h2>

      <div
        ref={rootRef}
        className="hidden shrink-0 items-center gap-2.5 md:inline-flex"
      >
        <span
          id={labelId}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted"
        >
          <ArrowUpDown
            className="size-4 shrink-0 text-primary"
            strokeWidth={2.25}
            aria-hidden="true"
          />
          Sort
        </span>

        <div className="relative min-w-[10.5rem]">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-labelledby={labelId}
            aria-label={`Sort jobs: ${selected.label}`}
            onClick={() => setIsOpen((current) => !current)}
            className={cn(
              "inline-flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-surface px-3 py-2 text-left text-sm font-semibold shadow-sm",
              "outline-none transition-[border-color,background-color,box-shadow]",
              "hover:border-primary/25 hover:bg-primary-light/30",
              "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
              isOpen
                ? "border-primary text-primary ring-2 ring-primary/20"
                : "border-border text-foreground",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{selected.label}</span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted transition-transform",
                isOpen && "rotate-180 text-primary",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {isOpen ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Sort options"
              className="absolute top-[calc(100%+0.4rem)] left-0 z-40 w-full overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)]"
            >
              {JOB_SEARCH_SORT_OPTIONS.map((option) => {
                const isSelected = option.value === sort;
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                        isSelected
                          ? "bg-primary-light font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-primary-light/50",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? (
                        <Check
                          className="size-4 shrink-0 text-primary"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
