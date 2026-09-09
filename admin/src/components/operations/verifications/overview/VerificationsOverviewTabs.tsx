import type {
  OperationsVerificationsOverviewTab,
  OperationsVerificationsTabCounts,
} from "../../../../types/operations-verifications";
import { cn } from "../../../../utils/cn";

interface VerificationsOverviewTabsProps {
  activeTab: OperationsVerificationsOverviewTab;
  counts: OperationsVerificationsTabCounts;
  onChange: (tab: OperationsVerificationsOverviewTab) => void;
}

const TABS: {
  id: OperationsVerificationsOverviewTab;
  label: string;
  shortLabel: string;
  showCount: boolean;
}[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview", showCount: false },
  { id: "pending", label: "Pending", shortLabel: "Pending", showCount: true },
  {
    id: "underReview",
    label: "Under Review",
    shortLabel: "Review",
    showCount: true,
  },
  { id: "verified", label: "Verified", shortLabel: "Verified", showCount: true },
  { id: "rejected", label: "Rejected", shortLabel: "Rejected", showCount: true },
  {
    id: "slaBreaches",
    label: "SLA Breaches",
    shortLabel: "SLA",
    showCount: true,
  },
];

export function VerificationsOverviewTabs({
  activeTab,
  counts,
  onChange,
}: VerificationsOverviewTabsProps) {
  return (
    <div
      className="-mx-0.5 flex min-w-0 items-end gap-0 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 scrollbar-hidden"
      role="tablist"
      aria-label="Verifications overview tabs"
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
            aria-label={
              tab.showCount ? `${tab.label}, ${countLabel}` : tab.label
            }
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[12px] font-semibold whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "max-sm:h-8 max-sm:gap-1 max-sm:px-2.5 max-sm:text-[11px]",
              "xl:h-8 xl:px-2.5 xl:text-[11px]",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.showCount ? (
              <span
                className={cn(
                  "tabular-nums",
                  selected ? "text-primary" : "text-muted",
                )}
              >
                ({countLabel})
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
