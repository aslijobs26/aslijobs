import { Download, Plus } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsJobsAnalyticsPreset } from "../../../../types/operations-jobs";
import { OperationsDatePicker } from "../../../ui/OperationsDatePicker";
import { OperationsFilterSelect } from "../OperationsFilterSelect";

const PRESET_OPTIONS: Array<{
  value: OperationsJobsAnalyticsPreset;
  label: string;
}> = [
  { value: "all", label: "Overall" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "custom", label: "Custom" },
];

interface JobsOverviewHeaderProps {
  preset: OperationsJobsAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: OperationsJobsAnalyticsPreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onExport: () => void;
}

export function JobsOverviewHeader({
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
  onExport,
}: JobsOverviewHeaderProps) {
  const fromId = useId();
  const toId = useId();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <header className="flex min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[11px] text-muted max-sm:text-[10px]"
      >
        <Link
          to={OPERATIONS_ROUTES.HOME}
          className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-foreground">Jobs</span>
      </nav>

      <div className="flex min-w-0 flex-col gap-3 max-lg:gap-2.5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground max-lg:text-lg max-sm:text-base">
            Jobs Overview
          </h1>
          <p className="mt-0.5 text-xs text-muted max-sm:text-[11px] max-sm:leading-snug">
            Track job postings, approvals, performance and demand across all
            employers.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2 max-sm:gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
          <OperationsFilterSelect
            label="Date range"
            value={preset}
            options={PRESET_OPTIONS}
            onChange={(value) =>
              onPresetChange(value as OperationsJobsAnalyticsPreset)
            }
            hideSearch
            className="w-full min-w-0 sm:w-[10.5rem]"
          />
          {preset === "custom" ? (
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:w-[18rem]">
              <OperationsDatePicker
                id={fromId}
                value={dateFrom}
                placeholder="From"
                maxDate={dateTo || today}
                compact
                onChange={onDateFromChange}
              />
              <OperationsDatePicker
                id={toId}
                value={dateTo}
                placeholder="To"
                minDate={dateFrom || undefined}
                maxDate={today}
                compact
                onChange={onDateToChange}
              />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:w-full">
            <Link
              to={OPERATIONS_ROUTES.JOBS_POST}
              className="inline-flex h-8 min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-surface hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:min-w-[7.5rem] sm:flex-none"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Post a Job
            </Link>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex h-8 min-h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:min-w-[7.5rem] sm:flex-none"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Export
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
