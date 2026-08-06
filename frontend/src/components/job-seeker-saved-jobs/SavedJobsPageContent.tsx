"use client";

import { SavedJobCard } from "@/components/job-seeker-saved-jobs/SavedJobCard";
import { SavedJobsSidebar } from "@/components/job-seeker-saved-jobs/SavedJobsSidebar";
import { SavedJobsSortSelect } from "@/components/job-seeker-saved-jobs/SavedJobsSortSelect";
import { SavedJobsStatsBar } from "@/components/job-seeker-saved-jobs/SavedJobsStatsBar";
import {
  EMPTY_SAVED_JOBS_FILTERS,
  SAVED_JOBS_PAGE_SIZE,
  parseSavedJobsSort,
  parseSavedJobsTab,
} from "@/components/job-seeker-saved-jobs/saved-jobs-utils";
import { ListPagination } from "@/components/shared/ListPagination";
import { ROUTES } from "@/constants/routes";
import {
  fetchSavedJobs,
  removeSavedJob,
  savedJobsQueryKeys,
} from "@/services/saved-jobs.service";
import type {
  SavedJobsAdvancedFilters,
  SavedJobsSort,
  SavedJobsStatsFilter,
} from "@/types/saved-jobs";
import { cn } from "@/utils/cn";
import {
  normalizeListPagination,
  resolveEmptyPageFallback,
} from "@/utils/list-pagination";
import { showAppToast } from "@/utils/share-job";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark, Search } from "lucide-react";
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

