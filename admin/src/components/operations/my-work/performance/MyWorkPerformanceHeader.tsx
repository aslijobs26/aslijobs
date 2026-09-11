import { Calendar, ChevronDown, Download } from "lucide-react";
import { Link } from "react-router-dom";
import impactIllustration from "../../../../assets/my-work-performance-impact.svg";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsWorkPerformanceResult } from "../../../../types/operations-work";
import { OperationsCanKey } from "../../auth/OperationsCanKey";
import { formatTrendRangeLabel } from "./performance-format";

interface MyWorkPerformanceHeaderProps {
  trend: OperationsWorkPerformanceResult["completionTrend"];
  onDownload: () => void;
  isDownloading?: boolean;
}

export function MyWorkPerformanceHeader({
  trend,
  onDownload,
  isDownloading = false,
}: MyWorkPerformanceHeaderProps) {
  const rangeLabel = formatTrendRangeLabel(trend);

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
            Metrics for your assigned and completed work. Managers see team
            performance only when separately authorized.
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
            <div
              className="inline-flex h-9 min-w-[13.5rem] items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 text-[12px] font-semibold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
              aria-label={`Date range ${rangeLabel}`}
            >
              <Calendar className="size-3.5 shrink-0 text-muted" aria-hidden />
              <span className="min-w-0 flex-1 truncate tabular-nums">
                {rangeLabel}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-muted" aria-hidden />
            </div>

            <OperationsCanKey permissionKey="my_work.export">
              <button
                type="button"
                onClick={onDownload}
                disabled={isDownloading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#0b5f5a_0%,#0e8585_48%,#0a4f4b_100%)] px-3.5 text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(15,23,42,0.18)] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="size-3.5" aria-hidden />
                {isDownloading ? "Downloading…" : "Download"}
              </button>
            </OperationsCanKey>
          </div>
        </div>
      </div>
    </header>
  );
}
