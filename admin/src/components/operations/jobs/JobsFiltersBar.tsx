import { Download, Plus, RotateCcw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  OperationsJobPaymentStatus,
  OperationsJobStatus,
  OperationsJobsFilterOptions,
} from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "./OperationsFilterSelect";

export interface JobsFiltersState {
  search: string;
  status: "" | OperationsJobStatus;
  paymentStatus: "" | OperationsJobPaymentStatus;
  category: string;
  location: string;
}

interface JobsFiltersBarProps {
  filters: JobsFiltersState;
  filterOptions: OperationsJobsFilterOptions;
  onChange: (next: Partial<JobsFiltersState>) => void;
  onClear: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS: { value: "" | OperationsJobStatus; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "active", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "closed", label: "Closed" },
];

const PAYMENT_OPTIONS: {
  value: "" | OperationsJobPaymentStatus;
  label: string;
}[] = [
  { value: "", label: "All Payment" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "unpaid", label: "Unpaid" },
];

const controlSurfaceClassName =
  "border-border-subtle bg-hero-bg/60 shadow-none hover:bg-surface hover:shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const filterTriggerClassName = cn(
  "!h-10 !w-full !min-w-0 !rounded-lg sm:!h-9",
  controlSurfaceClassName,
);

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1">
      <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function JobsFiltersBar({
  filters,
  filterOptions,
  onChange,
  onClear,
  onExport,
}: JobsFiltersBarProps) {
  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.paymentStatus,
    filters.category,
    filters.location,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const categoryOptions = [
    { value: "", label: "All Category" },
    ...filterOptions.categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];

  const locationOptions = [
    { value: "", label: "All States" },
    ...filterOptions.locations.map((state) => ({
      value: state,
      label: state,
    })),
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <label className="block w-full min-w-0 xl:w-auto xl:min-w-[10rem] xl:max-w-[14rem] xl:shrink-0">
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted">
            Search
          </span>
          <span className="sr-only">Search jobs</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
              placeholder="Search jobs…"
              className={cn(
                "h-10 w-full rounded-lg border border-border-subtle bg-hero-bg/60 py-2 pl-9 pr-3 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:font-normal placeholder:text-muted sm:h-9",
                "hover:border-primary/25 hover:bg-surface",
                "focus-visible:border-primary focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-primary/30",
              )}
            />
          </div>
        </label>

        <div
          className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2"
          role="group"
          aria-label="Job filters"
        >
          <FilterField label="Status">
            <OperationsFilterSelect
              label="Job status"
              value={filters.status}
              options={STATUS_OPTIONS}
              hideSearch
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({ status: value as JobsFiltersState["status"] })
              }
            />
          </FilterField>

          <FilterField label="Payment">
            <OperationsFilterSelect
              label="Payment status"
              value={filters.paymentStatus}
              options={PAYMENT_OPTIONS}
              hideSearch
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) =>
                onChange({
                  paymentStatus: value as JobsFiltersState["paymentStatus"],
                })
              }
            />
          </FilterField>

          <FilterField label="Category">
            <OperationsFilterSelect
              label="Job category"
              value={filters.category}
              options={categoryOptions}
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ category: value })}
            />
          </FilterField>

          <FilterField label="State">
            <OperationsFilterSelect
              label="State"
              value={filters.location}
              options={locationOptions}
              className="w-full min-w-0"
              triggerClassName={filterTriggerClassName}
              onChange={(value) => onChange({ location: value })}
            />
          </FilterField>
        </div>

        <div className="grid min-w-0 shrink-0 grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center xl:flex xl:flex-nowrap xl:gap-2 xl:border-l xl:border-border-subtle xl:pl-3">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(
              "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:flex-none sm:gap-1.5 sm:px-2.5 sm:text-xs",
              hasActiveFilters
                ? "text-muted hover:bg-hero-bg hover:text-foreground"
                : "cursor-not-allowed text-muted/40",
            )}
          >
            <RotateCcw className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Reset</span>
            {hasActiveFilters ? (
              <span className="inline-flex min-w-4 shrink-0 items-center justify-center rounded-full bg-primary-light px-1 text-[10px] font-semibold tabular-nums text-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg border border-border-subtle bg-surface px-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/25 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:flex-none sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <Download className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Export</span>
          </button>

          <Link
            to={OPERATIONS_ROUTES.JOBS_POST}
            className="inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg bg-primary-soft px-1.5 text-[11px] font-semibold text-surface shadow-[0_1px_2px_rgba(0,186,165,0.35)] transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:flex-none sm:gap-1.5 sm:px-3.5 sm:text-xs"
          >
            <Plus className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <span className="truncate">Post Job</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
