import { Download } from "lucide-react";
import { Link } from "react-router-dom";
import impactIllustration from "../../../../assets/my-work-performance-impact.svg";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsWorkPerformanceResult } from "../../../../types/operations-work";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import { OperationsFilterSelect } from "../../jobs/OperationsFilterSelect";

interface MyWorkPerformanceHeaderProps {
  trend: OperationsWorkPerformanceResult["completionTrend"];
  onDownload: () => void;
  isDownloading?: boolean;
  rangeLabel: string;
  downloadLabel?: string;
  rangeKey: "7d" | "30d";
  onRangeChange: (key: "7d" | "30d") => void;
}

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

export function MyWorkPerformanceHeader({
  onDownload,
  isDownloading = false,
  rangeLabel,
  downloadLabel = "Download completed work",
  rangeKey,
  onRangeChange,
}: MyWorkPerformanceHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-3">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[11px] text-muted"
      >
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          My Work
        </Link>
        <span aria-hidden>›</span>
        <span className="font-semibold text-foreground">My Performance</span>
      </nav>

      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            My Performance
          </h1>
          <p className="mt-1 text-[12px] leading-relaxed text-muted sm:text-[13px]">
            Personal metrics for work assigned to you. Values are computed from
            live WorkItems — empty metrics show as No data.
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col items-stretch gap-2.5 sm:w-auto sm:items-end">
          <img
            src={impactIllustration}
            alt=""
            aria-hidden
            className="pointer-events-none h-auto w-full max-w-[20rem] select-none sm:w-[20rem]"
            draggable={false}
          />
          <span className="sr-only">Small actions create big impact</span>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="w-[11rem]">
              <OperationsFilterSelect
                label={`Date range ${rangeLabel}`}
                value={rangeKey}
                options={RANGE_OPTIONS}
                onChange={(value) => onRangeChange(value as "7d" | "30d")}
                hideSearch
                triggerClassName="h-9"
              />
            </div>

            <OperationsCanKey permissionKey="my_work.export">
              <button
                type="button"
                onClick={onDownload}
                disabled={isDownloading}
                title="Exports completed work items (xlsx), not a metrics report"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#0b5f5a_0%,#0e8585_48%,#0a4f4b_100%)] px-3.5 text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.18)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="size-3.5" aria-hidden />
                {isDownloading ? "Downloading…" : downloadLabel}
              </button>
            </OperationsCanKey>
          </div>
        </div>
      </div>
    </header>
  );
}
