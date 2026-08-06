"use client";

import type { SavedJobsSort } from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { SAVED_JOBS_SORT_OPTIONS } from "./saved-jobs-utils";

type SavedJobsSortSelectProps = {
  value: SavedJobsSort;
  onChange: (value: SavedJobsSort) => void;
};

export function SavedJobsSortSelect({
  value,
  onChange,
}: SavedJobsSortSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selected =
    SAVED_JOBS_SORT_OPTIONS.find((option) => option.value === value) ??
    SAVED_JOBS_SORT_OPTIONS[0]!;

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
    <div ref={rootRef} className="relative inline-flex items-center gap-2 text-sm text-muted">
      <span className="hidden shrink-0 font-medium sm:inline">Sort by:</span>
      <div className="relative">
        <button
          type="button"
          id="saved-jobs-sort"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-label={`Sort saved jobs: ${selected.label}`}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "inline-flex h-10 min-w-[11rem] items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-left text-sm font-semibold text-foreground shadow-sm",
            "outline-none transition-colors hover:border-primary/30",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            isOpen && "border-primary ring-2 ring-primary/20",
          )}
        >
          <span className="truncate">{selected.label}</span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform",
              isOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {isOpen ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Sort options"
            className="absolute top-[calc(100%+0.35rem)] right-0 z-40 min-w-full overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_8px_24px_rgba(26,43,60,0.12)]"
          >
            {SAVED_JOBS_SORT_OPTIONS.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                      isSelected
                        ? "bg-primary-light font-semibold text-primary"
                        : "font-medium text-foreground hover:bg-primary-light/50",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
