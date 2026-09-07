import { Download, Plus } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsEmployersAnalyticsPreset } from "../../../../types/operations-employers";
import { OperationsDatePicker } from "../../../ui/OperationsDatePicker";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";

const PRESET_OPTIONS: { value: OperationsEmployersAnalyticsPreset; label: string }[] =
  [
    { value: "all", label: "Overall" },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "last_90_days", label: "Last 90 Days" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

function todayIsoDate(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

interface EmployersOverviewHeaderProps {
  preset: OperationsEmployersAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: OperationsEmployersAnalyticsPreset) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onAddEmployer: () => void;
  onExport: () => void;
  isExporting?: boolean;
}

export function EmployersOverviewHeader({
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
  onAddEmployer,
  onExport,
  isExporting = false,
}: EmployersOverviewHeaderProps) {
  const todayIso = todayIsoDate();
  const fromPickerId = useId();
  const toPickerId = useId();

  return (
    <header className="flex min-w-0 flex-col gap-3">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted"
      >
        <Link
          to={OPERATIONS_ROUTES.HOME}
          className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Home
        </Link>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-foreground">Employers</span>
      </nav>

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Employers Overview
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            Track registrations, verification, and hiring activity across the
            employer network.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <OperationsFilterSelect
            label="Date range"
            value={preset}
            options={PRESET_OPTIONS}
            onChange={(value) =>
              onPresetChange(value as OperationsEmployersAnalyticsPreset)
            }
            hideSearch
            className="sm:w-[10.5rem]"
          />

          {preset === "custom" ? (
            <div className="grid grid-cols-2 gap-2 sm:w-[18rem]">
              <OperationsDatePicker
                id={fromPickerId}
                value={dateFrom}
                placeholder="From"
                maxDate={dateTo || todayIso}
                compact
                onChange={(nextFrom) => {
                  onDateFromChange(nextFrom);
                  if (dateTo && nextFrom && dateTo < nextFrom) {
                    onDateToChange(nextFrom);
                  }
                }}
              />
              <OperationsDatePicker
                id={toPickerId}
                value={dateTo}
                placeholder="To"
                minDate={dateFrom || undefined}
                maxDate={todayIso}
                compact
                onChange={onDateToChange}
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            <Download className="size-3.5" aria-hidden="true" />
            {isExporting ? "Exporting…" : "Export"}
          </button>

          <button
            type="button"
            onClick={onAddEmployer}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-surface shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add Employer
          </button>
        </div>
      </div>
    </header>
  );
}
