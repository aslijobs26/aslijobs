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
    <article className="min-w-0 rounded-lg border border-border-subtle bg-surface px-2.5 py-2.5 shadow-sm sm:px-3 sm:py-3 xl:px-4 xl:py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBone className="h-3 w-16 sm:w-20" />
          <SkeletonBone className="h-6 w-10 sm:h-7 sm:w-12 xl:h-8" />
          <SkeletonBone className="h-2.5 w-14" />
        </div>
        <SkeletonBone className="size-8 shrink-0 rounded-md sm:size-9 xl:size-10 xl:rounded-lg" />
      </div>
    </article>
  );
}

function InsightCardSkeleton() {
  return (
    <article className="flex min-w-0 items-start gap-3 rounded-lg border border-border-subtle bg-surface px-3.5 py-4 shadow-sm sm:px-4 sm:py-5">
      <SkeletonBone className="size-9 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2.5">
        <SkeletonBone className="h-3 w-28 sm:w-32" />
        <div className="flex items-end justify-between gap-2">
          <SkeletonBone className="h-5 w-8" />
          <SkeletonBone className="h-3 w-10" />
        </div>
      </div>
    </article>
  );
}

function DateAnalyticsSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm sm:p-3.5">
      <SkeletonBone className="h-2.5 w-40" />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBone key={index} className="h-8 w-20 rounded-md" />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm sm:ml-auto">
        <SkeletonBone className="h-16 rounded-lg" />
        <SkeletonBone className="h-16 rounded-lg" />
      </div>
    </div>
  );
}

function FiltersBarSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow sm:p-3.5">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:gap-2.5">
        <div className="w-full min-w-0 xl:w-[22rem] xl:min-w-[20rem] xl:max-w-[28rem] xl:shrink-0">
          <SkeletonBone className="mb-1 h-2.5 w-12" />
          <SkeletonBone className="h-10 w-full rounded-lg sm:h-9" />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 xl:flex xl:min-w-0 xl:flex-1 xl:gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col gap-1 xl:min-w-[7.5rem] xl:flex-1"
            >
              <SkeletonBone className="h-2.5 w-12" />
              <SkeletonBone className="h-10 w-full rounded-lg sm:h-9" />
            </div>
          ))}
        </div>
        <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center xl:border-l xl:border-border-subtle xl:pl-3">
          <SkeletonBone className="h-10 w-full rounded-lg sm:h-9 sm:w-20" />
          <SkeletonBone className="h-10 w-full rounded-lg sm:h-9 sm:w-24" />
        </div>
      </div>
    </div>
  );
}

function TabsSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <SkeletonBone
          key={index}
          className="h-8 w-[4.5rem] shrink-0 rounded-md sm:h-9 sm:w-24"
        />
      ))}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border-subtle/80 last:border-0">
      <td className="px-3 py-3 first:pl-4 sm:px-3.5">
        <SkeletonBone className="h-3 w-14" />
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <div className="flex items-center gap-2.5">
          <SkeletonBone className="size-8 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonBone className="h-3.5 w-28" />
            <SkeletonBone className="h-2.5 w-36" />
          </div>
        </div>
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <div className="space-y-1.5">
          <SkeletonBone className="h-3.5 w-32" />
          <SkeletonBone className="h-2.5 w-20" />
        </div>
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <SkeletonBone className="h-3 w-28" />
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <SkeletonBone className="h-5 w-20 rounded-full" />
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <div className="space-y-1.5">
          <SkeletonBone className="h-3 w-20" />
          <SkeletonBone className="h-2.5 w-14" />
        </div>
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <SkeletonBone className="h-3 w-16" />
      </td>
      <td className="px-3 py-3 sm:px-3.5">
        <SkeletonBone className="h-3 w-24" />
      </td>
      <td className="px-3 py-3 last:pr-4 sm:px-3.5">
        <SkeletonBone className="ml-auto size-8 rounded-lg" />
      </td>
    </tr>
  );
}

function MobileCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-border-subtle/80 bg-hero-bg/35 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBone className="h-4 w-36 max-w-full" />
            <SkeletonBone className="h-2.5 w-20" />
          </div>
          <SkeletonBone className="size-8 shrink-0 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <SkeletonBone className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonBone className="h-3 w-32" />
            <SkeletonBone className="h-2.5 w-20" />
          </div>
        </div>
        <SkeletonBone className="h-5 w-20 rounded-full" />
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg bg-hero-bg/60 px-2 py-2">
              <SkeletonBone className="h-2 w-12" />
              <SkeletonBone className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

function PaginationSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <SkeletonBone className="mx-auto h-3 w-44 sm:mx-0" />
      <div className="flex items-center justify-center gap-1.5 sm:justify-end">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBone key={index} className="size-8 rounded-md" />
        ))}
        <SkeletonBone className="ml-1 h-8 w-[4.5rem] rounded-md" />
      </div>
    </div>
  );
}

interface CandidatesPageSkeletonProps {
  rowCount?: number;
}

/** Full Candidates page placeholder matching live layout dimensions. */
export function CandidatesPageSkeleton({
  rowCount = 8,
}: CandidatesPageSkeletonProps) {
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-2.5"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading candidates"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
      </div>

      <DateAnalyticsSkeleton />

      <div className="grid grid-cols-1 gap-2 min-[540px]:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <InsightCardSkeleton key={index} />
        ))}
      </div>

      <FiltersBarSkeleton />

      <div className="min-w-0 max-w-full rounded-xl border border-border-subtle bg-surface shadow-sm">
        <div className="min-w-0 border-b border-border-subtle px-2.5 py-2 sm:px-3.5 sm:py-3">
          <TabsSkeleton />
        </div>

        <div className="min-w-0 max-w-full">
          <ul className="flex flex-col gap-2.5 p-2.5 sm:hidden">
            {Array.from({ length: Math.min(rowCount, 4) }).map((_, index) => (
              <MobileCardSkeleton key={index} />
            ))}
          </ul>

          <div className="hidden min-w-0 max-w-full overflow-x-auto overscroll-x-contain scrollbar-hidden lg:block">
            <table className="w-full min-w-[1080px] border-collapse text-left text-xs leading-snug xl:min-w-[1140px]">
              <thead>
                <tr className="ops-brand-border-glow border-y border-border-subtle bg-hero-bg/40">
                  {[
                    "Candidate ID",
                    "Candidate",
                    "Applied Job",
                    "Employer",
                    "Status",
                    "Applied On",
                    "Experience",
                    "Location",
                    "",
                  ].map((label, index) => (
                    <th
                      key={label || `actions-${index}`}
                      className="whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5"
                    >
                      {label ? (
                        <span className="opacity-70">{label}</span>
                      ) : (
                        <span className="sr-only">Actions</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCount }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PaginationSkeleton />
    </div>
  );
}
