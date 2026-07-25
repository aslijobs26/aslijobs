"use client";

import { AppliedJobCard } from "@/components/job-seeker-applications/AppliedJobCard";
import { AppliedJobsStatsBar } from "@/components/job-seeker-applications/AppliedJobsStatsBar";
import {
  APPLIED_JOBS_PAGE_SIZE,
  filterByStatsGroup,
  matchesAppliedJobsSearch,
  resolveBackendSort,
  resolveBackendStatus,
  sortAppliedJobs,
  type AppliedJobsSort,
  type AppliedJobsStatsFilter,
} from "@/components/job-seeker-applications/applied-jobs-utils";
import { ROUTES } from "@/constants/routes";
import {
  fetchSeekerApplicationStats,
  fetchSeekerApplications,
} from "@/services/job-seeker-applications.service";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function AppliedJobsPageContent() {
  const [searchInput, setSearchInput] = useState("");
  const [statsFilter, setStatsFilter] =
    useState<AppliedJobsStatsFilter>("all");
  const [sort, setSort] = useState<AppliedJobsSort>("newest");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statsFilter, sort]);

  const statsQuery = useQuery({
    queryKey: ["job-seeker", "application-stats"],
    queryFn: fetchSeekerApplicationStats,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const backendStatus = resolveBackendStatus(statsFilter);
  const needsClientStatusGroup = statsFilter === "interview";
  const backendSort = resolveBackendSort(sort);
  const usesClientSort = sort === "updated" || sort === "company";

  const listQuery = useQuery({
    queryKey: [
      "job-seeker",
      "applications",
      backendStatus ?? (needsClientStatusGroup ? "group-interview" : "all"),
      debouncedSearch,
      backendSort,
      usesClientSort || needsClientStatusGroup ? "client-window" : page,
      usesClientSort || needsClientStatusGroup ? "wide" : APPLIED_JOBS_PAGE_SIZE,
    ],
    queryFn: () =>
      fetchSeekerApplications({
        status: backendStatus,
        search: debouncedSearch || undefined,
        sort: backendSort,
        page:
          usesClientSort || needsClientStatusGroup ? 1 : page,
        limit:
          usesClientSort || needsClientStatusGroup
            ? 100
            : APPLIED_JOBS_PAGE_SIZE,
      }),
    staleTime: 20_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  });

  const processed = useMemo(() => {
    let items = listQuery.data?.applications ?? [];

    items = items.filter((item) =>
      matchesAppliedJobsSearch(item, debouncedSearch),
    );
    items = filterByStatsGroup(items, statsFilter);
    items = sortAppliedJobs(items, sort);

    if (usesClientSort || needsClientStatusGroup) {
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / APPLIED_JOBS_PAGE_SIZE));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * APPLIED_JOBS_PAGE_SIZE;
      return {
        applications: items.slice(start, start + APPLIED_JOBS_PAGE_SIZE),
        pagination: {
          page: safePage,
          limit: APPLIED_JOBS_PAGE_SIZE,
          total,
          totalPages,
        },
      };
    }

    return {
      applications: items,
      pagination: listQuery.data?.pagination ?? {
        page: 1,
        limit: APPLIED_JOBS_PAGE_SIZE,
        total: items.length,
        totalPages: 1,
      },
    };
  }, [
    listQuery.data,
    debouncedSearch,
    statsFilter,
    sort,
    page,
    usesClientSort,
    needsClientStatusGroup,
  ]);

  const applications = processed.applications;
  const pagination = processed.pagination;
  const isInitialLoading = listQuery.isLoading && !listQuery.data;
  const isRefreshing = listQuery.isFetching && !!listQuery.data;

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Applied Jobs
          </h1>
          <p className="mt-1 text-sm text-muted sm:text-base">
            Track every application you&apos;ve submitted.
          </p>
        </div>
        <Link
          href={ROUTES.FIND_JOBS}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Browse Jobs
        </Link>
      </header>

      <div className="mt-6">
        <AppliedJobsStatsBar
          activeFilter={statsFilter}
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
          onChange={setStatsFilter}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <label htmlFor="applied-jobs-search" className="sr-only">
            Search company, job, or location
          </label>
          <input
            id="applied-jobs-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search company, job, or location"
            className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pr-3 pl-10 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            autoComplete="off"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="applied-jobs-sort">
            Sort applications
          </label>
          <select
            id="applied-jobs-sort"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as AppliedJobsSort)
            }
            className="min-h-10 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="updated">Recently updated</option>
            <option value="company">Alphabetical company</option>
          </select>
        </div>
      </div>

      {isRefreshing ? (
        <p className="mt-3 text-xs text-muted" aria-live="polite">
          Updating applications…
        </p>
      ) : null}

      <div className="mt-6">
        {isInitialLoading ? (
          <AppliedJobsSkeletonGrid />
        ) : listQuery.isError ? (
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
          <EmptyAppliedJobsState hasFilters={Boolean(debouncedSearch || statsFilter !== "all")} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
              {applications.map((application) => (
                <AppliedJobCard
                  key={application.id}
                  application={application}
                />
              ))}
            </div>

            {pagination.totalPages > 1 ? (
              <nav
                className="mt-6 flex flex-wrap items-center justify-between gap-3"
                aria-label="Applications pagination"
              >
                <p className="text-sm text-muted">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(pagination.page - 1) * pagination.limit + 1}
                    –
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {pagination.total}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className={cn(
                      "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground",
                      "hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pagination.totalPages, current + 1),
                      )
                    }
                    className={cn(
                      "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground",
                      "hover:bg-primary-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    Next
                  </button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function AppliedJobsSkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 gap-3 md:grid-cols-2"
      aria-busy="true"
      aria-label="Loading applications"
    >
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
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full rounded bg-primary-light/40" />
            <div className="h-3 w-4/5 rounded bg-primary-light/40" />
          </div>
          <div className="mt-5 h-8 w-28 rounded-lg bg-primary-light/60" />
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
          Try a different search term or clear the status filter.
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
        You haven&apos;t applied for any jobs yet.
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
