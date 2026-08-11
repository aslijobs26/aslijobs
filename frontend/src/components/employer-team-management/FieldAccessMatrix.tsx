"use client";

import {
  EMPLOYER_FIELD_ACCESS_CATALOG,
  FIELD_ACCESS_LEVEL_LABELS,
  FIELD_ACCESS_LEVELS,
  FIELD_SENSITIVITY_LABELS,
  coerceFieldAccessLevel,
  createEmptyFieldAccessDraft,
  fieldAccessMapsEqual,
  hydrateFieldAccessDraft,
  type FieldAccessLevel,
  type RoleFieldAccessMap,
} from "@/constants/employer-field-access";
import { EmployerRegisterSearchableSelect } from "@/components/employer-register/EmployerRegisterSearchableSelect";
import { EMPLOYER_TEAM_SELECT_TRIGGER_COMPACT_CLASSNAME } from "@/constants/employer-team-management";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  Copy,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FieldModuleKey = (typeof EMPLOYER_FIELD_ACCESS_CATALOG)[number]["module"];

type CopyRoleOption = {
  id: string;
  name: string;
};

type FieldAccessMatrixProps = {
  value: RoleFieldAccessMap;
  editable?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  copyRoles?: CopyRoleOption[];
  onChange?: (next: RoleFieldAccessMap) => void;
  onReset?: () => void;
  onCopyFromRole?: (roleId: string) => void;
};

function SensitivityBadge({
  sensitivity,
}: {
  sensitivity: keyof typeof FIELD_SENSITIVITY_LABELS;
}) {
  const styles: Record<keyof typeof FIELD_SENSITIVITY_LABELS, string> = {
    low: "bg-hero-bg text-muted border-border-subtle",
    medium: "bg-primary-light/40 text-primary border-primary/20",
    high: "bg-amber-50 text-amber-800 border-amber-200",
    critical: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[sensitivity],
      )}
    >
      {FIELD_SENSITIVITY_LABELS[sensitivity]}
    </span>
  );
}

