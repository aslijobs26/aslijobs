"use client";

import type { EmployerSettingsNavItem } from "@/constants/employer-settings";
import type { EmployerSettingsSectionId } from "@/types/employer-settings";
import { cn } from "@/utils/cn";

type SettingsNavProps = {
  items: EmployerSettingsNavItem[];
  activeId: EmployerSettingsSectionId;
  onSelect: (id: EmployerSettingsSectionId) => void;
};

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4"
    >
      <div className="px-2 pb-3">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your account, preferences and application settings.
        </p>
      </div>

      <ul className="hidden space-y-1 lg:block" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-foreground hover:bg-hero-bg",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-surface text-primary"
                      : "bg-primary-light text-primary",
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isActive ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      isActive ? "text-primary/80" : "text-muted",
                    )}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="lg:hidden">
        <label htmlFor="settings-section-select" className="sr-only">
          Settings section
        </label>
        <select
          id="settings-section-select"
          value={activeId}
          onChange={(event) =>
            onSelect(event.target.value as EmployerSettingsSectionId)
          }
          className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "bg-primary text-surface"
                    : "bg-hero-bg text-foreground hover:bg-primary-light",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
