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
                    "inline-flex items-center gap-1.5 border-b-[3px] px-3 py-2.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 sm:size-[1.125rem]",
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
