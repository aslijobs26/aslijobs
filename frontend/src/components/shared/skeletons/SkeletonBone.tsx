import { cn } from "@/utils/cn";

type SkeletonBoneProps = {
  className?: string;
};

/** Subtle pulse block aligned with AsliJobs dashboard tokens. */
export function SkeletonBone({ className }: SkeletonBoneProps) {
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

export function SkeletonKpiValue({ className }: SkeletonBoneProps) {
  return (
    <SkeletonBone
      className={cn("h-7 w-12 rounded-md sm:h-8 sm:w-14", className)}
    />
  );
}

export function SkeletonKpiStrip({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-3 w-24" />
              <SkeletonBone className="h-2.5 w-16" />
            </div>
            <SkeletonBone className="size-7 shrink-0 rounded-lg sm:size-9" />
          </div>
          <SkeletonKpiValue className="mt-2 sm:mt-3" />
        </article>
      ))}
    </div>
  );
}
