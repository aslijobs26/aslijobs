import { cn } from "../../../../utils/cn";
import { JOBS_ANALYTICS_CARD_CLASS } from "./jobs-analytics-theme";

function Bone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse rounded-md bg-[color-mix(in_srgb,var(--color-foreground)_8%,var(--color-surface))]",
        className,
      )}
    />
  );
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn(JOBS_ANALYTICS_CARD_CLASS, className)}>
      <Bone className="h-4 w-28" />
      <Bone className="mt-4 h-40 w-full rounded-2xl" />
    </section>
  );
}

export function JobsAnalyticsKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <article
          key={index}
          className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-3 w-16 sm:w-20" />
              <Bone className="h-6 w-10 sm:h-7 sm:w-12" />
            </div>
            <Bone className="size-9 shrink-0 rounded-lg" />
          </div>
          <Bone className="mt-3 h-3 w-24" />
        </article>
      ))}
    </div>
  );
}

export function JobsAnalyticsSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-2.5"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading jobs analytics"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Bone className="h-5 w-32" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Bone key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}