function LevelControl({
  value,
  disabled,
  onChange,
}: {
  value: FieldAccessLevel;
  disabled?: boolean;
  onChange: (level: FieldAccessLevel) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Field access level"
      className="inline-flex max-w-full flex-wrap rounded-lg border border-border-subtle bg-hero-bg/60 p-0.5"
    >
      {FIELD_ACCESS_LEVELS.map((level) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(level)}
            className={cn(
              "h-7 min-w-[3.25rem] rounded-md px-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50",
              selected
                ? "bg-surface text-primary shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {FIELD_ACCESS_LEVEL_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}

export function FieldAccessMatrix({
  value,
  editable = false,
  isLoading = false,
  errorMessage = null,
  copyRoles = [],
  onChange,
  onReset,
  onCopyFromRole,
}: FieldAccessMatrixProps) {
  const [search, setSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        EMPLOYER_FIELD_ACCESS_CATALOG.map((moduleEntry) => [
          moduleEntry.module,
          true,
        ]),
      ),
  );
  const [copyRoleId, setCopyRoleId] = useState("");

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return EMPLOYER_FIELD_ACCESS_CATALOG;
    return EMPLOYER_FIELD_ACCESS_CATALOG.map((moduleEntry) => {
      const categories = moduleEntry.categories
        .map((category) => {
          const fields = category.fields.filter(
            (field) =>
              field.label.toLowerCase().includes(query) ||
              field.key.toLowerCase().includes(query) ||
              category.label.toLowerCase().includes(query) ||
              moduleEntry.label.toLowerCase().includes(query),
          );
          return { ...category, fields };
        })
        .filter((category) => category.fields.length > 0);
      return { ...moduleEntry, categories };
    }).filter((moduleEntry) => moduleEntry.categories.length > 0);
  }, [search]);

  useEffect(() => {
    if (!search.trim()) return;
    setExpandedModules((previous) => {
      const next = { ...previous };
      for (const moduleEntry of filteredCatalog) {
        next[moduleEntry.module] = true;
      }
      return next;
    });
  }, [filteredCatalog, search]);

  const setFieldLevel = (
    moduleKey: FieldModuleKey,
    fieldKey: string,
    level: FieldAccessLevel,
  ) => {
    if (!editable || !onChange) return;
    onChange({
      ...value,
      [moduleKey]: {
        ...(value[moduleKey] ?? {}),
        [fieldKey]: level,
      },
    });
  };

  const setVisibleLevel = (level: FieldAccessLevel) => {
    if (!editable || !onChange) return;
    const next = structuredClone(value);
    for (const moduleEntry of filteredCatalog) {
      const moduleMap = { ...(next[moduleEntry.module] ?? {}) };
      for (const category of moduleEntry.categories) {
        for (const field of category.fields) {
          moduleMap[field.key] = level;
        }
      }
      next[moduleEntry.module] = moduleMap;
    }
    onChange(next);
  };

  const expandAll = () => {
    setExpandedModules(
      Object.fromEntries(
        EMPLOYER_FIELD_ACCESS_CATALOG.map((moduleEntry) => [
          moduleEntry.module,
          true,
        ]),
      ),
    );
  };

  const collapseAll = () => {
    setExpandedModules(
      Object.fromEntries(
        EMPLOYER_FIELD_ACCESS_CATALOG.map((moduleEntry) => [
          moduleEntry.module,
          false,
        ]),
      ),
    );
  };

  const handleCopy = () => {
    if (!editable || !copyRoleId || !onCopyFromRole) return;
    onCopyFromRole(copyRoleId);
  };

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-hero-bg" />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-4 text-sm text-red-700">
        {errorMessage}
      </div>
    );
  }

  if (filteredCatalog.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-subtle bg-hero-bg/50 px-3 py-10 text-center">
        <p className="text-sm font-semibold text-foreground">No fields found</p>
        <p className="mt-1 text-xs text-muted">
          Try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <label className="relative block">
          <span className="sr-only">Search fields</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search fields..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg"
          >
            Collapse all
          </button>
          {editable ? (
            <>
              <button
                type="button"
                onClick={() => setVisibleLevel("edit")}
                className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg"
              >
                Select all Edit
              </button>
              <button
                type="button"
                onClick={() => setVisibleLevel("hidden")}
                className="inline-flex h-8 items-center rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg"
              >
                Select all Hidden
              </button>
              {onReset ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-subtle px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Reset
                </button>
              ) : null}
            </>
          ) : null}
        </div>

        {editable && copyRoles.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-hero-bg/40 p-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0 text-xs font-medium text-muted">
                Copy from
              </span>
              <EmployerRegisterSearchableSelect
                id="field-access-copy-role"
                label="Copy from"
                hideLabel
                value={copyRoleId}
                placeholder="Select role"
                options={copyRoles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                onChange={setCopyRoleId}
                searchPlaceholder="Search role"
                triggerClassName={EMPLOYER_TEAM_SELECT_TRIGGER_COMPACT_CLASSNAME}
              />
            </div>
            <button
              type="button"
              disabled={!copyRoleId}
              onClick={handleCopy}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary bg-surface px-2.5 text-xs font-semibold text-primary hover:bg-primary-light/40 disabled:opacity-50"
            >
              <Copy className="size-3" aria-hidden="true" />
              Copy
            </button>
          </div>
        ) : null}
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {filteredCatalog.map((moduleEntry) => {
          const expanded = expandedModules[moduleEntry.module] !== false;
          return (
            <section
              key={moduleEntry.module}
              className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
            >
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() =>
                  setExpandedModules((previous) => ({
                    ...previous,
                    [moduleEntry.module]: !expanded,
                  }))
                }
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-hero-bg/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
              >
                <span className="text-sm font-semibold text-foreground">
                  {moduleEntry.label}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted transition-transform",
                    expanded ? "rotate-0" : "-rotate-90",
                  )}
                  aria-hidden="true"
                />
              </button>

              {expanded ? (
                <div className="space-y-3 border-t border-border-subtle px-3 py-3">
                  {moduleEntry.categories.map((category) => (
                    <div key={category.key} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                        {category.label}
                      </p>
                      <ul className="space-y-2">
                        {category.fields.map((field) => {
                          const level = coerceFieldAccessLevel(
                            value[moduleEntry.module]?.[field.key],
                          );
                          return (
                            <li
                              key={field.key}
                              className="flex flex-col gap-2 rounded-md border border-border-subtle/80 bg-hero-bg/30 px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {field.label}
                                  </p>
                                  <SensitivityBadge
                                    sensitivity={field.sensitivity}
                                  />
                                </div>
                                <p className="mt-0.5 text-[11px] text-muted">
                                  {field.key}
                                </p>
                              </div>
                              <LevelControl
                                value={level}
                                disabled={!editable}
                                onChange={(nextLevel) =>
                                  setFieldLevel(
                                    moduleEntry.module,
                                    field.key,
                                    nextLevel,
                                  )
                                }
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export {
  createEmptyFieldAccessDraft,
  fieldAccessMapsEqual,
  hydrateFieldAccessDraft,
};
