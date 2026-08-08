"use client";

import type {
  JobSeekerSettingsNavItem,
  JobSeekerSettingsSectionId,
} from "@/constants/job-seeker-settings";
import { cn } from "@/utils/cn";

type SettingsNavProps = {
  items: JobSeekerSettingsNavItem[];
  activeId: JobSeekerSettingsSectionId;
  onSelect: (id: JobSeekerSettingsSectionId) => void;
};

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  return (
    <nav aria-label="Settings sections" className="min-w-0">
      <div className="overflow-x-auto scrollbar-hidden">
        <ul
          className="flex min-w-max items-stretch gap-0 border-b border-border-subtle sm:gap-1"
          role="tablist"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 border-b-[3px] px-3.5 py-3 text-sm font-semibold transition-colors sm:px-4",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[1.125rem] shrink-0",
                      isActive ? "text-primary" : "text-muted",
                    )}
                    strokeWidth={isActive ? 2.25 : 2}
                    aria-hidden="true"
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
