"use client";

import {
  EMPLOYER_TEAM_TABS,
  type EmployerTeamTabId,
} from "@/constants/employer-team-management";
import { cn } from "@/utils/cn";

type TeamManagementTabsProps = {
  activeTab: EmployerTeamTabId;
  onChange: (tab: EmployerTeamTabId) => void;
};

export function TeamManagementTabs({
  activeTab,
  onChange,
}: TeamManagementTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Team management sections"
      className="flex gap-1 overflow-x-auto border-b border-border-subtle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {EMPLOYER_TEAM_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`team-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-2.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-4 sm:py-2.5 sm:text-sm",
              isActive
                ? "text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                className="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
