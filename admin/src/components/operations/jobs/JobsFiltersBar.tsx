import { Download, Plus, RotateCcw, Search } from "lucide-react";
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
    { value: "", label: "All Location" },
    ...filterOptions.locations.map((location) => ({
      value: location,
      label: location,
    })),
  ];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3.5">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5 lg:flex-row lg:items-center lg:gap-2.5">
          <label className="relative w-full min-w-0 lg:max-w-md lg:flex-1 xl:max-w-lg">
            <span className="sr-only">Search jobs</span>
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
          </label>

          <div
            className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:flex lg:flex-1 lg:items-center"
            role="group"
            aria-label="Job filters"
          >
            <OperationsFilterSelect
              label="Job status"
              value={filters.status}
              options={STATUS_OPTIONS}
              hideSearch
              className="min-w-0 lg:min-w-[7.25rem] lg:flex-1"
              triggerClassName={cn("!h-10 !rounded-lg sm:!h-9", controlSurfaceClassName)}
              onChange={(value) =>
                onChange({ status: value as JobsFiltersState["status"] })
              }
            />

            <OperationsFilterSelect
              label="Payment status"
              value={filters.paymentStatus}
              options={PAYMENT_OPTIONS}
              hideSearch
              className="min-w-0 lg:min-w-[7.25rem] lg:flex-1"
              triggerClassName={cn("!h-10 !rounded-lg sm:!h-9", controlSurfaceClassName)}
              onChange={(value) =>
                onChange({
                  paymentStatus: value as JobsFiltersState["paymentStatus"],
                })
              }
            />

            <OperationsFilterSelect
              label="Job category"
              value={filters.category}
              options={categoryOptions}
              className="min-w-0 lg:min-w-[7.5rem] lg:flex-1"
              triggerClassName={cn("!h-10 !rounded-lg sm:!h-9", controlSurfaceClassName)}
              onChange={(value) => onChange({ category: value })}
            />

            <OperationsFilterSelect
              label="Location"
              value={filters.location}
              options={locationOptions}
              className="min-w-0 lg:min-w-[7.5rem] lg:flex-1"
              triggerClassName={cn("!h-10 !rounded-lg sm:!h-9", controlSurfaceClassName)}
              onChange={(value) => onChange({ location: value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 xl:border-l xl:border-border-subtle xl:pl-4">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9",
              hasActiveFilters
                ? "text-muted hover:bg-hero-bg hover:text-foreground"
                : "cursor-not-allowed text-muted/40",
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset
            {hasActiveFilters ? (
              <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary-light px-1 text-[10px] font-semibold tabular-nums text-primary">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/25 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export
          </button>

          <Link
            to={OPERATIONS_ROUTES.JOBS_POST}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary-soft px-3 text-xs font-semibold text-surface shadow-[0_1px_2px_rgba(0,186,165,0.35)] transition-colors hover:bg-primary-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-9 sm:px-3.5"
          >
            <Plus className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
            Post Job
          </Link>
        </div>
      </div>
    </div>
  );
}
