import type {
  OperationsCandidateTab,
  OperationsCandidatesTabCounts,
} from "../../../types/operations-candidates";
import { cn } from "../../../utils/cn";

interface CandidatesTabsProps {
  activeTab: OperationsCandidateTab;
  counts: OperationsCandidatesTabCounts;
  onChange: (tab: OperationsCandidateTab) => void;
}

const TABS: {
  id: OperationsCandidateTab;
  label: string;
  shortLabel: string;
}[] = [
  { id: "all", label: "All", shortLabel: "All" },
  { id: "applied", label: "Applied", shortLabel: "Applied" },
  { id: "under_review", label: "Under Review", shortLabel: "Review" },
  { id: "shortlisted", label: "Shortlisted", shortLabel: "Shortlist" },
  { id: "interview", label: "Interview", shortLabel: "Interview" },
  { id: "hired", label: "Hired", shortLabel: "Hired" },
  { id: "rejected", label: "Rejected", shortLabel: "Rejected" },
];

export function CandidatesTabs({
  activeTab,
  counts,
  onChange,
}: CandidatesTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hidden sm:gap-2 lg:flex-wrap lg:overflow-visible lg:pb-0"
      role="tablist"
      aria-label="Candidate status tabs"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const count = counts[tab.id];
        const countLabel = count.toLocaleString("en-IN");

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`${tab.label}, ${countLabel}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold whitespace-nowrap transition-[colors,box-shadow,border-color]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "sm:h-9 sm:px-3 sm:text-xs",
              selected
                ? "ops-brand-border-glow border-primary-soft bg-primary-light text-primary-soft dark:bg-primary-soft/15"
                : "ops-brand-border-glow border-border bg-surface text-muted hover:border-primary-soft/40 hover:bg-primary-light/50 hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                selected
                  ? "bg-primary-soft/15 text-primary-soft"
                  : "bg-hero-bg text-muted",
              )}
            >
              {countLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
