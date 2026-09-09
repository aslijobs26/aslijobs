import { RotateCcw, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type {
  OperationsJobPaymentStatus,
  OperationsJobStatus,
  OperationsJobsFilterOptions,
} from "../../../types/operations-jobs";
import { cn } from "../../../utils/cn";
import { OperationsFilterSelect } from "./OperationsFilterSelect";

export interface JobsTableFiltersState {
  search: string;
  status: "" | OperationsJobStatus;
  paymentStatus: "" | OperationsJobPaymentStatus;
  location: string;
}

interface JobsTableFiltersProps {
  filters: JobsTableFiltersState;
  filterOptions: OperationsJobsFilterOptions;
  onChange: (next: Partial<JobsTableFiltersState>) => void;
  onClear: () => void;
}

const STATUS_OPTIONS: { value: "" | OperationsJobStatus; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "active", label: "Live" },
  { value: "paused", label: "Paused" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "closed", label: "Closed" },
  { value: "rejected", label: "Rejected" },
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

const triggerClassName = cn(
  "!h-8 !w-full !min-w-0 !rounded-md !px-2 !text-[11px] xl:!h-7 xl:!px-1.5 xl:!text-[9px]",
  "!border-border !bg-hero-bg/70 !shadow-sm",
  "ops-brand-border-glow hover:!border-primary/30 hover:!bg-surface",
);

export const EMPTY_JOBS_TABLE_FILTERS: JobsTableFiltersState = {
  search: "",
  status: "",
  paymentStatus: "",
  location: "",
};

export function JobsTableFilters({
  filters,
  filterOptions,
  onChange,
  onClear,
}: JobsTableFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const applySearch = () => {
    onChange({ search: searchInput.trim() });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearch();
  };

  const activeFilterCount = [
    filters.search.trim() || searchInput.trim(),
    filters.status,
    filters.paymentStatus,
    filters.location,
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border-subtle/80 bg-hero-bg/50 p-2 xl:gap-1.5 xl:p-1.5 dark:bg-hero-bg/40">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          className="relative block min-w-0 sm:min-w-[12rem] sm:max-w-xs sm:flex-1 xl:max-w-[14rem]"
          onSubmit={handleSearchSubmit}
        >
          <label className="block min-w-0">
            <span className="sr-only">Search jobs</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted xl:left-2 xl:size-3"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onBlur={applySearch}
              placeholder="Search jobs…"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "h-8 w-full rounded-md border border-border bg-surface py-1.5 pr-2.5 pl-8 text-[11px] font-medium text-foreground shadow-sm outline-none",
                "placeholder:font-normal placeholder:text-muted",
                "hover:border-primary/25",
                "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30",
                "xl:h-7 xl:pl-7 xl:pr-2 xl:text-[9px]",
                "[appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
              )}
            />
          </label>
        </form>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border bg-surface px-2.5 text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:border-primary/25 hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:h-7 xl:gap-0.5 xl:px-2 xl:text-[9px]"
          >
            <RotateCcw className="size-3 xl:size-2.5" aria-hidden="true" />
            Reset
            <span className="tabular-nums text-muted">({activeFilterCount})</span>
          </button>
        ) : null}
      </div>

      <div
        className="grid min-w-0 grid-cols-2 gap-1.5 max-[360px]:grid-cols-1 sm:grid-cols-3"
        role="group"
        aria-label="Job table filters"
      >
        <OperationsFilterSelect
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({ status: value as JobsTableFiltersState["status"] })
          }
        />
        <OperationsFilterSelect
          label="Payment"
          value={filters.paymentStatus}
          options={PAYMENT_OPTIONS}
          hideSearch
          triggerClassName={triggerClassName}
          onChange={(value) =>
            onChange({
              paymentStatus: value as JobsTableFiltersState["paymentStatus"],
            })
          }
        />
        <OperationsFilterSelect
          label="State"
          value={filters.location}
          options={[
            { value: "", label: "All States" },
            ...filterOptions.locations.map((state) => ({
              value: state,
              label: state,
            })),
          ]}
          triggerClassName={triggerClassName}
          onChange={(value) => onChange({ location: value })}
        />
      </div>
    </div>
  );
}
