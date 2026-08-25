import { SkeletonBone, SkeletonKpiStrip } from "@/components/shared/skeletons/SkeletonBone";
import { cn } from "@/utils/cn";

const PAGE_SHELL =
  "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8";

function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBone className="h-8 w-56 rounded-lg" />
      <SkeletonBone className="h-4 w-80 max-w-full rounded" />
    </div>
  );
}

/** Profile hub (de facto dashboard). */
export function JobSeekerProfilePageSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading profile">
      <div className="animate-pulse space-y-5">
        <div className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SkeletonBone className="size-20 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-6 w-48" />
              <SkeletonBone className="h-4 w-64 max-w-full" />
              <SkeletonBone className="h-4 w-40" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <SkeletonBone className="h-10 w-full rounded-lg" />
            <SkeletonBone className="h-72 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <SkeletonBone className="h-56 w-full rounded-2xl" />
            <SkeletonBone className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-border-subtle bg-surface p-5"
        >
          <div className="flex gap-3">
            <SkeletonBone className="size-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-4 w-3/5 max-w-xs" />
              <SkeletonBone className="h-3 w-2/5 max-w-[12rem]" />
              <SkeletonBone className="h-3 w-1/3 max-w-[8rem]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Applied jobs / saved jobs list pages. */
export function JobSeekerListPageSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading">
      <PageHeaderSkeleton />
      <SkeletonBone className="mt-4 h-10 w-full rounded-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <CardListSkeleton count={4} />
        <div className="space-y-4">
          <SkeletonBone className="h-32 w-full rounded-xl" />
          <SkeletonBone className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function JobSeekerNotificationsPageSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading notifications">
      <PageHeaderSkeleton />
      <SkeletonBone className="mt-4 h-10 w-full max-w-md rounded-full" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBone key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <SkeletonBone className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function JobSeekerResumePageSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading resume">
      <PageHeaderSkeleton />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <SkeletonBone className="min-h-[32rem] w-full rounded-2xl" />
        <div className="space-y-4">
          <SkeletonBone className="h-40 w-full rounded-2xl" />
          <SkeletonBone className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function JobSeekerSettingsPageSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading settings">
      <SkeletonBone className="h-8 w-40 rounded-lg" />
      <SkeletonBone className="mt-2 h-4 w-72 max-w-full rounded" />
      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBone key={index} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <SkeletonBone className="h-64 w-full rounded-2xl" />
        <div className="space-y-4">
          <SkeletonBone className="h-40 w-full rounded-2xl" />
          <SkeletonBone className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function JobSeekerApplicationDetailSkeleton() {
  return (
    <div className={PAGE_SHELL} aria-busy="true" aria-label="Loading application">
      <SkeletonBone className="h-8 w-32 rounded-lg" />
      <SkeletonBone className="mt-4 h-40 w-full rounded-2xl" />
      <SkeletonBone className="mt-4 h-64 w-full rounded-2xl" />
    </div>
  );
}

export function JobSeekerWorkspaceShellSkeleton() {
  return (
    <div className="min-h-dvh bg-hero-bg" aria-busy="true" aria-label="Loading workspace">
      <aside className="fixed inset-y-0 left-0 hidden w-[var(--seeker-sidebar-width,16rem)] border-r border-border-subtle bg-surface p-3 lg:block">
        <SkeletonBone className="h-10 w-32" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBone key={index} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col lg:pl-[var(--seeker-sidebar-width,16rem)]">
        <SkeletonBone className="h-14 w-full shrink-0" />
        <JobSeekerProfilePageSkeleton />
      </div>
    </div>
  );
}

export { CardListSkeleton as JobSeekerCardListSkeleton };

/** Compact list rows inside profile activity tab sections. */
export function JobSeekerActivityListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <ul className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="flex gap-3 py-1">
          <SkeletonBone className="size-4 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBone className="h-3.5 w-3/5 max-w-xs" />
            <SkeletonBone className="h-3 w-2/5 max-w-[10rem]" />
          </div>
        </li>
      ))}
    </ul>
  );
}
