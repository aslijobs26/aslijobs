"use client";

import { EmployerJobPreviewModal } from "@/components/employer-jobs/EmployerJobPreviewModal";
import { EmployerJobsBulkDeleteModal } from "@/components/employer-jobs/EmployerJobsBulkDeleteModal";
import { EmployerJobsBulkToolbar } from "@/components/employer-jobs/EmployerJobsBulkToolbar";
import { EmployerJobsHeader } from "@/components/employer-jobs/EmployerJobsHeader";
import { EmployerJobsQuickActions } from "@/components/employer-jobs/EmployerJobsQuickActions";
import { EmployerJobsStats } from "@/components/employer-jobs/EmployerJobsStats";
import { EmployerJobsTable } from "@/components/employer-jobs/EmployerJobsTable";
import { EmployerJobsToolbar } from "@/components/employer-jobs/EmployerJobsToolbar";
import { JobsFiltersShell } from "@/components/employer-jobs/JobsFiltersShell";
import {
  buildEmployerJobsFilterChips,
  countActiveEmployerJobsFilters,
  DEFAULT_EMPLOYER_JOBS_FILTERS,
  loadEmployerJobsFiltersFromSession,
  removeEmployerJobsFilterChip,
  saveEmployerJobsFiltersToSession,
  toListEmployerJobsFilterParams,
  type EmployerJobsFiltersState,
} from "@/components/employer-jobs/jobs-filters";
import {
  EMPLOYER_JOBS_DEFAULT_PAGE_SIZE,
  EMPLOYER_JOBS_DELETE_UI_ENABLED,
  EMPLOYER_JOBS_QUERY_KEYS,
  EMPLOYER_JOBS_SEARCH_DEBOUNCE_MS,
  type EmployerJobsStatusTabId,
} from "@/constants/employer-jobs";
import { useCan } from "@/providers/employer-permission-provider";
import {
  bulkDeleteEmployerJobs,
  deleteEmployerJob,
  fetchEmployerJobStats,
  fetchEmployerJobs,
  invalidateEmployerJobCascadeCaches,
  updateEmployerJobStatus,
  type BulkDeleteEmployerJobsPayload,
} from "@/services/employer-jobs.service";
import type {
  EmployerJobsListResponse,
  JobStatus,
  JobStatusAction,
} from "@/types/employer-jobs";
import { resolveEmptyPageFallback } from "@/utils/list-pagination";
import { showAppToast } from "@/utils/share-job";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function toStatusFilter(
  tab: EmployerJobsStatusTabId,
): JobStatus | undefined {
  return tab === "all" ? undefined : tab;
}

type SelectionMode = "ids" | "filtered" | "all";

