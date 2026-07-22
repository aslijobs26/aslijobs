"use client";

import { EmployerJobsHeader } from "@/components/employer-jobs/EmployerJobsHeader";
import { EmployerJobsQuickActions } from "@/components/employer-jobs/EmployerJobsQuickActions";
import { EmployerJobsStats } from "@/components/employer-jobs/EmployerJobsStats";
import { EmployerJobsTable } from "@/components/employer-jobs/EmployerJobsTable";
import { EmployerJobsToolbar } from "@/components/employer-jobs/EmployerJobsToolbar";
import {
  EMPLOYER_JOBS_DEFAULT_PAGE_SIZE,
  EMPLOYER_JOBS_QUERY_KEYS,
  EMPLOYER_JOBS_SEARCH_DEBOUNCE_MS,
  type EmployerJobsStatusTabId,
} from "@/constants/employer-jobs";
import {
  deleteEmployerJob,
  fetchEmployerJobStats,
  fetchEmployerJobs,
  updateEmployerJobStatus,
} from "@/services/employer-jobs.service";
import type { JobStatus, JobStatusAction, EmployerJobsListResponse } from "@/types/employer-jobs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

function toStatusFilter(
  tab: EmployerJobsStatusTabId,
): JobStatus | undefined {
  return tab === "all" ? undefined : tab;
}

export function EmployerJobsPageContent() {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<EmployerJobsStatusTabId>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(EMPLOYER_JOBS_DEFAULT_PAGE_SIZE);
  const isFirstSearchDebounce = useRef(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      setDebouncedSearch(nextSearch);

      if (isFirstSearchDebounce.current) {
        isFirstSearchDebounce.current = false;
        return;
      }

      setPage(1);
    }, EMPLOYER_JOBS_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const statusFilter = toStatusFilter(statusTab);
  const listParams = {
    status: statusFilter,
    search: debouncedSearch || undefined,
    page,
    limit,
  };

  const jobsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.list(listParams),
    queryFn: () => fetchEmployerJobs(listParams),
    refetchOnMount: "always",
  });

  const statsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
    refetchOnMount: "always",
  });

  const invalidateJobsData = async () => {
    await queryClient.invalidateQueries({
      queryKey: EMPLOYER_JOBS_QUERY_KEYS.all,
    });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: string;
      action: JobStatusAction;
    }) => updateEmployerJobStatus(jobId, action),
    onSuccess: async (data, variables) => {
      // Immediately apply reactivate timestamps so Posted On updates without
      // waiting on a possibly cached list response.
      if (variables.action === "reactivate") {
        const nextPublishedAt = data.job.publishedAt ?? new Date().toISOString();

        queryClient.setQueriesData<EmployerJobsListResponse>(
          { queryKey: EMPLOYER_JOBS_QUERY_KEYS.lists() },
          (current) => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              jobs: current.jobs.map((job) =>
                job.id === variables.jobId
                  ? {
                      ...job,
                      status: "active",
                      publishedAt: nextPublishedAt,
                    }
                  : job,
              ),
            };
          },
        );
      }

      await invalidateJobsData();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (jobId: string) => deleteEmployerJob(jobId),
    onSuccess: async () => {
      await invalidateJobsData();
    },
  });

  const handleTabChange = (tab: EmployerJobsStatusTabId) => {
    setStatusTab(tab);
    setPage(1);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const isMutating = statusMutation.isPending || deleteMutation.isPending;
  const jobs = jobsQuery.data?.jobs ?? [];
  const pagination = jobsQuery.data?.pagination;
  const counts = jobsQuery.data?.counts;
  const stats = statsQuery.data?.stats;

  return (
    <div className="flex flex-1 flex-col gap-4 px-3 py-4 sm:gap-4 sm:px-5 sm:py-5 lg:px-6 lg:py-5 xl:px-7">
      <EmployerJobsHeader />

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <EmployerJobsToolbar
            activeTab={statusTab}
            counts={counts}
            searchValue={searchInput}
            onTabChange={handleTabChange}
            onSearchChange={setSearchInput}
          />

          <EmployerJobsStats
            isLoading={statsQuery.isLoading}
            values={
              stats
                ? {
                    activeJobs: stats.activeJobs,
                    applications: stats.applications,
                    shortlisted: stats.shortlisted,
                    interviews: stats.interviews,
                    hired: stats.hired,
                    views: stats.views,
                  }
                : undefined
            }
          />

          <EmployerJobsTable
            jobs={jobs}
            isLoading={jobsQuery.isLoading}
            isError={jobsQuery.isError}
            isMutating={isMutating}
            page={pagination?.page ?? page}
            limit={pagination?.limit ?? limit}
            total={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
            onRetry={() => {
              void jobsQuery.refetch();
            }}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            onStatusAction={(jobId, action) => {
              statusMutation.mutate({ jobId, action });
            }}
            onDelete={(jobId) => {
              deleteMutation.mutate(jobId);
            }}
          />
        </div>

        <EmployerJobsQuickActions />
      </div>
    </div>
  );
}
