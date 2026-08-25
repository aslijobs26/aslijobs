import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Check } from "lucide-react";
import { JobsFiltersBar, type JobsFiltersState } from "../components/operations/jobs/JobsFiltersBar";
import { CloseJobConfirmDialog } from "../components/operations/jobs/detail/CloseJobConfirmDialog";
import { JobsInsightsStrip } from "../components/operations/jobs/JobsInsightsStrip";
import { JobsKpiStrip } from "../components/operations/jobs/JobsKpiStrip";
import { JobsPageSkeleton } from "../components/operations/jobs/JobsPageSkeleton";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { JobsTableSection } from "../components/operations/jobs/JobsTableSection";
import { JobsTabs } from "../components/operations/jobs/JobsTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useOperationsJobs,
  useUpdateOperationsJobStatusMutation,
} from "../hooks/use-operations-jobs";
import type {
  OperationsJobListItem,
  OperationsJobStatusAction,
  OperationsJobTab,
  OperationsJobsInsight,
  OperationsJobsListResult,
} from "../types/operations-jobs";

function statusActionConfirmMessage(
  job: OperationsJobListItem,
  action: OperationsJobStatusAction,
): string | null {
  switch (action) {
    case "pause":
      return `Pause job ${job.jobId}? It will be hidden from candidates until activated again.`;
    case "resume":
    case "publish":
    case "reactivate":
      return `Activate job ${job.jobId}? It will become live for candidates.`;
    case "close":
      return null;
    default:
      return null;
  }
}

const DEFAULT_FILTERS: JobsFiltersState = {
  search: "",
  status: "",
  paymentStatus: "",
  location: "",
};

