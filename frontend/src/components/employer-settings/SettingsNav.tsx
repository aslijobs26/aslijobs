"use client";

import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import type { EmployerSettingsNavItem } from "@/constants/employer-settings";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import type { EmployerSettingsSectionId } from "@/types/employer-settings";
import { cn } from "@/utils/cn";
import { useMemo } from "react";

const settingsSectionSelectTriggerClassName =
  "!h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 text-xs font-semibold text-foreground shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-sm";

type SettingsNavProps = {
  items: EmployerSettingsNavItem[];
  activeId: EmployerSettingsSectionId;
  onSelect: (id: EmployerSettingsSectionId) => void;
};

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  const sectionOptions = useMemo<EmployerRegisterSelectOption[]>(
    () =>
      items.map((item) => ({
        value: item.id,
        label: item.label,
        description: item.description,
      })),
    [items],
  );

  return (
    <nav
      aria-label="Settings sections"
      className="rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-4"
    >
      <div className="px-2 pb-3">
        <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Settings
        </h1>
        <p className="mt-1 text-xs text-muted sm:text-sm">
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
                      "block text-xs font-semibold sm:text-sm",
                      isActive ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[11px] sm:text-xs",
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
        <EmployerRegisterSearchableSelect
          id="settings-section-select"
          label="Settings section"
          hideLabel
          value={activeId}
          placeholder="Select section"
          options={sectionOptions}
          onChange={(value) => onSelect(value as EmployerSettingsSectionId)}
          hideSearch
          triggerClassName={settingsSectionSelectTriggerClassName}
        />
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hidden sm:gap-2">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "inline-flex shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3 sm:text-xs",
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
