"use client";

import { JobsFilterPanel } from "@/components/employer-jobs/JobsFilterPanel";
import type { EmployerJobsFiltersState } from "@/components/employer-jobs/jobs-filters";
import type { EmployerJobListOption } from "@/types/employer-jobs";
import { cn } from "@/utils/cn";
import { useEffect, useId, useRef } from "react";

type JobsFiltersShellProps = {
  open: boolean;
  filters: EmployerJobsFiltersState;
  jobOptions: EmployerJobListOption[];
  onClose: () => void;
  onApply: (next: EmployerJobsFiltersState) => void;
  onClear: () => void;
};

export function JobsFiltersShell({
  open,
  filters,
  jobOptions,
  onClose,
  onApply,
  onClear,
}: JobsFiltersShellProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 20);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Close filters"
        className="absolute inset-0 bg-foreground/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "absolute flex min-h-0 flex-col overflow-hidden bg-surface outline-none",
          // Mobile: bottom sheet capped to viewport
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border border-border-subtle shadow-[0_-12px_40px_rgba(15,23,42,0.16)]",
          // Tablet / desktop: full-height right drawer (top+bottom pinned)
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:h-dvh md:w-[min(22.5rem,92vw)] md:rounded-none md:border-y-0 md:border-r-0 md:border-l md:shadow-[-12px_0_40px_rgba(15,23,42,0.12)]",
        )}
      >
        <span id={titleId} className="sr-only">
          Job filters
        </span>
        <JobsFilterPanel
          key={JSON.stringify(filters)}
          filters={filters}
          jobOptions={jobOptions}
          onApply={(next) => {
            onApply(next);
            onClose();
          }}
          onClear={() => {
            onClear();
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
