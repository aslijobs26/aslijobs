import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../../constants/operations-routes";
import type { OperationsEmployersAnalyticsNamedCount } from "../../../../types/operations-employers";
import { cn } from "../../../../utils/cn";

interface TopHiringLocationsProps {
  items: OperationsEmployersAnalyticsNamedCount[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function formatLocationLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "unspecified") {
    return "Unspecified";
  }
  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function TopHiringLocations({
  items,
  isLoading = false,
  isError = false,
  onRetry,
}: TopHiringLocationsProps) {
  const topItems = items
    .filter((item) => item.count > 0 && item.label.toLowerCase() !== "unspecified")
    .slice(0, 5);

  return (
    <section className="employers-analytics-card operations-density-card flex h-full min-w-0 flex-col rounded-xl border border-border-subtle bg-surface shadow-sm">
      <header className="flex shrink-0 items-center justify-between gap-2 px-3.5 pt-3 sm:px-4 sm:pt-3.5">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
          Top Hiring Locations
        </h3>
        <Link
          to={OPERATIONS_ROUTES.JOBS}
          className="shrink-0 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:text-[11px]"
        >
          View all
        </Link>
      </header>

      <div className="min-h-0 flex-1 px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4">
        {isLoading ? (
          <ul className="divide-y divide-border-subtle" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <li
                key={index}
                className="flex animate-pulse items-center justify-between gap-3 py-2.5 xl:py-2"
              >
                <span className="flex items-center gap-2.5">
                  <span className="size-3.5 rounded bg-hero-bg" />
                  <span className="h-3 w-24 rounded bg-hero-bg" />
                </span>
                <span className="h-3 w-8 rounded bg-hero-bg" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="flex min-h-[11rem] flex-col items-center justify-center gap-2 text-center xl:min-h-36">
            <p className="text-[12px] text-muted">
              Unable to load hiring locations
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
        ) : topItems.length === 0 ? (
          <p className="flex min-h-[11rem] items-center justify-center text-center text-xs text-muted xl:min-h-36">
            No hiring location data available
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {topItems.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex min-w-0 items-center justify-between gap-3 py-2.5 text-[12px] xl:py-2 xl:text-[11px]",
                )}
              >
                <span className="inline-flex min-w-0 items-center gap-2.5 font-medium text-foreground">
                  <MapPin
                    className="size-3.5 shrink-0 text-foreground xl:size-3"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {formatLocationLabel(item.label)}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums font-semibold text-foreground">
                  {item.count.toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
