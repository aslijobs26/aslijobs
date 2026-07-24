"use client";

import { JobSearchBar } from "@/components/job-search/JobSearchBar";
import { JobSearchFiltersSidebar } from "@/components/job-search/JobSearchFiltersSidebar";
import { JobSearchJobList } from "@/components/job-search/JobSearchJobList";
import { JobSearchMobileFilters } from "@/components/job-search/JobSearchMobileFilters";
import { JobSearchOverviewPanel } from "@/components/job-search/JobSearchOverviewPanel";
import { JobSearchPagination } from "@/components/job-search/JobSearchPagination";
import { JobSearchResultsHeader } from "@/components/job-search/JobSearchResultsHeader";
import { JobSearchWhatsAppBanner } from "@/components/job-search/JobSearchWhatsAppBanner";
import { JOB_SEARCH_RETURN_KEY } from "@/components/jobs/PublicJobDetailPage";
import { ROUTES } from "@/constants/routes";
import {
  fetchPublicActiveJobByPublicId,
  fetchPublicActiveJobs,
} from "@/services/public-jobs.service";
import type { JobSearchUrlState } from "@/types/job-search";
import {
  buildFetchPublicJobsParams,
  buildJobSearchLocationLabel,
  createEmptyJobSearchUrlState,
  jobSearchStateToSearchParams,
  parseJobSearchUrlState,
} from "@/utils/job-search-url";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const JOB_SEARCH_SCROLL_KEY = "asli-job-search-scroll";

/** Three-column split (filters + cards + sticky details) requires xl+. */
const SPLIT_VIEW_MEDIA_QUERY = "(min-width: 1280px)";

