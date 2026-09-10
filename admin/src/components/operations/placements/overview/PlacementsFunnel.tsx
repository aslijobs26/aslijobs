import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsPlacementsFunnelStage } from "../../../../types/operations-placements";
import { cn } from "../../../../utils/cn";

interface PlacementsFunnelProps {
  stages: OperationsPlacementsFunnelStage[];
}

function resolveBarTone(
  stageKey: string,
  index: number,
  total: number,
): "registered" | "progress" | "verified" {
  if (stageKey === "applications" || index === 0) return "registered";
  if (stageKey === "joined" || index === total - 1) return "verified";
  return "progress";
}

export function PlacementsFunnel({ stages }: PlacementsFunnelProps) {
  const displayStages = (Array.isArray(stages) ? stages : []).slice(0, 6);

  return (
    <section className="placements-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex items-center justify-between gap-2 px-3 pt-2.5 max-sm:gap-1.5 max-sm:px-2.5 max-sm:pt-2 sm:px-3.5 sm:pt-3 xl:px-3 xl:pt-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold tracking-tight text-foreground max-sm:text-[12px] xl:text-[12px]">
            Placement Funnel
          </h3>
          <p className="mt-0.5 text-[11px] text-muted max-sm:text-[10px] xl:text-[10px]">
            Application to joined journey
          </p>
        </div>
        <Link
          to={OPERATIONS_ROUTES.PLACEMENTS_LIST}
          className="shrink-0 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:text-[11px] xl:text-[11px]"
        >
          View details →
        </Link>
      </header>
      <div className="min-h-0 flex-1 px-3 pb-3 pt-3 max-sm:px-2.5 max-sm:pb-2.5 max-sm:pt-2.5 sm:px-3.5 sm:pb-3.5 xl:px-3 xl:pb-2.5 xl:pt-2.5">
        {displayStages.length === 0 ? (
          <p className="flex min-h-[11rem] items-center justify-center text-center text-xs text-muted max-sm:min-h-36 xl:min-h-36">
            No funnel data available.
          </p>
        ) : (
          <ul className="flex min-h-[11rem] flex-col justify-center gap-2.5 max-sm:min-h-36 max-sm:gap-2 xl:min-h-36 xl:gap-1.5">
            {displayStages.map((stage, index) => {
              const tone = resolveBarTone(
                stage.key,
                index,
                displayStages.length,
              );
              const percent = Math.max(
                0,
                Math.min(100, Math.round(stage.percent ?? 0)),
              );

              return (
                <li
                  key={stage.key}
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

                  <span className="min-w-[2.25rem] text-right text-[12px] font-semibold tabular-nums text-foreground max-sm:min-w-[2rem] max-sm:text-[11px] sm:min-w-[3.25rem] sm:text-[13px] xl:text-[12px]">
                    {stage.count.toLocaleString("en-IN")}
                  </span>

                  <span
                    className={cn(
                      "min-w-[2rem] text-right text-[11px] tabular-nums max-sm:min-w-[1.75rem] max-sm:text-[10px] sm:min-w-[2.5rem] sm:text-[12px] xl:text-[11px]",
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
