"use client";

import {
  APPLIED_JOBS_SORT_OPTIONS,
  type AppliedJobsSort,
} from "@/components/job-seeker-applications/applied-jobs-utils";
import { cn } from "@/utils/cn";
import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type AppliedJobsSortSelectProps = {
  value: AppliedJobsSort;
  onChange: (value: AppliedJobsSort) => void;
};

export function AppliedJobsSortSelect({
  value,
  onChange,
}: AppliedJobsSortSelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selected =
    APPLIED_JOBS_SORT_OPTIONS.find((option) => option.value === value) ??
    APPLIED_JOBS_SORT_OPTIONS[0]!;

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
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        id="my-applications-sort"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`Sort applications: ${selected.label}`}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "inline-flex h-11 min-w-[12.5rem] items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-left text-sm shadow-sm",
          "outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/25 hover:bg-primary-light/20",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/20",
        )}
      >
        <ArrowUpDown
          className="size-4 shrink-0 text-muted"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-muted">Sort: </span>
          <span className="font-semibold text-foreground">{selected.label}</span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            isOpen && "rotate-180",
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
          className="absolute top-[calc(100%+0.4rem)] right-0 z-40 w-full min-w-[14rem] overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)]"
        >
          {APPLIED_JOBS_SORT_OPTIONS.map((option) => {
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
  );
}
