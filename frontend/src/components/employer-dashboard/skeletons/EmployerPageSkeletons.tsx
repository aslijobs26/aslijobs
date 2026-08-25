import { SkeletonBone, SkeletonKpiStrip } from "@/components/shared/skeletons/SkeletonBone";
import { cn } from "@/utils/cn";

const PAGE_PADDING =
  "flex flex-1 flex-col gap-4 px-4 pt-5 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pb-5";

function PageHeaderSkeleton({
  titleWidth = "w-48",
  subtitleWidth = "w-72",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <SkeletonBone className={cn("h-7 rounded-lg", titleWidth)} />
      <SkeletonBone className={cn("h-4 max-w-full rounded", subtitleWidth)} />
    </div>
  );
}

/** Full employer dashboard home layout skeleton. */
export function EmployerDashboardHomeSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading dashboard">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(17rem,20rem)]">
        <div className="min-w-0 space-y-4">
          <SkeletonBone className="h-24 w-full rounded-xl" />
          <SkeletonKpiStrip count={5} />
          <SkeletonBone className="h-52 w-full rounded-xl" />
          <div className="grid gap-4 xl:grid-cols-2">
            <SkeletonBone className="h-64 w-full rounded-xl" />
            <SkeletonBone className="h-64 w-full rounded-xl" />
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.95fr)]">
            <SkeletonBone className="h-72 w-full rounded-xl" />
            <SkeletonBone className="h-72 w-full rounded-xl" />
          </div>
        </div>
        <aside className="min-w-0 space-y-4">
          <SkeletonBone className="h-28 w-full rounded-xl" />
          <SkeletonBone className="h-56 w-full rounded-xl" />
          <SkeletonBone className="h-24 w-full rounded-xl" />
        </aside>
      </div>
    </div>
  );
}

/** KPI strip + split list/detail panel (candidates, interviews). */
export function EmployerSplitPanelPageSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading page">
      <PageHeaderSkeleton />
      <SkeletonKpiStrip count={4} />
      <div className="grid min-h-[28rem] gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <SkeletonBone className="h-full min-h-[20rem] rounded-xl" />
        <SkeletonBone className="h-full min-h-[20rem] rounded-xl" />
      </div>
    </div>
  );
}

/** KPI + table layout (jobs, saved candidates, team tables). */
export function EmployerTablePageSkeleton({ kpiCount = 6 }: { kpiCount?: number }) {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading page">
      <PageHeaderSkeleton />
      <SkeletonKpiStrip count={Math.min(kpiCount, 4)} />
      <SkeletonBone className="h-12 w-full rounded-xl" />
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-0"
          >
            <SkeletonBone className="h-4 w-20 shrink-0" />
            <SkeletonBone className="h-4 flex-1 max-w-xs" />
            <SkeletonBone className="h-4 w-16" />
            <SkeletonBone className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Messages split layout. */
export function EmployerMessagesPageSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading messages">
      <PageHeaderSkeleton />
      <SkeletonKpiStrip count={4} />
      <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-2 rounded-xl border border-border-subtle bg-surface p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBone key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
        <SkeletonBone className="min-h-[24rem] rounded-xl" />
      </div>
    </div>
  );
}

/** Settings two-column layout. */
export function EmployerSettingsPageSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading settings">
      <PageHeaderSkeleton titleWidth="w-36" subtitleWidth="w-96" />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBone key={index} className="h-10 w-28 rounded-lg lg:w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <SkeletonBone className="h-48 w-full rounded-2xl" />
          <SkeletonBone className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Company profile / detail page. */
export function EmployerProfilePageSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading profile">
      <PageHeaderSkeleton titleWidth="w-56" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <SkeletonBone className="h-96 w-full rounded-2xl" />
        <div className="space-y-4">
          <SkeletonBone className="h-40 w-full rounded-2xl" />
          <SkeletonBone className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Generic main-area skeleton while permissions load. */
