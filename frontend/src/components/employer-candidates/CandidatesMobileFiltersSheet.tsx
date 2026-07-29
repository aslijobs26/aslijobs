"use client";

import {
  CandidatesFilterPanel,
  type CandidatesQuickFilter,
} from "@/components/employer-candidates/CandidatesFilterPanel";
import type {
  EmployerApplicationStats,
  EmployerAvailabilityFilterValue,
} from "@/types/employer-applications";
import { cn } from "@/utils/cn";
import { Filter, X } from "lucide-react";
import { useEffect, useId, useRef, type RefObject } from "react";

type CandidatesMobileFiltersSheetProps = {
  open: boolean;
  onClose: () => void;
  stats: EmployerApplicationStats | undefined;
  activeFilter: CandidatesQuickFilter;
  onFilterChange: (filter: CandidatesQuickFilter) => void;
  searchDraft: string;
  location: string;
  experience: string;
  skills: string;
  availability: EmployerAvailabilityFilterValue;
  appliedFrom: string;
  appliedTo: string;
  publicJobId?: string;
  searchInputRef?: RefObject<HTMLInputElement | null>;
  onSearchDraftChange: (value: string) => void;
  onSearchSubmit: () => void;
  onLocationChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onSkillsChange: (value: string) => void;
  onAvailabilityChange: (value: EmployerAvailabilityFilterValue) => void;
  onAppliedFromChange: (value: string) => void;
  onAppliedToChange: (value: string) => void;
  onClearAdvanced: () => void;
  onClearAll: () => void;
};

export function CandidatesMobileFiltersSheet({
  open,
  onClose,
  stats,
  activeFilter,
  onFilterChange,
  searchDraft,
  location,
  experience,
  skills,
  availability,
  appliedFrom,
  appliedTo,
  publicJobId,
  searchInputRef,
  onSearchDraftChange,
  onSearchSubmit,
  onLocationChange,
  onExperienceChange,
  onSkillsChange,
  onAvailabilityChange,
  onAppliedFromChange,
  onAppliedToChange,
  onClearAdvanced,
  onClearAll,
}: CandidatesMobileFiltersSheetProps) {
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
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
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
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl border border-border-subtle shadow-[0_-12px_40px_rgba(15,23,42,0.16)]",
          "md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:h-dvh md:w-[min(22.5rem,92vw)] md:rounded-none md:border-y-0 md:border-r-0 md:border-l md:shadow-[-12px_0_40px_rgba(15,23,42,0.12)]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Filter className="size-4" aria-hidden="true" />
            </span>
            <h2
              id={titleId}
              className="truncate text-base font-semibold text-foreground"
            >
              Filters
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 scrollbar-hidden sm:px-4">
          <CandidatesFilterPanel
            presentation="sheet"
            idPrefix="mobile-"
            stats={stats}
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            searchDraft={searchDraft}
            location={location}
            experience={experience}
            skills={skills}
            availability={availability}
            appliedFrom={appliedFrom}
            appliedTo={appliedTo}
            publicJobId={publicJobId}
            searchInputRef={searchInputRef}
            onSearchDraftChange={onSearchDraftChange}
            onSearchSubmit={onSearchSubmit}
            onLocationChange={onLocationChange}
            onExperienceChange={onExperienceChange}
            onSkillsChange={onSkillsChange}
            onAvailabilityChange={onAvailabilityChange}
            onAppliedFromChange={onAppliedFromChange}
            onAppliedToChange={onAppliedToChange}
            onClearAdvanced={onClearAdvanced}
            className="border-0 p-0 shadow-none sm:p-0"
          />
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border-subtle px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-[1.4] items-center justify-center rounded-lg bg-primary text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
