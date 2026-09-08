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
    <article className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-3 shadow-sm sm:p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <SkeletonBone className="h-3 w-20" />
          <SkeletonBone className="h-7 w-14" />
        </div>
        <SkeletonBone className="size-9 rounded-lg" />
      </div>
      <SkeletonBone className="mt-3 h-3 w-24" />
    </article>
  );
}

export function VerificationsPageSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading employer verifications"
    >
      <div className="space-y-2">
        <SkeletonBone className="h-6 w-56" />
        <SkeletonBone className="h-3 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="space-y-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <SkeletonBone className="h-4 w-48" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBone key={index} className="h-8 w-24 rounded-md" />
            ))}
          </div>
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
