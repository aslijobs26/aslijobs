"use client";

import type { DepartmentStatus } from "@/types/employer-team";
import { cn } from "@/utils/cn";
import { Filter, Plus, Search, X } from "lucide-react";

export type DepartmentFiltersState = {
  status?: DepartmentStatus;
  createdFrom: string;
  createdTo: string;
  memberCountMin: string;
  memberCountMax: string;
};

export const DEFAULT_DEPARTMENT_FILTERS: DepartmentFiltersState = {
  status: undefined,
  createdFrom: "",
  createdTo: "",
  memberCountMin: "",
  memberCountMax: "",
};

type DepartmentsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onAddDepartment?: () => void;
};

export function DepartmentsToolbar({
  search,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  onAddDepartment,
}: DepartmentsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search departments</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, code, description or head..."
            className="h-10 w-full rounded-xl border border-border-subtle bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            filtersOpen || activeFilterCount > 0
              ? "border-primary/30 bg-primary-light text-primary"
              : "border-border-subtle bg-surface text-foreground hover:bg-primary-light/40",
          )}
        >
          <Filter className="size-4" aria-hidden="true" />
          Filter
          {activeFilterCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-surface">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
      {onAddDepartment ? (
        <button
          type="button"
          onClick={onAddDepartment}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Plus className="size-4" aria-hidden="true" strokeWidth={2.5} />
          Add Department
        </button>
      ) : null}
    </div>
  );
}

type DepartmentsFilterPanelProps = {
  filters: DepartmentFiltersState;
  onChange: (next: DepartmentFiltersState) => void;
  onClear: () => void;
  onClose: () => void;
};

export function DepartmentsFilterPanel({
  filters,
  onChange,
  onClear,
  onClose,
}: DepartmentsFilterPanelProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Filters</h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Close filters"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Status</span>
          <select
            value={filters.status ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                status: (event.target.value || undefined) as
                  | DepartmentStatus
                  | undefined,
              })
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Created from
          </span>
          <input
            type="date"
            value={filters.createdFrom}
            onChange={(event) =>
              onChange({ ...filters, createdFrom: event.target.value })
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Created to
          </span>
          <input
            type="date"
            value={filters.createdTo}
            onChange={(event) =>
              onChange({ ...filters, createdTo: event.target.value })
            }
            className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Min members
            </span>
            <input
              type="number"
              min={0}
              value={filters.memberCountMin}
              onChange={(event) =>
                onChange({ ...filters, memberCountMin: event.target.value })
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Max members
            </span>
            <input
              type="number"
              min={0}
              value={filters.memberCountMax}
              onChange={(event) =>
                onChange({ ...filters, memberCountMax: event.target.value })
              }
              className="h-10 w-full rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

export function countActiveDepartmentFilters(
  filters: DepartmentFiltersState,
): number {
  let count = 0;
  if (filters.status) count += 1;
  if (filters.createdFrom) count += 1;
  if (filters.createdTo) count += 1;
  if (filters.memberCountMin !== "") count += 1;
  if (filters.memberCountMax !== "") count += 1;
  return count;
}