function SavedJobsSkeletonList() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`saved-skel-${index}`}
          className="animate-pulse rounded-xl border border-border-subtle bg-surface p-5"
        >
          <div className="flex gap-4">
            <div className="size-14 rounded-lg bg-primary-light/40" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-primary-light/40" />
              <div className="h-3 w-1/3 rounded bg-primary-light/30" />
              <div className="h-3 w-1/2 rounded bg-primary-light/25" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SavedJobsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const tab = parseSavedJobsTab(searchParams.get("tab"));
  const sort = parseSavedJobsSort(searchParams.get("sort"));
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const searchFromUrl = searchParams.get("q") ?? "";

  const filtersFromUrl = useMemo<SavedJobsAdvancedFilters>(
    () => ({
      location: searchParams.get("location") ?? "",
      minSalary: searchParams.get("minSalary") ?? "",
      maxSalary: searchParams.get("maxSalary") ?? "",
      jobType: searchParams.get("jobType") ?? "",
      workMode: searchParams.get("workMode") ?? "",
      schedule: searchParams.get("schedule") ?? "",
      experience: searchParams.get("experience") ?? "",
      company: searchParams.get("company") ?? "",
      perk: searchParams.get("perk") ?? "",
    }),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [advancedFilters, setAdvancedFilters] =
    useState<SavedJobsAdvancedFilters>(filtersFromUrl);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);
  const debouncedLocation = useDebouncedValue(advancedFilters.location, 300);
  const debouncedCompany = useDebouncedValue(advancedFilters.company, 300);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    setAdvancedFilters(filtersFromUrl);
  }, [filtersFromUrl]);

  const writeFiltersToParams = (
    params: URLSearchParams,
    filters: SavedJobsAdvancedFilters,
  ) => {
    const entries: Array<[keyof SavedJobsAdvancedFilters, string]> = [
      ["location", filters.location],
      ["minSalary", filters.minSalary],
      ["maxSalary", filters.maxSalary],
      ["jobType", filters.jobType],
      ["workMode", filters.workMode],
      ["schedule", filters.schedule],
      ["experience", filters.experience],
      ["company", filters.company],
      ["perk", filters.perk],
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

  const updateUrl = (partial: {
    tab?: SavedJobsStatsFilter;
    sort?: SavedJobsSort;
    page?: number;
    q?: string;
    filters?: SavedJobsAdvancedFilters;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTab = partial.tab ?? tab;
    const nextSort = partial.sort ?? sort;
    const nextPage = partial.page ?? page;
    const nextQ = partial.q ?? debouncedSearch;
    const nextFilters = partial.filters ?? advancedFilters;

    if (nextTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    if (nextSort === "recently_saved") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    if (!nextQ) {
      params.delete("q");
    } else {
      params.set("q", nextQ);
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
    if (debouncedSearch === searchFromUrl) {
      return;
    }
    updateUrl({ q: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const listParams = useMemo(
    () => ({
      tab,
      search: debouncedSearch,
      sort,
      location: debouncedLocation.trim() || undefined,
      jobType: advancedFilters.jobType || undefined,
      workMode: advancedFilters.workMode || undefined,
      schedule: advancedFilters.schedule || undefined,
      experience: advancedFilters.experience || undefined,
      company: debouncedCompany.trim() || undefined,
      perk: advancedFilters.perk || undefined,
      minSalary: advancedFilters.minSalary
        ? Number(advancedFilters.minSalary)
        : undefined,
      maxSalary: advancedFilters.maxSalary
        ? Number(advancedFilters.maxSalary)
        : undefined,
      page,
      limit: SAVED_JOBS_PAGE_SIZE,
    }),
    [
      tab,
      debouncedSearch,
      sort,
      debouncedLocation,
      debouncedCompany,
      advancedFilters.jobType,
      advancedFilters.workMode,
      advancedFilters.schedule,
      advancedFilters.experience,
      advancedFilters.perk,
      advancedFilters.minSalary,
      advancedFilters.maxSalary,
      page,
    ],
  );

  const listQuery = useQuery({
    queryKey: savedJobsQueryKeys.list(listParams),
    queryFn: () => fetchSavedJobs(listParams),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const stats = listQuery.data?.stats;
  const jobs = listQuery.data?.jobs ?? [];
  const pagination = normalizeListPagination(
    listQuery.data?.pagination,
    SAVED_JOBS_PAGE_SIZE,
  );
  const hasListData = Boolean(listQuery.data);
  const isInitialLoading =
    listQuery.isLoading && !hasListData && !listQuery.isPlaceholderData;
  const isRefreshing = listQuery.isFetching && hasListData;

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
    jobs.length,
  ]);

  const removeMutation = useMutation({
    mutationFn: (publicJobId: string) => removeSavedJob(publicJobId),
    onError: () => {
      showAppToast("Couldn’t remove saved job. Please try again.", "error");
    },
    onSuccess: async () => {
      showAppToast("Removed from saved jobs");
      // If this was the last card on the page, step back before refresh.
      if (jobs.length <= 1 && page > 1) {
        updateUrl({ page: page - 1 });
      }
      await queryClient.invalidateQueries({ queryKey: savedJobsQueryKeys.all });
    },
  });

  const goToPage = (nextPage: number) => {
    updateUrl({ page: Math.max(1, nextPage) });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem] xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <header>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <Bookmark
                className="size-7 shrink-0 fill-primary text-primary sm:size-8"
                aria-hidden="true"
              />
              Saved Jobs
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted sm:text-[0.9375rem]">
              Jobs you saved for later.
            </p>
          </header>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SavedJobsStatsBar
              activeFilter={tab}
              stats={stats}
              isLoading={listQuery.isLoading && !stats}
              onChange={(nextTab) => {
                updateUrl({ tab: nextTab, page: 1 });
              }}
            />
            <SavedJobsSortSelect
              value={sort}
              onChange={(nextSort) => {
                updateUrl({ sort: nextSort, page: 1 });
              }}
            />
          </div>

          <div className="mt-4">
            <div className="relative min-w-0">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <label htmlFor="saved-jobs-search" className="sr-only">
                Search saved jobs
              </label>
              <input
                id="saved-jobs-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by job title, company, location or skills"
                className={cn(
                  "h-11 w-full rounded-xl border border-border bg-surface py-2.5 pr-3 pl-10 text-sm text-foreground shadow-sm placeholder:text-muted",
                  "outline-none transition-[border-color,box-shadow] hover:border-primary/25",
                  "focus:border-primary focus:ring-2 focus:ring-primary/20",
                )}
                autoComplete="off"
              />
            </div>
          </div>

          {isRefreshing ? (
            <p className="mt-3 text-xs text-muted" aria-live="polite">
              Updating saved jobs…
            </p>
          ) : null}

          <div className="mt-5">
            {isInitialLoading ? (
              <SavedJobsSkeletonList />
            ) : listQuery.isError && jobs.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface px-4 py-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  Couldn&apos;t load saved jobs
                </p>
                <p className="mt-1 text-sm text-muted">
                  Please check your connection and try again.
                </p>
                <button
                  type="button"
                  onClick={() => void listQuery.refetch()}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Retry
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-xl border border-border-subtle bg-surface px-4 py-14 text-center">
                <Bookmark
                  className="mx-auto size-10 text-muted"
                  aria-hidden="true"
                />
                <p className="mt-3 text-base font-semibold text-foreground">
                  No Saved Jobs
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Save roles you like while browsing, then manage them here.
                </p>
                <Link
                  href={ROUTES.FIND_JOBS}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    isRemoving={
                      removeMutation.isPending &&
                      removeMutation.variables === job.publicJobId
                    }
                    onRemove={async (publicJobId) => {
                      await removeMutation.mutateAsync(publicJobId);
                    }}
                  />
                ))}

                <ListPagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={goToPage}
                  isLoading={listQuery.isFetching}
                  ariaLabel="Saved jobs pagination"
                  entityLabel="jobs"
                />
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <SavedJobsSidebar
            filters={advancedFilters}
            stats={stats}
            onChangeFilters={(next) => {
              setAdvancedFilters(next);
              updateUrl({ page: 1, filters: next });
            }}
            onClearFilters={() => {
              setAdvancedFilters(EMPTY_SAVED_JOBS_FILTERS);
              updateUrl({ page: 1, filters: EMPTY_SAVED_JOBS_FILTERS });
            }}
          />
        </div>
      </div>
    </div>
  );
}
