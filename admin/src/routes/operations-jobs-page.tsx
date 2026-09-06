import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Check } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { JobsFiltersBar, type JobsFiltersState } from "../components/operations/jobs/JobsFiltersBar";
import { CloseJobConfirmDialog } from "../components/operations/jobs/detail/CloseJobConfirmDialog";
import { JobsAnalyticsSection } from "../components/operations/jobs/analytics/JobsAnalyticsSection";
import {
  JobsAnalyticsKpiSkeleton,
  JobsAnalyticsSkeleton,
} from "../components/operations/jobs/analytics/JobsAnalyticsSkeleton";
import { JobsInsightsStrip } from "../components/operations/jobs/JobsInsightsStrip";
import { JobsKpiStrip } from "../components/operations/jobs/JobsKpiStrip";
import { JobsPageSkeleton } from "../components/operations/jobs/JobsPageSkeleton";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { JobsTableSection } from "../components/operations/jobs/JobsTableSection";
import { JobsTabs } from "../components/operations/jobs/JobsTabs";
import { JobsViewTabs } from "../components/operations/jobs/JobsViewTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useOperationsJobs,
  useOperationsJobsAnalytics,
  useUpdateOperationsJobStatusMutation,
} from "../hooks/use-operations-jobs";
import type {
  OperationsJobListItem,
  OperationsJobStatusAction,
  OperationsJobTab,
  OperationsJobsAnalyticsParams,
  OperationsJobsAnalyticsPreset,
  OperationsJobsAnalyticsResult,
  OperationsJobsInsight,
  OperationsJobsListResult,
  OperationsJobsModuleView,
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
    case "approve":
      return job.isLiveChangeReview
        ? `Approve and publish changes for job ${job.jobId}? The live listing will be updated and the employer will be notified.`
        : `Approve and publish job ${job.jobId}? It will become live for candidates and the employer will be notified.`;
    case "close":
    case "reject":
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

const ANALYTICS_PRESETS: OperationsJobsAnalyticsPreset[] = [
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "custom",
];

function parseJobsView(value: string | null): OperationsJobsModuleView {
  return value === "analytics" ? "analytics" : "all";
}

function parseAnalyticsPreset(
  value: string | null,
): OperationsJobsAnalyticsPreset {
  return ANALYTICS_PRESETS.includes(value as OperationsJobsAnalyticsPreset)
    ? (value as OperationsJobsAnalyticsPreset)
    : "last_30_days";
}

function queryErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session is invalid or expired. Please log out and sign in again.";
    }
    const status = error.response?.status;
    if (
      status === 502 ||
      status === 503 ||
      status === 504 ||
      error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      !error.response
    ) {
      return "The API server is temporarily unavailable. Please wait a moment and retry.";
    }
    const payload = error.response?.data as { message?: string } | undefined;
    if (payload?.message?.trim()) {
      return payload.message.trim();
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function exportAnalyticsCsv(result: OperationsJobsAnalyticsResult): void {
  const rows: string[][] = [
    ["Section", "Label", "Value"],
    ["KPI", "Total Jobs", String(result.kpis.totalJobs)],
    ["KPI", "Pending Approval", String(result.kpis.pendingApprovalJobs)],
    ["KPI", "Active Jobs", String(result.kpis.activeJobs)],
    ["KPI", "Pending Payment", String(result.kpis.pendingPaymentJobs)],
    ["KPI", "Live Jobs", String(result.kpis.liveJobs)],
    ["KPI", "Expired Jobs", String(result.kpis.expiredJobs)],
    ["KPI", "Draft Jobs", String(result.kpis.draftJobs)],
    ["Totals", "Jobs created in period", String(result.totals.jobsCreated)],
    [
      "Totals",
      "Applications in period",
      String(result.totals.applications),
    ],
    ...result.status.map((item) => [
      "Jobs Status",
      item.label,
      String(item.count),
    ]),
    ...result.payment.map((item) => [
      "Payment Overview",
      item.label,
      String(item.count),
    ]),
    ...result.jobsCreated.map((item) => [
      "Jobs Created",
      item.label,
      String(item.count),
    ]),
    ...result.applicationsTrend.map((item) => [
      "Applications Trend",
      item.label,
      String(item.count),
    ]),
    ...result.jobsByLocation.map((item) => [
      "Jobs by Location",
      item.label,
      String(item.count),
    ]),
    ...result.jobsByEmploymentType.map((item) => [
      "Jobs by Employment Type",
      item.label,
      String(item.count),
    ]),
    ...result.topPerformingJobs.map((item) => [
      "Top Performing Jobs",
      item.label,
      String(item.count),
    ]),
    ...result.jobsExpiringSoon.map((item) => [
      "Jobs Expiring Soon",
      item.label,
      String(item.count),
    ]),
    ["Insights", "Headline", result.insight.headline],
    ["Insights", "Detail", result.insight.detail],
  ];

  const csv = rows
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
  anchor.download = `operations-jobs-analytics-${result.range.preset}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseJobsView(searchParams.get("view"));
  const requestedPreset = parseAnalyticsPreset(searchParams.get("preset"));
  const requestedFrom = searchParams.get("from")?.trim() ?? "";
  const requestedTo = searchParams.get("to")?.trim() ?? "";
  const analyticsFilters: OperationsJobsAnalyticsParams =
    requestedPreset === "custom" && !requestedFrom && !requestedTo
      ? { preset: "last_30_days", dateFrom: "", dateTo: "" }
      : {
          preset: requestedPreset,
          dateFrom: requestedFrom,
          dateTo: requestedTo,
        };
  const isAnalyticsView = view === "analytics";

  const [tab, setTab] = useState<OperationsJobTab>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<JobsFiltersState>(DEFAULT_FILTERS);
  const [closeTarget, setCloseTarget] = useState<OperationsJobListItem | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<OperationsJobListItem | null>(
    null,
  );
  const [closeError, setCloseError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      tab,
      search: filters.search.trim(),
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      location: filters.location,
    }),
    [
      page,
      limit,
      tab,
      filters.search,
      filters.status,
      filters.paymentStatus,
      filters.location,
    ],
  );

  const jobsQuery = useOperationsJobs(queryParams, {
    enabled: !isAnalyticsView,
  });
  const analyticsQuery = useOperationsJobsAnalytics(analyticsFilters, {
    enabled: isAnalyticsView,
  });
  const statusMutation = useUpdateOperationsJobStatusMutation();
  const data = jobsQuery.data;
  const analyticsData = analyticsQuery.data;
  const kpis = isAnalyticsView ? analyticsData?.kpis : data?.kpis;
  const isListLoading =
    !isAnalyticsView &&
    (jobsQuery.isPending || (jobsQuery.isFetching && !data));
  const isAnalyticsLoading =
    isAnalyticsView &&
    (analyticsQuery.isPending || (analyticsQuery.isFetching && !analyticsData));
  const isSoftRefreshing =
    Boolean(data) && jobsQuery.isFetching && !jobsQuery.isPending;

  const errorMessage = jobsQuery.error
    ? queryErrorMessage(jobsQuery.error, "Failed to load jobs.")
    : undefined;
  const analyticsErrorMessage = analyticsQuery.error
    ? queryErrorMessage(
        analyticsQuery.error,
        "Failed to load jobs analytics.",
      )
    : undefined;

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

    if (action === "reject") {
      setRejectError(null);
      setRejectTarget(job);
      return;
    }

    const confirmMessage = statusActionConfirmMessage(job, action);
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    statusMutation.mutate(
      { jobId: job.jobId, action },
      {
        onSuccess: (result) => {
          if (action === "approve") {
            setStatusMessage(
              result.message || "Job approved and published successfully.",
            );
          }
        },
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

  const handleConfirmRejectJob = (reason: string) => {
    if (!rejectTarget) {
      return;
    }

    statusMutation.mutate(
      { jobId: rejectTarget.jobId, action: "reject", reason },
      {
        onSuccess: (result) => {
          setRejectTarget(null);
          setRejectError(null);
          setStatusMessage(
            result.message || "Job rejected and employer notified successfully.",
          );
        },
        onError: (error) => {
          if (isAxiosError(error)) {
            const message = error.response?.data?.message;
            if (typeof message === "string" && message.trim()) {
              setRejectError(message.trim());
              return;
            }
          }

          setRejectError("Failed to reject this job. Please try again.");
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

  const updateViewParams = (
    next: Partial<{
      view: OperationsJobsModuleView;
      preset: OperationsJobsAnalyticsPreset;
      from: string;
      to: string;
    }>,
  ) => {
    const params = new URLSearchParams(searchParams);
    const nextView = next.view ?? view;
    params.set("view", nextView);

    const nextPreset = next.preset ?? analyticsFilters.preset;
    const nextFrom = next.from ?? analyticsFilters.dateFrom;
    const nextTo = next.to ?? analyticsFilters.dateTo;

    if (nextView === "analytics") {
      params.set("preset", nextPreset);
      if (nextPreset === "custom") {
        if (nextFrom) params.set("from", nextFrom);
        else params.delete("from");
        if (nextTo) params.set("to", nextTo);
        else params.delete("to");
      } else {
        params.delete("from");
        params.delete("to");
      }
    }

    setSearchParams(params, { replace: true });
  };

  const handleViewChange = (nextView: OperationsJobsModuleView) => {
    updateViewParams({ view: nextView });
  };

  const handleAnalyticsFiltersChange = (
    next: Partial<OperationsJobsAnalyticsParams>,
  ) => {
    updateViewParams({
      view: "analytics",
      preset: next.preset ?? analyticsFilters.preset,
      from: next.dateFrom ?? analyticsFilters.dateFrom,
      to: next.dateTo ?? analyticsFilters.dateTo,
    });
  };

  const handleInsightSelect = (insight: OperationsJobsInsight) => {
    updateViewParams({ view: "all" });
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
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        <JobsViewTabs value={view} onChange={handleViewChange} />

        {isAnalyticsView ? (
          isAnalyticsLoading ? (
            <>
              {kpis ? <JobsKpiStrip kpis={kpis} /> : <JobsAnalyticsKpiSkeleton />}
              <JobsAnalyticsSkeleton />
            </>
          ) : analyticsQuery.isError && !analyticsData ? (
            <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-danger">
                {analyticsErrorMessage ?? "Failed to load jobs analytics."}
              </p>
              <button
                type="button"
                onClick={() => void analyticsQuery.refetch()}
                className="mt-3 inline-flex h-9 items-center rounded-lg bg-primary-light px-3 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Retry
              </button>
            </div>
          ) : analyticsData ? (
            <>
              <JobsKpiStrip kpis={analyticsData.kpis} />
              <JobsAnalyticsSection
                data={analyticsData}
                filters={analyticsFilters}
                onFiltersChange={handleAnalyticsFiltersChange}
                onExport={() => exportAnalyticsCsv(analyticsData)}
              />
            </>
          ) : null
        ) : isListLoading ? (
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
      </div>

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

      {rejectTarget ? (
        <CloseJobConfirmDialog
          open
          jobTitle={rejectTarget.jobTitle}
          jobId={rejectTarget.jobId}
          isSubmitting={statusMutation.isPending}
          title={
            rejectTarget.isLiveChangeReview
              ? "Reject these changes?"
              : "Reject this job?"
          }
          description={
            rejectTarget.isLiveChangeReview
              ? "The live listing will stay unchanged. The employer will be notified with your rejection reason and can edit and resubmit."
              : "This job will not go Live. The employer will be notified with your rejection reason."
          }
          reasonLabel="Reason for rejection"
          reasonPlaceholder={
            rejectTarget.isLiveChangeReview
              ? "Enter why these changes are being rejected. This reason is sent to the employer."
              : "Enter why this job is being rejected. This reason is sent to the employer."
          }
          submitLabel={
            rejectTarget.isLiveChangeReview ? "Reject Changes" : "Reject Job"
          }
          errorMessage={rejectError}
          onCancel={() => {
            if (!statusMutation.isPending) {
              setRejectTarget(null);
              setRejectError(null);
            }
          }}
          onConfirm={handleConfirmRejectJob}
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