export function EmployerMainContentSkeleton() {
  return (
    <div className={PAGE_PADDING} aria-busy="true" aria-label="Loading">
      <SkeletonBone className="h-8 w-48 rounded-lg" />
      <SkeletonBone className="mt-4 h-64 w-full rounded-xl" />
    </div>
  );
}

/** Auth bootstrap — full workspace shell before session resolves. */
export function EmployerWorkspaceShellSkeleton() {
  return (
    <div className="min-h-dvh bg-hero-bg" aria-busy="true" aria-label="Loading workspace">
      <aside className="fixed inset-y-0 left-0 hidden w-[var(--employer-sidebar-width,16rem)] border-r border-border-subtle bg-surface p-3 lg:block">
        <SkeletonBone className="h-10 w-32" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBone key={index} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>
      <div className="flex min-h-dvh flex-col lg:pl-[var(--employer-sidebar-width,16rem)]">
        <SkeletonBone className="h-14 w-full shrink-0 rounded-none" />
        <EmployerDashboardHomeSkeleton />
      </div>
    </div>
  );
}

import { ROUTES } from "@/constants/routes";

/** Route-aware main content skeleton while RBAC session loads. */
export function EmployerRouteLoadingSkeleton({
  pathname,
}: {
  pathname: string;
}) {
  if (
    pathname === ROUTES.EMPLOYER_DASHBOARD ||
    pathname.startsWith(`${ROUTES.EMPLOYER_DASHBOARD}/`)
  ) {
    return <EmployerDashboardHomeSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_CANDIDATES ||
    pathname.startsWith(`${ROUTES.EMPLOYER_CANDIDATES}/`)
  ) {
    return <EmployerSplitPanelPageSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_INTERVIEWS ||
    pathname.startsWith(`${ROUTES.EMPLOYER_INTERVIEWS}/`)
  ) {
    return <EmployerSplitPanelPageSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_MESSAGES ||
    pathname.startsWith(`${ROUTES.EMPLOYER_MESSAGES}/`)
  ) {
    return <EmployerMessagesPageSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_SAVED_CANDIDATES ||
    pathname.startsWith(`${ROUTES.EMPLOYER_SAVED_CANDIDATES}/`)
  ) {
    return <EmployerTablePageSkeleton kpiCount={4} />;
  }
  if (
    pathname === ROUTES.EMPLOYER_JOBS ||
    pathname.startsWith(`${ROUTES.EMPLOYER_JOBS}/`)
  ) {
    return <EmployerTablePageSkeleton kpiCount={6} />;
  }
  if (
    pathname === ROUTES.EMPLOYER_SETTINGS ||
    pathname.startsWith(`${ROUTES.EMPLOYER_SETTINGS}/`)
  ) {
    return <EmployerSettingsPageSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_COMPANY_PROFILE ||
    pathname.startsWith(`${ROUTES.EMPLOYER_COMPANY_PROFILE}/`) ||
    pathname === ROUTES.EMPLOYER_TEAM_MEMBER_PROFILE ||
    pathname.startsWith(`${ROUTES.EMPLOYER_TEAM_MEMBER_PROFILE}/`)
  ) {
    return <EmployerProfilePageSkeleton />;
  }
  if (
    pathname === ROUTES.EMPLOYER_TEAM_MANAGEMENT ||
    pathname.startsWith(`${ROUTES.EMPLOYER_TEAM_MANAGEMENT}/`)
  ) {
    return <EmployerTablePageSkeleton kpiCount={4} />;
  }
  return <EmployerMainContentSkeleton />;
}

export function EmployerTableRowsSkeleton({
  rows = 8,
  colSpan = 10,
}: {
  rows?: number;
  colSpan?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-border-subtle/80">
          <td colSpan={colSpan} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <SkeletonBone className="h-4 w-20" />
              <SkeletonBone className="h-4 flex-1 max-w-sm" />
              <SkeletonBone className="h-4 w-16" />
              <SkeletonBone className="h-6 w-14 rounded-full" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
