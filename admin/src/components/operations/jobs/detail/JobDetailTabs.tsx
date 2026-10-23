import { cn } from "../../../../utils/cn";

export type JobDetailTabId =
  | "overview"
  | "applications"
  | "activity"
  | "preview";

interface JobDetailTabsProps {
  activeTab: JobDetailTabId;
  applicationsCount: number;
  onChange: (tab: JobDetailTabId) => void;
}

const TABS: {
  id: JobDetailTabId;
  label: string;
  shortLabel: string;
  countKey?: "applications";
}[] = [
  { id: "overview", label: "Job Overview", shortLabel: "Overview" },
  {
    id: "applications",
    label: "Applications",
    shortLabel: "Apps",
    countKey: "applications",
  },
  { id: "activity", label: "Job Activity", shortLabel: "Activity" },
  { id: "preview", label: "Job Preview", shortLabel: "Preview" },
];

export function JobDetailTabs({
  activeTab,
  applicationsCount,
  onChange,
}: JobDetailTabsProps) {
  return (
    <div
      className="-mx-0.5 flex touch-manipulation gap-0.5 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 scrollbar-hidden max-sm:gap-1 sm:gap-1"
      role="tablist"
      aria-label="Job detail sections"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const countSuffix =
          tab.countKey === "applications"
            ? ` (${applicationsCount.toLocaleString("en-IN")})`
            : "";

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-2.5 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:px-2.5 max-sm:py-2 sm:px-3 sm:py-2.5 sm:text-xs",
              selected
                ? "text-primary-soft"
                : "text-muted hover:text-foreground",
            )}
          >
            <span className="sm:hidden">
              {tab.shortLabel}
              {countSuffix}
            </span>
            <span className="hidden sm:inline">
              {tab.label}
              {countSuffix}
            </span>
            {selected ? (
              <span
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary-soft"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
