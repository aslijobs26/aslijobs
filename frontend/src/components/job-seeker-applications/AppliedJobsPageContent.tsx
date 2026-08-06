"use client";

import { AppliedJobCard } from "@/components/job-seeker-applications/AppliedJobCard";
import { AppliedJobsFiltersPanel } from "@/components/job-seeker-applications/AppliedJobsFiltersPanel";
import { AppliedJobsSidebar } from "@/components/job-seeker-applications/AppliedJobsSidebar";
import { AppliedJobsSortSelect } from "@/components/job-seeker-applications/AppliedJobsSortSelect";
import { AppliedJobsStatsBar } from "@/components/job-seeker-applications/AppliedJobsStatsBar";
import {
  APPLIED_JOBS_FILTER_WINDOW_SIZE,
  APPLIED_JOBS_PAGE_SIZE,
  buildApplicationFilterFacets,
  countAdvancedFilters,
  parseSortParam,
  parseStatsFilterParam,
  resolveBackendSort,
  resolveBackendStatus,
  resolveBackendStatuses,
  type AppliedJobsAdvancedFilters,
  type AppliedJobsSort,
  type AppliedJobsStatsFilter,
} from "@/components/job-seeker-applications/applied-jobs-utils";
import { ListPagination } from "@/components/shared/ListPagination";
import { ROUTES } from "@/constants/routes";
import {
  fetchSeekerApplicationStats,
  fetchSeekerApplications,
} from "@/services/job-seeker-applications.service";
import {
  fetchNotifications,
  notificationQueryKeys,
} from "@/services/notifications.service";
import { cn } from "@/utils/cn";
import {
  normalizeListPagination,
  resolveEmptyPageFallback,
} from "@/utils/list-pagination";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Briefcase, Filter, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

type AppliedJobsPageContentProps = {
  showBackLink?: boolean;
};