function subscribeToSplitViewMedia(onStoreChange: () => void) {
  const media = window.matchMedia(SPLIT_VIEW_MEDIA_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSplitViewSnapshot() {
  return window.matchMedia(SPLIT_VIEW_MEDIA_QUERY).matches;
}

function getServerSplitViewSnapshot() {
  return true;
}

function shouldOpenJobOnSeparatePage() {
  return !window.matchMedia(SPLIT_VIEW_MEDIA_QUERY).matches;
}

export function JobSearchPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSplitView = useSyncExternalStore(
    subscribeToSplitViewMedia,
    getSplitViewSnapshot,
    getServerSplitViewSnapshot,
  );

  const urlState = useMemo(
    () => parseJobSearchUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const replaceUrlState = useCallback(
    (next: JobSearchUrlState) => {
      const params = jobSearchStateToSearchParams(next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  const patchUrlState = useCallback(
    (patch: Partial<JobSearchUrlState>) => {
      replaceUrlState({ ...urlState, ...patch });
    },
    [replaceUrlState, urlState],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(JOB_SEARCH_SCROLL_KEY);
      if (!raw) {
        return;
      }
      sessionStorage.removeItem(JOB_SEARCH_SCROLL_KEY);
      const scrollY = Number(raw);
      if (!Number.isFinite(scrollY)) {
        return;
      }
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  const listParams = useMemo(
    () => buildFetchPublicJobsParams(urlState),
    [urlState],
  );

  const jobsQuery = useQuery({
    queryKey: ["public-jobs", listParams],
    queryFn: ({ signal }) => fetchPublicActiveJobs(listParams, { signal }),
    placeholderData: (previous) => previous,
  });

  const jobs = useMemo(
    () => jobsQuery.data?.jobs ?? [],
    [jobsQuery.data?.jobs],
  );
  const jobIdsKey = useMemo(
    () => jobs.map((job) => job.jobId).join(","),
    [jobs],
  );
  const pagination = jobsQuery.data?.pagination;
  const cityFacets = jobsQuery.data?.facets?.cities ?? [];

  const selectedJobId = urlState.job;

  useEffect(() => {
    if (!isSplitView || jobsQuery.isLoading || jobsQuery.isError) {
      return;
    }

    if (jobs.length === 0) {
      if (selectedJobId) {
        const current = parseJobSearchUrlState(
          new URLSearchParams(searchParams.toString()),
        );
        replaceUrlState({ ...current, job: "" });
      }
      return;
    }

    const selectedExists = jobs.some((job) => job.jobId === selectedJobId);
    if (!selectedJobId || !selectedExists) {
      const nextJobId = jobs[0]?.jobId;
      if (nextJobId && nextJobId !== selectedJobId) {
        const current = parseJobSearchUrlState(
          new URLSearchParams(searchParams.toString()),
        );
        replaceUrlState({ ...current, job: nextJobId });
      }
    }
    // Intentionally avoid replaceUrlState identity to prevent loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isSplitView,
    jobsQuery.isError,
    jobsQuery.isLoading,
    selectedJobId,
    searchParams,
    jobIdsKey,
  ]);

  const detailJobId =
    selectedJobId || (isSplitView ? jobs[0]?.jobId : "") || "";

  const detailQuery = useQuery({
    queryKey: ["public-job", detailJobId],
    queryFn: ({ signal }) =>
      fetchPublicActiveJobByPublicId(detailJobId, { signal }),
    enabled: Boolean(detailJobId) && isSplitView,
    retry: false,
  });

  const locationLabel = useMemo(() => {
    const selectedJob =
      jobs.find((job) => job.jobId === selectedJobId) ?? jobs[0];
    const selectedCitySlug = urlState.cities[0] ?? "";

    if (selectedJob && (urlState.cities.length > 0 || urlState.state)) {
      return buildJobSearchLocationLabel(
        urlState.cities.length === 1 ? selectedJob.cityName : "",
        selectedJob.stateName,
        urlState.cities.length === 1
          ? selectedCitySlug
          : urlState.cities.join(", "),
        urlState.state,
      );
    }

    return buildJobSearchLocationLabel(
      "",
      "",
      urlState.cities.join(", "),
      urlState.state,
    );
  }, [jobs, selectedJobId, urlState.cities, urlState.state]);

  const headerLocationLabel = locationLabel;

  const handleSelectJob = (jobId: string) => {
    if (typeof window !== "undefined" && shouldOpenJobOnSeparatePage()) {
      const returnParams = new URLSearchParams(searchParams.toString());
      returnParams.delete("job");
      const returnQuery = returnParams.toString();
      const returnPath = returnQuery
        ? `${ROUTES.FIND_JOBS}?${returnQuery}`
        : ROUTES.FIND_JOBS;

      try {
        sessionStorage.setItem(JOB_SEARCH_RETURN_KEY, returnPath);
        sessionStorage.setItem(JOB_SEARCH_SCROLL_KEY, String(window.scrollY));
      } catch {
        // Ignore storage access errors.
      }

      router.push(ROUTES.jobPublic(jobId));
      return;
    }

    patchUrlState({ job: jobId });
  };

  const handleToggleBookmark = (jobId: string) => {
    setBookmarkedIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    replaceUrlState(createEmptyJobSearchUrlState());
  };

  const handleClearFilters = () => {
    patchUrlState({
      within: "",
      experience: [],
      gender: "",
      workMode: [],
      minSalary: undefined,
      maxSalary: undefined,
      jobType: [],
      cities: [],
      page: 1,
    });
  };

  const isLocationLoading =
    Boolean(urlState.state) &&
    (jobsQuery.isLoading ||
      (jobsQuery.isFetching && Boolean(jobsQuery.isPlaceholderData)));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 lg:py-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Search Jobs
      </h1>

      <div className="mt-5">
        <JobSearchBar
          state={urlState}
          locationLabel={locationLabel}
          onSearch={({ q, state: nextState, cities }) => {
            patchUrlState({
              q,
              state: nextState,
              cities,
              page: 1,
              job: "",
            });
          }}
          onClearAll={handleClearAll}
        />
      </div>

      <div className="mt-4 md:hidden">
        <JobSearchMobileFilters
          state={urlState}
          cityFacets={cityFacets}
          isLocationLoading={isLocationLoading}
          onChange={patchUrlState}
          onClearFilters={handleClearFilters}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start xl:grid-cols-[250px_minmax(0,1fr)]">
        <div className="hidden md:block lg:sticky lg:top-24 lg:self-start">
          <JobSearchFiltersSidebar
            state={urlState}
            cityFacets={cityFacets}
            isLocationLoading={isLocationLoading}
            onChange={patchUrlState}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="min-w-0">
          <div className="space-y-4">
            <JobSearchResultsHeader
              total={pagination?.total ?? 0}
              locationLabel={headerLocationLabel}
              sort={urlState.sort}
              onSortChange={(sort) =>
                patchUrlState({ sort, page: 1, job: "" })
              }
            />

            <JobSearchWhatsAppBanner />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <div className="min-w-0 space-y-4">
                <JobSearchJobList
                  jobs={jobs}
                  selectedJobId={detailJobId}
                  bookmarkedIds={bookmarkedIds}
                  isLoading={jobsQuery.isLoading}
                  isError={jobsQuery.isError}
                  emptyMessage={
                    urlState.minSalary !== undefined ||
                    urlState.maxSalary !== undefined
                      ? "No jobs found for the selected salary range."
                      : undefined
                  }
                  onSelect={handleSelectJob}
                  onToggleBookmark={handleToggleBookmark}
                  onRetry={() => {
                    void jobsQuery.refetch();
                  }}
                  onClearFilters={handleClearAll}
                />

                {pagination ? (
                  <JobSearchPagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => {
                      patchUrlState({ page, job: "" });
                    }}
                  />
                ) : null}
              </div>

              {isSplitView ? (
                <div className="hidden min-w-0 xl:block">
                  <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden">
                    {detailJobId ? (
                      <JobSearchOverviewPanel
                        job={detailQuery.data?.job}
                        isLoading={detailQuery.isLoading || jobsQuery.isLoading}
                        isError={detailQuery.isError}
                        bookmarked={bookmarkedIds.has(detailJobId)}
                        onToggleBookmark={() =>
                          handleToggleBookmark(detailJobId)
                        }
                        onRetry={() => {
                          void detailQuery.refetch();
                        }}
                      />
                    ) : (
                      <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-sm text-muted">
                        Select a job to view details.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
