import type { OperationsJobTab, OperationsJobsTabCounts } from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";

interface JobsTabsProps {
  activeTab: OperationsJobTab;
  counts: OperationsJobsTabCounts;
  onChange: (tab: OperationsJobTab) => void;
}

const TABS: { id: OperationsJobTab; label: string; shortLabel: string }[] = [
  { id: "all", label: "All Status", shortLabel: "All" },
  { id: "pending_approval", label: "Pending Approval", shortLabel: "Pending" },
  { id: "live", label: "Live", shortLabel: "Live" },
  { id: "paused", label: "Paused", shortLabel: "Paused" },
  { id: "draft", label: "Draft", shortLabel: "Draft" },
  { id: "expired", label: "Expired", shortLabel: "Expired" },
  { id: "closed", label: "Closed", shortLabel: "Closed" },
  { id: "rejected", label: "Rejected", shortLabel: "Rejected" },
];

export function JobsTabs({ activeTab, counts, onChange }: JobsTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hidden sm:gap-2 lg:flex-wrap lg:overflow-visible lg:pb-0"
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
