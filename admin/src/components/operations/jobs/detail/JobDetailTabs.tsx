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

const TABS: { id: JobDetailTabId; label: string; countKey?: "applications" }[] =
  [
    { id: "overview", label: "Job Overview" },
    { id: "applications", label: "Applications", countKey: "applications" },
    { id: "activity", label: "Job Activity" },
    { id: "preview", label: "Job Preview" },
  ];

export function JobDetailTabs({
  activeTab,
  applicationsCount,
  onChange,
}: JobDetailTabsProps) {
  return (
    <div
      className="-mx-0.5 flex touch-manipulation gap-1 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 scrollbar-hidden"
      role="tablist"
      aria-label="Job detail sections"
    >
      {TABS.map((tab) => {
        const selected = activeTab === tab.id;
        const label =
          tab.countKey === "applications"
            ? `${tab.label} (${applicationsCount.toLocaleString("en-IN")})`
            : tab.label;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? "text-primary-soft"
                : "text-muted hover:text-foreground",
            )}
          >
            {label}
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
