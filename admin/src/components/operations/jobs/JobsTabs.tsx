import type { OperationsJobTab, OperationsJobsTabCounts } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";

interface JobsTabsProps {
  activeTab: OperationsJobTab;
  counts: OperationsJobsTabCounts;
  onChange: (tab: OperationsJobTab) => void;
}

const TABS: { id: OperationsJobTab; label: string; shortLabel: string }[] = [
  { id: "all", label: "All Jobs", shortLabel: "All" },
  { id: "live", label: "Live", shortLabel: "Live" },
  { id: "pending_payment", label: "Pending Payment", shortLabel: "Pending" },
  { id: "expired", label: "Expired", shortLabel: "Expired" },
  { id: "drafts", label: "Drafts", shortLabel: "Drafts" },
];

export function JobsTabs({ activeTab, counts, onChange }: JobsTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hidden sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0"
      role="tablist"
      aria-label="Job status tabs"
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
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px] font-semibold whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "sm:h-9 sm:px-3 sm:text-xs",
              selected
                ? "border-primary-soft bg-primary-light text-primary-soft"
                : "border-border bg-surface text-muted hover:border-primary-soft/40 hover:bg-primary-light/50 hover:text-foreground",
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
