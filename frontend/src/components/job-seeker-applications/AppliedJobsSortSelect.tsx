"use client";

import {
  APPLIED_JOBS_SORT_OPTIONS,
  type AppliedJobsSort,
} from "@/components/job-seeker-applications/applied-jobs-utils";
import { useTranslate } from "@/i18n/translate";
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
  const t = useTranslate();
  const listboxId = useId();
  const labelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selected =
    APPLIED_JOBS_SORT_OPTIONS.find((option) => option.value === value) ??
    APPLIED_JOBS_SORT_OPTIONS[0]!;
  const selectedLabel = t(selected.labelKey);

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
    <div
      ref={rootRef}
      className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2.5"
    >
      <span
        id={labelId}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted sm:gap-1.5 sm:text-sm"
      >
        <ArrowUpDown
          className="size-3.5 shrink-0 text-primary sm:size-4"
          strokeWidth={2.25}
          aria-hidden="true"
        />
        {t("seeker.applications.sortLabel")}
      </span>

      <div className="relative min-w-[9.5rem] sm:min-w-[11rem]">
        <button
          type="button"
          id="my-applications-sort"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-labelledby={labelId}
          aria-label={t("seeker.applications.sortAria", { label: selectedLabel })}
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border bg-surface px-2.5 text-left text-xs font-semibold shadow-sm sm:h-11 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm",
            "outline-none transition-[border-color,background-color,box-shadow]",
            "hover:border-primary/25 hover:bg-primary-light/30",
            "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            isOpen
              ? "border-primary text-primary ring-2 ring-primary/20"
              : "border-border text-foreground",
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selectedLabel}</span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-muted transition-transform sm:size-4",
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
            aria-label={t("seeker.common.sortOptions")}
            className="absolute top-[calc(100%+0.4rem)] left-0 z-40 w-full overflow-hidden rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)]"
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
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors sm:px-3.5 sm:py-2.5 sm:text-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                      isSelected
                        ? "bg-primary-light font-semibold text-primary"
                        : "font-medium text-foreground hover:bg-primary-light/50",
                    )}
                  >
                    <span className="truncate">{t(option.labelKey)}</span>
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
  );
}