export function AppliedJobsPageContent({
  showBackLink = false,
}: AppliedJobsPageContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const statsFilter = parseStatsFilterParam(searchParams.get("status"));
  const sort = parseSortParam(searchParams.get("sort"));
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const searchFromUrl = searchParams.get("q") ?? "";

  const filtersFromUrl = useMemo<AppliedJobsAdvancedFilters>(
    () => ({
      location: searchParams.get("location") ?? "",
      jobType: searchParams.get("jobType") ?? "",
      workMode: searchParams.get("workMode") ?? "",
      company: searchParams.get("company") ?? "",
      shift: searchParams.get("shift") ?? "",
      appliedFrom: searchParams.get("appliedFrom") ?? "",
      appliedTo: searchParams.get("appliedTo") ?? "",
      minSalary: searchParams.get("minSalary") ?? "",
    }),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<AppliedJobsAdvancedFilters>(filtersFromUrl);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    setAdvancedFilters(filtersFromUrl);
  }, [filtersFromUrl]);

  const writeFiltersToParams = (
    params: URLSearchParams,
    filters: AppliedJobsAdvancedFilters,
  ) => {
    const entries: Array<[keyof AppliedJobsAdvancedFilters, string]> = [
      ["location", filters.location],
      ["jobType", filters.jobType],
      ["workMode", filters.workMode],
      ["company", filters.company],
      ["shift", filters.shift],
      ["appliedFrom", filters.appliedFrom],
      ["appliedTo", filters.appliedTo],
      ["minSalary", filters.minSalary],
    ];

    for (const [key, value] of entries) {
      const trimmed = value.trim();
      if (!trimmed) {
        params.delete(key);
      } else {
        params.set(key, trimmed);
      }
    }
  };

  const updateUrl = (next: {
    status?: AppliedJobsStatsFilter;
    sort?: AppliedJobsSort;
    q?: string;
    page?: number;
    filters?: AppliedJobsAdvancedFilters;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const status = next.status ?? statsFilter;
    const nextSort = next.sort ?? sort;
    const q = next.q !== undefined ? next.q : debouncedSearch;
    const nextPage = next.page ?? page;
    const nextFilters = next.filters ?? advancedFilters;

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    if (nextSort === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    if (!q) {
      params.delete("q");
    } else {
      params.set("q", q);
    }

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    writeFiltersToParams(params, nextFilters);

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    if (debouncedSearch === (searchParams.get("q") ?? "")) {
      return;
    }
    updateUrl({ q: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search → URL
  }, [debouncedSearch]);

  const statsQuery = useQuery({
    queryKey: ["job-seeker", "application-stats"],
    queryFn: fetchSeekerApplicationStats,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const notificationsQuery = useQuery({
    queryKey: [
      ...notificationQueryKeys.recent("job-seeker"),
      "applications-sidebar",
      "latest",
    ],
    queryFn: () =>
      fetchNotifications({
        page: 1,
        limit: 20,
        readStatus: "all",
      }),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const backendStatus = resolveBackendStatus(statsFilter);
  const backendStatuses = resolveBackendStatuses(statsFilter);
  const backendSort = resolveBackendSort(sort);

  const listParams = useMemo(
    () => ({
      status: backendStatus,
      statuses: backendStatuses,
      search: debouncedSearch || undefined,
      sort: backendSort,
      location: advancedFilters.location.trim() || undefined,
      company: advancedFilters.company.trim() || undefined,
      jobType: advancedFilters.jobType.trim() || undefined,
      workMode: advancedFilters.workMode.trim() || undefined,
      shift: advancedFilters.shift.trim() || undefined,
      minSalary: advancedFilters.minSalary.trim()
        ? Number(advancedFilters.minSalary)
        : undefined,
      appliedFrom: advancedFilters.appliedFrom.trim() || undefined,
      appliedTo: advancedFilters.appliedTo.trim() || undefined,
      page,
      limit: APPLIED_JOBS_PAGE_SIZE,
    }),
    [
      backendStatus,
      backendStatuses,
      debouncedSearch,
      backendSort,
      advancedFilters,
      page,
    ],
  );

  const listQuery = useQuery({
    queryKey: ["job-seeker", "applications", "list", listParams],
    queryFn: () => fetchSeekerApplications(listParams),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });

  /** Facets only — never used as the primary list source while the drawer is open. */
  const facetCatalogQuery = useQuery({
    queryKey: [
      "job-seeker",
      "applications",
      "filter-catalog",
      backendStatus ?? `group-${statsFilter}`,
      backendStatuses,
      debouncedSearch,
    ],
    queryFn: () =>
      fetchSeekerApplications({
        status: backendStatus,
        statuses: backendStatuses,
        search: debouncedSearch || undefined,
        sort: "newest",
        page: 1,
        limit: APPLIED_JOBS_FILTER_WINDOW_SIZE,
      }),
    enabled: filtersOpen,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const applications = listQuery.data?.applications ?? [];
  const pagination = normalizeListPagination(
    listQuery.data?.pagination,
    APPLIED_JOBS_PAGE_SIZE,
  );

  const facetOptions = useMemo(() => {
    const source =
      facetCatalogQuery.data?.applications ??
      listQuery.data?.applications ??
      [];
    return buildApplicationFilterFacets(source);
  }, [facetCatalogQuery.data?.applications, listQuery.data?.applications]);
  const hasListData = Boolean(listQuery.data?.applications);
  const isInitialLoading =
    listQuery.isLoading && !hasListData && !listQuery.isPlaceholderData;
  const isRefreshing = listQuery.isFetching && hasListData;
  const activeFilterCount = countAdvancedFilters(advancedFilters);

  useEffect(() => {
    if (!listQuery.isSuccess || listQuery.isFetching) {
      return;
    }
    const nextPage = resolveEmptyPageFallback(page, pagination.totalPages);
    if (nextPage !== page) {
      updateUrl({ page: nextPage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    listQuery.isSuccess,
    listQuery.isFetching,
    page,
    pagination.totalPages,
    applications.length,
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {showBackLink ? (
        <div className="mb-4">
          <Link
            href={ROUTES.JOB_SEEKER_DASHBOARD}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Back to dashboard
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              My Applications
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              Track and manage all your job applications in one place.
            </p>
          </header>

          <div className="mt-5">
            <AppliedJobsStatsBar
              activeFilter={statsFilter}
              stats={statsQuery.data}
              isLoading={statsQuery.isLoading}
              onChange={(filter) => {
                updateUrl({ status: filter, page: 1 });
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <label htmlFor="my-applications-search" className="sr-only">
                Search by job title or company
              </label>
              <input
                id="my-applications-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by Job Title or Company"
                className={cn(
                  "h-11 w-full rounded-xl border border-border bg-surface py-2.5 pr-3 pl-10 text-sm text-foreground shadow-sm placeholder:text-muted",
                  "outline-none transition-[border-color,box-shadow] hover:border-primary/25",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                )}
                autoComplete="off"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-xl border bg-surface px-4 text-sm font-semibold shadow-sm transition-[border-color,background-color,box-shadow]",
                  "outline-none hover:border-primary/25 hover:bg-primary-light/30",
                  "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
                  activeFilterCount > 0
                    ? "border-primary text-primary"
                    : "border-border text-foreground",
                )}
              >
                <Filter className="size-4 shrink-0" aria-hidden="true" />
                <span>Filters</span>
                {activeFilterCount > 0 ? (
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-surface">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <AppliedJobsSortSelect
                value={sort}
                onChange={(nextSort) => {
                  updateUrl({ sort: nextSort, page: 1 });
                }}
              />
            </div>
          </div>

          {isRefreshing ? (
            <p className="mt-3 text-xs text-muted" aria-live="polite">
              Updating applications…
            </p>
          ) : null}

          <div className="mt-5">
            {isInitialLoading ? (
              <AppliedJobsSkeletonList />
            ) : listQuery.isError && applications.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface px-4 py-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  Couldn&apos;t load your applications
                </p>
                <p className="mt-1 text-sm text-muted">
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  onClick={() => void listQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : applications.length === 0 ? (
              <EmptyAppliedJobsState
                hasFilters={Boolean(
                  debouncedSearch ||
                    statsFilter !== "all" ||
                    activeFilterCount > 0,
                )}
              />
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {applications.map((application) => (
                    <AppliedJobCard
                      key={application.id}
                      application={application}
                    />
                  ))}
                </div>

                <ListPagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={(nextPage) => updateUrl({ page: nextPage })}
                  isLoading={listQuery.isFetching}
                  ariaLabel="Applications pagination"
                  entityLabel="applications"
                />
              </>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <AppliedJobsSidebar
            stats={statsQuery.data}
            statsLoading={statsQuery.isLoading}
            notifications={notificationsQuery.data?.notifications ?? []}
            notificationsLoading={notificationsQuery.isLoading}
          />
        </div>
      </div>

      <AppliedJobsFiltersPanel
        open={filtersOpen}
        filters={advancedFilters}
        locations={facetOptions.locations}
        companies={facetOptions.companies}
        jobTypes={facetOptions.jobTypes}
        workModes={facetOptions.workModes}
        shifts={facetOptions.shifts}
        onApply={(next) => {
          setAdvancedFilters(next);
          updateUrl({ page: 1, filters: next });
        }}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}

function AppliedJobsSkeletonList() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading applications">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-border-subtle bg-surface p-5"
        >
          <div className="flex gap-3">
            <div className="size-12 rounded-lg bg-primary-light/70" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-primary-light/70" />
              <div className="h-3 w-1/2 rounded bg-primary-light/50" />
              <div className="h-3 w-4/5 rounded bg-primary-light/40" />
            </div>
            <div className="h-7 w-24 rounded-full bg-primary-light/50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyAppliedJobsState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="rounded-xl border border-border-subtle bg-surface px-4 py-12 text-center">
        <Briefcase className="mx-auto size-10 text-muted" aria-hidden="true" />
        <h2 className="mt-4 text-base font-semibold text-foreground">
          No matching applications
        </h2>
        <p className="mt-1 text-sm text-muted">
          Try a different search, status pill, or clear filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-4 py-14 text-center sm:px-8">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-light">
        <Briefcase className="size-8 text-primary" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        No Applications Yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Browse open roles and apply with your AsliJobs resume. Your applications
        will show up here with live hiring status.
      </p>
      <Link
        href={ROUTES.FIND_JOBS}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Browse Jobs
      </Link>
    </div>
  );
}
