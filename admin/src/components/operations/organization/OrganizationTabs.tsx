import { cn } from "../../../utils/cn";
import type { OperationsOrganizationTab } from "../../../types/operations-organization";

const TABS: Array<{ id: OperationsOrganizationTab; label: string }> = [
  { id: "structure", label: "Structure" },
  { id: "people", label: "People" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "departments", label: "Departments" },
  { id: "locations", label: "Locations" },
  { id: "teams", label: "Teams" },
  { id: "settings", label: "Settings" },
];

interface OrganizationTabsProps {
  activeTab: OperationsOrganizationTab;
  onTabChange: (tab: OperationsOrganizationTab) => void;
}

export function OrganizationTabs({
  activeTab,
  onTabChange,
}: OrganizationTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Organization sections"
      className="flex gap-1 overflow-x-auto border-b border-border-subtle scrollbar-hidden"
    >
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            id={`org-tab-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? "border-primary text-foreground"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
