import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsEmployersAnalyticsFunnelStage } from "../../../../types/operations-employers";
import { cn } from "../../../../utils/cn";

interface EmployersOnboardingFunnelProps {
  stages: OperationsEmployersAnalyticsFunnelStage[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/** Preferred display order — reference-style five-row funnel. */
const STAGE_ORDER = [
  "registered",
  "profile_completed",
  "documents_submitted",
  "verification_in_progress",
  "verified",
] as const;

function resolveBarTone(stageId: string, index: number, total: number) {
  if (stageId === "registered" || index === 0) {
    return "registered" as const;
  }
  if (stageId === "verified" || index === total - 1) {
    return "verified" as const;
  }
  return "progress" as const;
}

export function EmployersOnboardingFunnel({
  stages,
  isLoading = false,
  isError = false,
  onRetry,
}: EmployersOnboardingFunnelProps) {
  const orderedStages = STAGE_ORDER.map((id) =>
    stages.find((stage) => stage.id === id),
  ).filter((stage): stage is OperationsEmployersAnalyticsFunnelStage =>
    Boolean(stage),
  );

  const displayStages =
    orderedStages.length >= 5
      ? orderedStages.slice(0, 5)
      : stages.slice(0, 5);

  return (
    <section className="employers-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-2 px-3 pt-2.5 max-sm:gap-1.5 max-sm:px-2.5 max-sm:pt-2 sm:px-3.5 sm:pt-3 xl:px-3 xl:pt-2">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground max-sm:text-[12px] xl:text-[12px]">
          Onboarding Funnel
        </h3>
        <Link
          to={`${OPERATIONS_ROUTES.EMPLOYERS}?tab=verificationPending`}
          className="shrink-0 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:text-[11px] xl:text-[11px]"
        >
          View details →
        </Link>
      </header>

      <div className="min-h-0 flex-1 px-3 pb-3 pt-3 max-sm:px-2.5 max-sm:pb-2.5 max-sm:pt-2.5 sm:px-3.5 sm:pb-3.5 xl:px-3 xl:pb-2.5 xl:pt-2.5">
        {isLoading ? (
          <div className="flex min-h-[11rem] flex-col justify-center gap-3 max-sm:min-h-36 max-sm:gap-2.5 xl:min-h-36 xl:gap-2" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid animate-pulse grid-cols-[minmax(0,5.25rem)_minmax(0,1fr)_auto_auto] items-center gap-x-2 max-sm:gap-x-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto_auto] sm:gap-x-3"
              >
                <div className="h-3 rounded bg-hero-bg" />
                <div className="h-3.5 rounded bg-hero-bg xl:h-3" />
                <div className="h-3 w-10 rounded bg-hero-bg" />
                <div className="h-3 w-8 rounded bg-hero-bg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex min-h-[11rem] flex-col items-center justify-center gap-2 text-center xl:min-h-36">
            <p className="text-[12px] text-muted">
              Unable to load onboarding funnel data
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : displayStages.length === 0 ? (
          <p className="flex min-h-[11rem] items-center justify-center text-center text-xs text-muted xl:min-h-36">
            No onboarding funnel data available
          </p>
        ) : (
          <ul className="flex min-h-[11rem] flex-col justify-center gap-3 max-sm:min-h-36 max-sm:gap-2.5 xl:min-h-36 xl:gap-2">
            {displayStages.map((stage, index) => {
              const tone = resolveBarTone(
                stage.id,
                index,
                displayStages.length,
              );
              const percent = Math.max(
                0,
                Math.min(100, Math.round(stage.percent)),
              );

              return (
                <li
                  key={stage.id}
                  className="grid grid-cols-[minmax(0,5.25rem)_minmax(0,1fr)_auto_auto] items-center gap-x-2 max-sm:gap-x-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto_auto] sm:gap-x-3"
                >
                  <span className="truncate text-[11px] font-medium text-foreground max-sm:text-[10px] sm:text-[12px] xl:text-[11px]">
                    {stage.label}
                  </span>

                  <div
                    className="h-3.5 w-full min-w-0 overflow-hidden rounded bg-[#EEF2F6] dark:bg-hero-bg xl:h-3"
                    role="progressbar"
                    aria-label={`${stage.label}: ${percent}%`}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={cn(
                        "h-full rounded transition-[width] duration-300",
                        tone === "registered" && "bg-[#CBD5E1] dark:bg-muted",
                        tone === "progress" && "bg-primary",
                        tone === "verified" && "bg-success",
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="min-w-[2.75rem] text-right text-[12px] font-semibold tabular-nums text-foreground sm:min-w-[3.25rem] sm:text-[13px] xl:text-[12px]">
                    {stage.count.toLocaleString("en-IN")}
                  </span>

                  <span
                    className={cn(
                      "min-w-[2.25rem] text-right text-[11px] tabular-nums sm:min-w-[2.5rem] sm:text-[12px] xl:text-[11px]",
                      tone === "registered" ? "text-muted" : "text-success",
                    )}
                  >
                    {percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
