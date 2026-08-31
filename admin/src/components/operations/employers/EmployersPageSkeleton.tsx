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
    <article className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3">
      <div className="flex items-start justify-between gap-1.5">
        <SkeletonBone className="size-7 rounded-lg sm:size-8" />
      </div>
      <div className="mt-2 space-y-1.5">
        <SkeletonBone className="h-3 w-16 sm:w-20" />
        <SkeletonBone className="h-6 w-12 sm:h-7" />
        <SkeletonBone className="h-2.5 w-14" />
      </div>
    </article>
  );
}

function DateAnalyticsSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3.5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <SkeletonBone className="h-2.5 w-48" />
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBone key={index} className="h-8 w-20 shrink-0 rounded-md" />
            ))}
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 min-[480px]:grid-cols-3 md:grid-cols-5 xl:w-auto xl:min-w-[32rem] 2xl:min-w-[35rem]">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBone key={index} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function FiltersBarSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <div className="w-full min-w-0 xl:w-[22rem] xl:shrink-0">
          <SkeletonBone className="mb-1 h-2.5 w-12" />
          <SkeletonBone className="h-10 w-full rounded-lg sm:h-9" />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col gap-1 xl:min-w-[8.5rem] xl:flex-1"
            >
              <SkeletonBone className="h-2.5 w-14" />
              <SkeletonBone className="h-10 w-full rounded-lg sm:h-9" />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1 xl:pt-0">
          <SkeletonBone className="h-10 w-20 rounded-lg sm:h-9" />
        </div>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border-subtle">
      <td className="py-3.5 pl-4 pr-3 sm:pr-3.5">
        <div className="flex items-center gap-2.5">
          <SkeletonBone className="size-9 shrink-0 rounded-full" />
          <div className="space-y-1">
            <SkeletonBone className="h-3.5 w-28" />
            <SkeletonBone className="h-2.5 w-16" />
          </div>
        </div>
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <div className="space-y-1">
          <SkeletonBone className="h-3 w-24" />
          <SkeletonBone className="h-2.5 w-32" />
        </div>
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <SkeletonBone className="h-3 w-24" />
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <SkeletonBone className="h-3 w-28" />
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <div className="space-y-1">
          <SkeletonBone className="h-3 w-20" />
          <SkeletonBone className="h-2.5 w-14" />
        </div>
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <div className="space-y-1">
          <SkeletonBone className="h-5 w-16 rounded-full" />
          <SkeletonBone className="h-2.5 w-16" />
        </div>
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <SkeletonBone className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-3 py-3.5 sm:px-3.5">
        <SkeletonBone className="h-4 w-6" />
      </td>
      <td className="py-3.5 pl-3 pr-4 text-right sm:pl-3.5">
        <SkeletonBone className="ml-auto h-7 w-20 rounded-md" />
      </td>
    </tr>
  );
}

export function EmployersPageSkeleton() {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label="Loading employers dashboard"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <DateAnalyticsSkeleton />
      <FiltersBarSkeleton />

      <div className="rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4">
          <SkeletonBone className="h-4 w-32" />
        </div>
        <div className="hidden sm:block">
          <table className="min-w-full">
            <tbody className="divide-y divide-border-subtle">
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 p-3 sm:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBone key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
