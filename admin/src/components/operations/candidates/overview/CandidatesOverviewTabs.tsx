import type {
  OperationsCandidatesAnalyticsTabs,
  OperationsCandidatesOverviewTab,
} from "../../../../types/operations-candidates";
import { cn } from "../../../../utils/cn";

const TABS: Array<{
  id: OperationsCandidatesOverviewTab;
  label: string;
  shortLabel: string;
}> = [
  { id: "all", label: "All", shortLabel: "All" },
  { id: "new", label: "New", shortLabel: "New" },
  {
    id: "profileIncomplete",
    label: "Profile Incomplete",
    shortLabel: "Incomplete",
  },
  {
    id: "verificationPending",
    label: "Verification Pending",
    shortLabel: "Pending",
  },
];

export function CandidatesOverviewTabs({
  activeTab,
  counts,
  onChange,
}: {
  activeTab: OperationsCandidatesOverviewTab;
  counts: OperationsCandidatesAnalyticsTabs;
  onChange: (tab: OperationsCandidatesOverviewTab) => void;
}) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hidden sm:gap-2 xl:gap-1.5"
      role="tablist"
      aria-label="Jobseeker overview tabs"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "sm:h-9 sm:px-3 sm:text-xs",
              "xl:h-7 xl:gap-1 xl:px-2 xl:text-[9px]",
              selected
                ? "ops-brand-border-glow border-primary-soft bg-primary-light text-primary-soft"
                : "ops-brand-border-glow border-border bg-surface text-muted hover:bg-primary-light/50",
            )}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline xl:hidden">{tab.label}</span>
            <span className="hidden xl:inline">{tab.shortLabel}</span>
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums xl:min-w-4 xl:px-0.5 xl:text-[8px]",
                selected
                  ? "bg-primary-soft/15 text-primary-soft"
                  : "bg-hero-bg text-muted",
              )}
            >
              {counts[tab.id].toLocaleString("en-IN")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