function exportJobsCsv(result: OperationsJobsListResult): void {
  const header = [
    "Job ID",
    "Job Title",
    "Job Type",
    "Employer",
    "Vacancies",
    "Location",
    "Status",
    "Payment Status",
    "Applications",
    "Published At",
  ];

  const rows = result.jobs.map((job) => [
    job.jobId,
    job.jobTitle,
    job.jobType,
    job.employer.companyName,
    String(job.vacancies),
    job.locationLabel,
    job.statusLabel,
    job.paymentStatusLabel,
    String(job.applications),
    job.publishedAt ?? job.createdAt,
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `operations-jobs-page-${result.pagination.page}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OperationsJobsPage() {
  const [tab, setTab] = useState<OperationsJobTab>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<JobsFiltersState>(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [closeTarget, setCloseTarget] = useState<OperationsJobListItem | null>(
    null,
  );
  const [closeError, setCloseError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      tab,
      search: debouncedSearch,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      location: filters.location,
    }),
    [
      page,
      limit,
      tab,
      debouncedSearch,
      filters.status,
      filters.paymentStatus,
      filters.location,
    ],
  );

  const jobsQuery = useOperationsJobs(queryParams);
  const statusMutation = useUpdateOperationsJobStatusMutation();
  const data = jobsQuery.data;
  const isPageLoading = jobsQuery.isPending || (jobsQuery.isFetching && !data);
  const isSoftRefreshing = Boolean(data) && jobsQuery.isFetching && !jobsQuery.isPending;

  const errorMessage = (() => {
    if (!jobsQuery.error) {
      return undefined;
    }

    if (isAxiosError(jobsQuery.error)) {
      const status = jobsQuery.error.response?.status;
      if (status === 401) {
        return "Your session is invalid or expired. Please log out and sign in again to load jobs.";
      }

      const payload = jobsQuery.error.response?.data as
        | { message?: string }
        | undefined;
      if (payload?.message?.trim()) {
        return payload.message.trim();
      }

      return jobsQuery.error.message;
    }

    if (jobsQuery.error instanceof Error) {
      return jobsQuery.error.message;
    }

    return "Failed to load jobs.";
  })();

  const handleFiltersChange = (next: Partial<JobsFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
    // Status dropdown filters only apply on All Status; jump back to All when used.
    if (next.status !== undefined && next.status !== "") {
      setTab("all");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  };

  const handleTabChange = (nextTab: OperationsJobTab) => {
    setTab(nextTab);
    // Lifecycle tabs own status filtering; clear the dropdown to avoid conflicts.
    if (nextTab !== "all") {
      setFilters((current) => ({ ...current, status: "" }));
    }
    setPage(1);
  };

  const handleStatusAction = (
    job: OperationsJobListItem,
    action: OperationsJobStatusAction,
  ) => {
    if (statusMutation.isPending) {
      return;
    }

    if (action === "close") {
      setCloseError(null);
      setCloseTarget(job);
      return;
    }

    const confirmMessage = statusActionConfirmMessage(job, action);
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    statusMutation.mutate(
      { jobId: job.jobId, action },
      {
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              window.alert(message.trim());
              return;
            }
          }

          window.alert("Failed to update job status.");
        },
      },
    );
  };

  const handleConfirmCloseJob = (reason: string) => {
    if (!closeTarget) {
      return;
    }

    statusMutation.mutate(
      { jobId: closeTarget.jobId, action: "close", reason },
      {
        onSuccess: (result) => {
          setCloseTarget(null);
          setCloseError(null);
          setStatusMessage(
            result.message || "Job closed and employer notified successfully.",
          );
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              setCloseError(message.trim());
              return;
            }
          }

          setCloseError("Failed to close this job. Please try again.");
        },
      },
    );
  };

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setStatusMessage(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleInsightSelect = (insight: OperationsJobsInsight) => {
    if (insight.tab === "paused_inactive") {
      setTab("paused");
      setFilters((current) => ({
        ...current,
        status: "",
        paymentStatus: "",
      }));
    } else if (insight.tab === "pending_payment") {
      setTab("all");
      setFilters((current) => ({
        ...current,
        status: "",
        paymentStatus: "pending",
      }));
    } else {
      setTab(insight.tab);
      setFilters((current) => ({
        ...current,
        status: "",
        paymentStatus: "",
      }));
    }
    setPage(1);
  };

  return (
    <OperationsLayout
      title="Jobs"
      subtitle="Manage all job postings across employers."
    >
      {isPageLoading ? (
        <JobsPageSkeleton rowCount={limit} />
      ) : jobsQuery.isError && !data ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-danger">
            {errorMessage ?? "Failed to load jobs."}
          </p>
          <button
            type="button"
            onClick={() => void jobsQuery.refetch()}
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <div className="relative flex w-full min-w-0 flex-col gap-2.5">
          {isSoftRefreshing ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary-soft" />
            </div>
          ) : null}

          <JobsKpiStrip kpis={data.kpis} />

          <JobsInsightsStrip
            insights={data.insights}
            onSelect={handleInsightSelect}
          />

          <JobsFiltersBar
            filters={filters}
            filterOptions={data.filterOptions}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            onExport={() => exportJobsCsv(data)}
          />

          <div
            className="relative min-w-0 max-w-full rounded-xl border border-border-subtle bg-surface shadow-sm"
            aria-busy={isSoftRefreshing || undefined}
          >
            {isSoftRefreshing ? (
              <div
                className="absolute inset-0 z-10 rounded-xl bg-surface/40"
                aria-hidden="true"
              />
            ) : null}
            <div className="min-w-0 border-b border-border-subtle px-2.5 py-2 sm:px-3.5 sm:py-3">
              <JobsTabs
                activeTab={tab}
                counts={data.counts}
                onChange={handleTabChange}
              />
            </div>
            <JobsTableSection
              jobs={data.jobs}
              isLoading={false}
              isError={jobsQuery.isError}
              errorMessage={errorMessage}
              onRetry={() => void jobsQuery.refetch()}
              pendingStatusJobId={
                statusMutation.isPending ? statusMutation.variables?.jobId : null
              }
              onStatusAction={handleStatusAction}
            />
          </div>

          <JobsPaginationBar
            pagination={data.pagination}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        </div>
      ) : null}

      {closeTarget ? (
        <CloseJobConfirmDialog
          open
          jobTitle={closeTarget.jobTitle}
          jobId={closeTarget.jobId}
          isSubmitting={statusMutation.isPending}
          errorMessage={closeError}
          onCancel={() => {
            if (!statusMutation.isPending) {
              setCloseTarget(null);
              setCloseError(null);
            }
          }}
          onConfirm={handleConfirmCloseJob}
        />
      ) : null}

      {statusMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:bottom-6"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-4 py-2.5 text-xs font-semibold text-foreground shadow-lg">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-light text-primary">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {statusMessage}
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
