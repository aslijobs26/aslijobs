import { cn } from "../../../utils/cn";
import type { OperationsJobsModuleView } from "../../../types/operations-jobs";

const TABS: { id: OperationsJobsModuleView; label: string }[] = [
  { id: "analytics", label: "Analytics" },
  { id: "all", label: "All Jobs" },
];

interface JobsViewTabsProps {
  value: OperationsJobsModuleView;
  onChange: (view: OperationsJobsModuleView) => void;
}

export function JobsViewTabs({ value, onChange }: JobsViewTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Jobs module views"
      className="inline-flex w-full min-w-0 rounded-xl bg-[#eef3f6] p-1 sm:w-auto dark:bg-hero-bg"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex h-8 min-w-[7rem] flex-1 items-center justify-center rounded-lg px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-none",
              selected
                ? "bg-primary-soft text-surface shadow-sm"
                : "bg-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