export function EmployerJobsPageContent() {
  const queryClient = useQueryClient();
  const { can } = useCan();
  const canDeleteJobs =
    EMPLOYER_JOBS_DELETE_UI_ENABLED && can("jobs", "delete");

  const [statusTab, setStatusTab] = useState<EmployerJobsStatusTabId>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(EMPLOYER_JOBS_DEFAULT_PAGE_SIZE);
  const [appliedFilters, setAppliedFilters] = useState<EmployerJobsFiltersState>(
    () => loadEmployerJobsFiltersFromSession(),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("ids");
  const [deleteModal, setDeleteModal] = useState<"selected" | "all" | null>(
    null,
  );
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

  const filterParams = useMemo(
    () => toListEmployerJobsFilterParams(appliedFilters),
    [appliedFilters],
  );

  const statusFilter = toStatusFilter(statusTab);
  const listParams = {
    status: statusFilter,
    search: debouncedSearch || undefined,
    page,
    limit,
    ...filterParams,
  };

  const filterScopeKey = useMemo(
    () =>
      JSON.stringify({
        status: statusFilter ?? null,
        search: debouncedSearch || null,
        ...filterParams,
      }),
    [debouncedSearch, filterParams, statusFilter],
  );

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionMode("ids");
  }, [filterScopeKey]);

  const jobsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.list(listParams),
    queryFn: () => fetchEmployerJobs(listParams),
    staleTime: 45_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const statsQuery = useQuery({
    queryKey: EMPLOYER_JOBS_QUERY_KEYS.stats(),
    queryFn: fetchEmployerJobStats,
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const invalidateJobsData = async () => {
    await invalidateEmployerJobCascadeCaches(queryClient);
  };

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode("ids");
  }, []);

  const statusMutation = useMutation({
    mutationFn: ({
      jobId,
      action,
    }: {
      jobId: string;
      action: JobStatusAction;
    }) => updateEmployerJobStatus(jobId, action),
    onSuccess: async (data, variables) => {
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
    onSuccess: async (_data, jobId) => {
      setSelectedIds((current) => {
        if (!current.has(jobId)) {
          return current;
        }
        const next = new Set(current);
        next.delete(jobId);
        return next;
      });
      await invalidateJobsData();
      const total = Math.max(0, (jobsQuery.data?.pagination.total ?? 1) - 1);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      setPage((current) => resolveEmptyPageFallback(current, totalPages));
      showAppToast("Job deleted successfully.", "success");
    },
    onError: () => {
      showAppToast("Unable to delete job. Please try again.", "error");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (payload: BulkDeleteEmployerJobsPayload) =>
      bulkDeleteEmployerJobs(payload),
    onSuccess: async (result) => {
      setDeleteModal(null);
      clearSelection();
      await invalidateJobsData();
      const remaining = Math.max(
        0,
        (jobsQuery.data?.pagination.total ?? result.deletedCount) -
          result.deletedCount,
      );
      const totalPages = Math.max(1, Math.ceil(remaining / limit));
      setPage((current) => resolveEmptyPageFallback(current, totalPages));
      const orphanApps = result.orphanCleanup?.deletedApplicationsCount ?? 0;
      showAppToast(
        result.deletedCount === 0
          ? orphanApps > 0
            ? `Cleaned ${orphanApps} orphan application(s) and related hiring data.`
            : "No jobs were deleted."
          : `${result.deletedCount} job(s) deleted successfully.`,
        "success",
      );
    },
    onError: () => {
      showAppToast("Unable to delete jobs. Please try again.", "error");
    },
  });

  const commitFilters = useCallback((next: EmployerJobsFiltersState) => {
    setAppliedFilters(next);
    saveEmployerJobsFiltersToSession(next);
    setPage(1);
  }, []);

  const handleApplyFilters = useCallback(
    (next: EmployerJobsFiltersState) => {
      commitFilters(next);
    },
    [commitFilters],
  );

  const handleClearFilters = useCallback(() => {
    commitFilters({ ...DEFAULT_EMPLOYER_JOBS_FILTERS });
  }, [commitFilters]);

  const handleRemoveChip = useCallback(
    (chipId: string) => {
      commitFilters(removeEmployerJobsFilterChip(appliedFilters, chipId));
    },
    [appliedFilters, commitFilters],
  );

  const handleTabChange = (tab: EmployerJobsStatusTabId) => {
    setStatusTab(tab);
    setPage(1);
  };

  const handleLimitChange = (nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const jobs = jobsQuery.data?.jobs ?? [];
  const pagination = jobsQuery.data?.pagination;
  const counts = jobsQuery.data?.counts;
  const stats = statsQuery.data?.stats;
  const activeFilterCount = countActiveEmployerJobsFilters(appliedFilters);
  const filterChips = buildEmployerJobsFilterChips(appliedFilters);
  const filteredTotal = pagination?.total ?? 0;
  const totalJobs = stats?.totalJobs ?? counts?.all ?? filteredTotal;
  const applicationCount = stats?.applications ?? 0;

  const pageIds = useMemo(() => jobs.map((job) => job.id), [jobs]);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));
  const selectionLocked =
    selectionMode === "filtered" || selectionMode === "all";

  const selectedCount =
    selectionMode === "all"
      ? totalJobs
      : selectionMode === "filtered"
        ? filteredTotal
        : selectedIds.size;

  const handleToggleRow = (jobId: string) => {
    if (selectionLocked) {
      return;
    }
    setSelectionMode("ids");
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleTogglePage = (checked: boolean) => {
    if (selectionLocked) {
      setSelectionMode("ids");
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        for (const id of pageIds) {
          next.add(id);
        }
      } else {
        for (const id of pageIds) {
          next.delete(id);
        }
      }
      return next;
    });
    setSelectionMode("ids");
  };

  const buildFilteredPayloadFilters = () => ({
    status: statusFilter,
    search: debouncedSearch || undefined,
    ...filterParams,
  });

  const handleConfirmBulkDelete = (confirmText?: string) => {
    if (deleteModal === "all") {
      if (confirmText !== "DELETE") {
        return;
      }
      bulkDeleteMutation.mutate({
        mode: "all",
        confirmText: "DELETE",
      });
      return;
    }

    if (selectionMode === "filtered") {
      bulkDeleteMutation.mutate({
        mode: "filtered",
        filters: buildFilteredPayloadFilters(),
      });
      return;
    }

    if (selectionMode === "all") {
      bulkDeleteMutation.mutate({
        mode: "all",
        confirmText: "DELETE",
      });
      return;
    }

    const ids = [...selectedIds];
    if (ids.length === 0) {
      return;
    }
    bulkDeleteMutation.mutate({ mode: "ids", ids });
  };

  const isMutating =
    statusMutation.isPending ||
    deleteMutation.isPending ||
    bulkDeleteMutation.isPending;

  return (
    <div className="flex flex-1 flex-col gap-4 px-3 pt-4 pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] sm:gap-4 sm:px-5 sm:pt-5 md:pb-5 lg:px-6 lg:pb-5 xl:px-7">
      <EmployerJobsHeader />

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-5">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <EmployerJobsToolbar
            activeTab={statusTab}
            counts={counts}
            searchValue={searchInput}
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersOpen}
            onTabChange={handleTabChange}
            onSearchChange={setSearchInput}
            onOpenFilters={() => setFiltersOpen(true)}
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

          {filterChips.length > 0 ? (
            <div
              className="-mt-1 flex flex-wrap items-center gap-1.5"
              aria-label="Active job filters"
            >
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleRemoveChip(chip.id)}
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <span className="truncate">{chip.label}</span>
                  <X className="size-3 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Remove {chip.label} filter</span>
                </button>
              ))}
            </div>
          ) : null}

          {canDeleteJobs && selectedCount > 0 ? (
            <EmployerJobsBulkToolbar
              selectedCount={selectedCount}
              filteredTotal={filteredTotal}
              isFilteredSelection={selectionMode === "filtered"}
              isAllSelection={selectionMode === "all"}
              canDelete={canDeleteJobs}
              isDeleting={bulkDeleteMutation.isPending}
              onClearSelection={clearSelection}
              onSelectFiltered={() => {
                setSelectionMode("filtered");
                setSelectedIds(new Set());
              }}
              onDeleteSelected={() => setDeleteModal("selected")}
              onDeleteAll={() => {
                setSelectionMode("all");
                setSelectedIds(new Set());
                setDeleteModal("all");
              }}
            />
          ) : null}

          <EmployerJobsTable
            jobs={jobs}
            isLoading={jobsQuery.isLoading}
            isError={jobsQuery.isError}
            isMutating={isMutating}
            page={pagination?.page ?? page}
            limit={pagination?.limit ?? limit}
            total={pagination?.total ?? 0}
            totalPages={pagination?.totalPages ?? 1}
            canSelect={canDeleteJobs}
            selectedIds={selectedIds}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            selectionLocked={selectionLocked}
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
            onPreview={setPreviewJobId}
            onToggleRow={handleToggleRow}
            onTogglePage={handleTogglePage}
          />
        </div>

        <EmployerJobsQuickActions />
      </div>

      <JobsFiltersShell
        open={filtersOpen}
        filters={appliedFilters}
        jobOptions={jobsQuery.data?.jobOptions ?? []}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {previewJobId ? (
        <EmployerJobPreviewModal
          jobMongoId={previewJobId}
          onClose={() => setPreviewJobId(null)}
        />
      ) : null}

      {deleteModal ? (
        <EmployerJobsBulkDeleteModal
          variant={deleteModal === "all" ? "all" : "selected"}
          jobCount={
            deleteModal === "all"
              ? totalJobs
              : selectionMode === "filtered"
                ? filteredTotal
                : selectedIds.size
          }
          applicationCount={applicationCount}
          isSubmitting={bulkDeleteMutation.isPending}
          onClose={() => {
            if (!bulkDeleteMutation.isPending) {
              setDeleteModal(null);
              if (selectionMode === "all") {
                clearSelection();
              }
            }
          }}
          onConfirm={handleConfirmBulkDelete}
        />
      ) : null}
    </div>
  );
}
