import { cn } from "../../../utils/cn";
import type { AnalyticsTabId } from "../../../types/operations-analytics";

const TAB_ITEMS: { id: AnalyticsTabId; label: string }[] = [
  { id: "insights", label: "Insights" },
  { id: "website-traffic", label: "Website Traffic" },
  { id: "trends", label: "Trends" },
  { id: "hiring-funnel", label: "Hiring Funnel" },
  { id: "supply-demand", label: "Supply & Demand" },
  { id: "market-intelligence", label: "Market Intelligence" },
  { id: "placement-intelligence", label: "Placement Intelligence" },
  { id: "forecasts", label: "Forecasts" },
  { id: "reports", label: "Reports" },
];

interface AnalyticsTabsProps {
  activeTab: AnalyticsTabId;
  onChange: (tab: AnalyticsTabId) => void;
}

export function AnalyticsTabs({ activeTab, onChange }: AnalyticsTabsProps) {
  return (
    <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 scrollbar-hidden">
      <div
        role="tablist"
        aria-label="Analytics sections"
        className="flex min-w-max gap-0 border-b border-border-subtle"
      >
        {TAB_ITEMS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              id={`analytics-tab-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3.5 sm:text-[13px]",
                isActive
                  ? "text-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tab.label}
              {isActive ? (
                <span
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
