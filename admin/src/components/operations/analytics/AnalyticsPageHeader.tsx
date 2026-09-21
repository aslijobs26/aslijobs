import { CalendarDays, Download, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { AnalyticsDatePreset } from "../../../types/operations-analytics";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";

const DATE_OPTIONS: { value: AnalyticsDatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 3 months" },
  { value: "last_6_months", label: "Last 6 months" },
  { value: "last_12_months", label: "Last 12 months" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "Overall" },
];

interface AnalyticsPageHeaderProps {
  preset: AnalyticsDatePreset;
  state: string;
  stateOptions: { value: string; label: string }[];
  onPresetChange: (preset: AnalyticsDatePreset) => void;
  onStateChange: (state: string) => void;
  onExport: () => void;
  isExporting?: boolean;
  canExport?: boolean;
}

export function AnalyticsPageHeader({
  preset,
  state,
  stateOptions,
  onPresetChange,
  onStateChange,
  onExport,
  isExporting = false,
  canExport = false,
}: AnalyticsPageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3 max-lg:gap-2.5">
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted"
      >
        <span className="font-medium">Management</span>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-foreground">Analytics</span>
        <Link to={OPERATIONS_ROUTES.HOME} className="sr-only">
          Back to Home
        </Link>
      </nav>

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[1.65rem] font-bold tracking-tight text-foreground max-lg:text-xl max-sm:text-lg">
            Analytics
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted max-sm:text-[12px]">
            From data to decisions — insights for a stronger, more inclusive
            workforce.
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="relative min-w-[9.5rem]">
            <CalendarDays
              className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <OperationsFilterSelect
              label="Date range"
              value={preset}
              options={DATE_OPTIONS}
              onChange={(value) => onPresetChange(value as AnalyticsDatePreset)}
              hideSearch
              triggerClassName="pl-8"
            />
          </div>

          <div className="relative min-w-[8.5rem]">
            <MapPin
              className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <OperationsFilterSelect
              label="Location"
              value={state}
              options={stateOptions}
              onChange={onStateChange}
              hideSearch={stateOptions.length <= 12}
              triggerClassName="pl-8"
            />
          </div>

          {canExport ? (
            <button
              type="button"
              onClick={onExport}
              disabled={isExporting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {isExporting ? "Exporting…" : "Export Report"}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
