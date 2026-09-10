import { cn } from "../../../utils/cn";

function SkeletonBone({ className }: { className?: string }) {
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

function KpiCardSkeleton() {
  return (
    <article className="flex min-w-0 items-start gap-2.5 rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3">
      <SkeletonBone className="size-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBone className="h-6 w-14" />
        <SkeletonBone className="h-3 w-24" />
        <SkeletonBone className="h-3 w-20" />
      </div>
    </article>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-3.5 shadow-sm sm:p-4">
      <SkeletonBone className="mb-1 h-4 w-32" />
      <SkeletonBone className="mb-4 h-3 w-40" />
      <SkeletonBone className="h-44 w-full rounded-lg" />
    </div>
  );
}

export function PlacementsPageSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2"
      role="status"
      aria-busy="true"
      aria-label="Loading placements overview"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <SkeletonBone className="h-3 w-28" />
          <SkeletonBone className="h-6 w-56" />
          <SkeletonBone className="h-3 w-80 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <SkeletonBone className="h-8 w-36 rounded-md" />
          <SkeletonBone className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ChartCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_16.5rem]">
        <ChartCardSkeleton />
        <div className="flex flex-col gap-3">
          <ChartCardSkeleton />
          <SkeletonBone className="h-36 w-full rounded-xl" />
        </div>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="space-y-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <SkeletonBone className="h-4 w-48" />
          <SkeletonBone className="h-8 w-full max-w-xl rounded-md" />
        </div>
        <div className="space-y-2 p-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBone key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
