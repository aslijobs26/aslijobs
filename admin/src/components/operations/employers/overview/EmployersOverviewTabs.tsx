import type {
  OperationsEmployersAnalyticsTabs,
  OperationsEmployersOverviewTab,
} from "../../../../types/operations-employers";
import { cn } from "../../../../utils/cn";

interface EmployersOverviewTabsProps {
  activeTab: OperationsEmployersOverviewTab;
  counts: OperationsEmployersAnalyticsTabs;
  onChange: (tab: OperationsEmployersOverviewTab) => void;
}

const TABS: {
  id: OperationsEmployersOverviewTab;
  label: string;
  shortLabel: string;
}[] = [
  { id: "all", label: "All", shortLabel: "All" },
  { id: "new", label: "New", shortLabel: "New" },
  {
    id: "verificationPending",
    label: "Verification Pending",
    shortLabel: "Pending",
  },
  { id: "active", label: "Active", shortLabel: "Active" },
  { id: "inactive", label: "Inactive", shortLabel: "Inactive" },
];

export function EmployersOverviewTabs({
  activeTab,
  counts,
  onChange,
}: EmployersOverviewTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 scrollbar-hidden max-sm:gap-1 sm:gap-2 lg:flex-wrap lg:overflow-visible lg:pb-0"
      role="tablist"
      aria-label="Recent employers tabs"
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
              "max-sm:h-8 max-sm:gap-1 max-sm:px-2 max-sm:text-[10px]",
              "sm:h-9 sm:px-3 sm:text-xs",
              "xl:h-7 xl:gap-1 xl:px-2 xl:text-[10px]",
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
                "max-sm:size-4 max-sm:text-[9px]",
                "xl:size-4 xl:text-[9px]",
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
