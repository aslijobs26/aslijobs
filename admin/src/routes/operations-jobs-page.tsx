import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Check } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  EMPTY_JOBS_TABLE_FILTERS,
  JobsTableFilters,
  type JobsTableFiltersState,
} from "../components/operations/jobs/JobsTableFilters";
import { CloseJobConfirmDialog } from "../components/operations/jobs/detail/CloseJobConfirmDialog";
import {
  JobsAnalyticsKpiSkeleton,
  JobsAnalyticsSkeleton,
} from "../components/operations/jobs/analytics/JobsAnalyticsSkeleton";
import { JobsKpiStrip } from "../components/operations/jobs/JobsKpiStrip";
import { JobsAskAsliCard } from "../components/operations/jobs/overview/JobsAskAsliCard";
import { JobsOverviewAnalytics } from "../components/operations/jobs/overview/JobsOverviewAnalytics";
import { JobsOverviewHeader } from "../components/operations/jobs/overview/JobsOverviewHeader";
import { JobsQuickActions } from "../components/operations/jobs/overview/JobsQuickActions";
import { JobsTableSection } from "../components/operations/jobs/JobsTableSection";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
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
    case "expire":
      return `Mark job ${job.jobId} as expired? It will be hidden from candidates.`;
    case "close":
    case "reject":
      return null;
    default:
      return null;
  }
}

const DEFAULT_FILTERS: JobsTableFiltersState = EMPTY_JOBS_TABLE_FILTERS;

const EMPTY_JOBS_FILTER_OPTIONS = {
  categories: [] as string[],
  locations: [] as string[],
};

const ANALYTICS_PRESETS: OperationsJobsAnalyticsPreset[] = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "custom",
];

function parseAnalyticsPreset(
  value: string | null,
): OperationsJobsAnalyticsPreset {
  return ANALYTICS_PRESETS.includes(value as OperationsJobsAnalyticsPreset)
    ? (value as OperationsJobsAnalyticsPreset)
    : "all";
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
    ["KPI", "At Risk of Expiry", String(result.kpis.atRiskJobs ?? 0)],
    ["KPI", "Active Jobs", String(result.kpis.activeJobs)],
    ["KPI", "Filled/Closed", String(result.kpis.filledClosedJobs ?? 0)],
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
    ...result.jobsByLocation.states.map((item) => [
      "Jobs by Location (States)",
      item.label,
      String(item.count),
    ]),
    ...result.jobsByLocation.cities.map((item) => [
      "Jobs by Location (Cities)",
      item.label,
      String(item.count),
    ]),
    ...result.jobsByLocation.topLocations.map((item) => [
      "Jobs by Location (Top)",
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

export function OperationsJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPreset = parseAnalyticsPreset(searchParams.get("preset"));
  const requestedFrom = searchParams.get("from")?.trim() ?? "";
  const requestedTo = searchParams.get("to")?.trim() ?? "";
  const analyticsFilters: OperationsJobsAnalyticsParams =
    requestedPreset === "custom" && !requestedFrom && !requestedTo
      ? { preset: "all", dateFrom: "", dateTo: "" }
      : {
          preset: requestedPreset,
          dateFrom: requestedFrom,
          dateTo: requestedTo,
        };

  const [tab, setTab] = useState<OperationsJobTab>("all");
  const [filters, setFilters] = useState<JobsTableFiltersState>(DEFAULT_FILTERS);
  const [closeTarget, setCloseTarget] = useState<OperationsJobListItem | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<OperationsJobListItem | null>(
    null,
  );
  const [closeError, setCloseError] = useState<string | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const overviewListParams = useMemo(
    () => ({
      page: 1,
      limit: 10,
      tab,
      search: filters.search.trim(),
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      location: filters.location,
    }),
    [
      tab,
      filters.search,
      filters.status,
      filters.paymentStatus,
      filters.location,
    ],
  );

  const jobsQuery = useOperationsJobs(overviewListParams, { enabled: true });
  const analyticsQuery = useOperationsJobsAnalytics(analyticsFilters, {
    enabled: true,
  });
  const statusMutation = useUpdateOperationsJobStatusMutation();
  const data = jobsQuery.data;
  const analyticsData = analyticsQuery.data;
  const kpis = analyticsData?.kpis;
  const isAnalyticsLoading =
    analyticsQuery.isPending || (analyticsQuery.isFetching && !analyticsData);

  const errorMessage = jobsQuery.error
    ? queryErrorMessage(jobsQuery.error, "Failed to load jobs.")
    : undefined;
  const analyticsErrorMessage = analyticsQuery.error
    ? queryErrorMessage(
        analyticsQuery.error,
        "Failed to load jobs analytics.",
      )
    : undefined;

  const handleFiltersChange = (next: Partial<JobsTableFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
    if (next.status !== undefined && next.status !== "") {
      setTab("all");
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleTabChange = (nextTab: OperationsJobTab) => {
    setTab(nextTab);
    if (nextTab !== "all") {
      setFilters((current) => ({ ...current, status: "" }));
    }
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

  const updateAnalyticsParams = (
    next: Partial<{
      preset: OperationsJobsAnalyticsPreset;
      from: string;
      to: string;
    }>,
  ) => {
    const params = new URLSearchParams(searchParams);
    params.delete("view");

    const nextPreset = next.preset ?? analyticsFilters.preset;
    const nextFrom = next.from ?? analyticsFilters.dateFrom;
    const nextTo = next.to ?? analyticsFilters.dateTo;

    if (nextPreset === "all") {
      params.delete("preset");
    } else {
      params.set("preset", nextPreset);
    }

    if (nextPreset === "custom") {
      if (nextFrom) params.set("from", nextFrom);
      else params.delete("from");
      if (nextTo) params.set("to", nextTo);
      else params.delete("to");
    } else {
      params.delete("from");
      params.delete("to");
    }

    setSearchParams(params, { replace: true });
  };

  const handleAnalyticsFiltersChange = (
    next: Partial<OperationsJobsAnalyticsParams>,
  ) => {
    updateAnalyticsParams({
      preset: next.preset ?? analyticsFilters.preset,
      from: next.dateFrom ?? analyticsFilters.dateFrom,
      to: next.dateTo ?? analyticsFilters.dateTo,
    });
  };

  return (
    <OperationsLayout
      title="Jobs"
      subtitle="Track job postings, approvals, performance and demand across all employers."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        {isAnalyticsLoading ? (
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
          <div className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
            <JobsOverviewHeader
              preset={analyticsFilters.preset}
              dateFrom={analyticsFilters.dateFrom}
              dateTo={analyticsFilters.dateTo}
              onPresetChange={(preset) =>
                handleAnalyticsFiltersChange(
                  preset === "custom"
                    ? {
                        preset,
                        dateFrom:
                          analyticsFilters.dateFrom ||
                          new Date().toISOString().slice(0, 10),
                        dateTo:
                          analyticsFilters.dateTo ||
                          new Date().toISOString().slice(0, 10),
                      }
                    : { preset, dateFrom: "", dateTo: "" },
                )
              }
              onDateFromChange={(dateFrom) =>
                handleAnalyticsFiltersChange({
                  preset: "custom",
                  dateFrom,
                })
              }
              onDateToChange={(dateTo) =>
                handleAnalyticsFiltersChange({
                  preset: "custom",
                  dateTo,
                })
              }
              onExport={() => exportAnalyticsCsv(analyticsData)}
            />

            <JobsKpiStrip kpis={analyticsData.kpis} />
            <JobsOverviewAnalytics data={analyticsData} />

            <OperationsOverviewSplit
              rail={
                <>
                  <JobsQuickActions
                    onExport={() => exportAnalyticsCsv(analyticsData)}
                    onReviewPending={() => handleTabChange("pending_approval")}
                    onCheckAtRisk={() => handleTabChange("live")}
                  />
                  <JobsAskAsliCard />
                </>
              }
            >
              <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg">
                <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4 xl:px-3 xl:py-1.5">
                  <div className="flex min-w-0 flex-col gap-2.5 xl:gap-1.5">
                    <h2 className="text-sm font-semibold text-foreground xl:text-[11px]">
                      Recent Job Postings{" "}
                      <span className="font-semibold tabular-nums text-muted xl:text-[10px]">
                        (
                        {(
                          data?.pagination.total ??
                          analyticsData.overviewTabs?.all ??
                          0
                        ).toLocaleString("en-IN")}
                        )
                      </span>
                    </h2>
                    <div
                      className="-mx-0.5 flex min-w-0 items-center gap-1.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hidden"
                      role="tablist"
                      aria-label="Recent job posting tabs"
                    >
                      {(
                        [
                          {
                            id: "all" as const,
                            label: "All",
                            count: analyticsData.overviewTabs?.all ?? 0,
                          },
                          {
                            id: "pending_approval" as const,
                            label: "Pending Approval",
                            count:
                              analyticsData.overviewTabs?.pending_approval ?? 0,
                          },
                          {
                            id: "live" as const,
                            label: "At Risk",
                            count: analyticsData.overviewTabs?.at_risk ?? 0,
                          },
                          {
                            id: "closed" as const,
                            label: "Recently Closed",
                            count:
                              analyticsData.overviewTabs?.recently_closed ?? 0,
                          },
                        ] as const
                      ).map((item) => {
                        const selected = tab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={selected}
                            onClick={() => handleTabChange(item.id)}
                      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 max-sm:h-8 max-sm:gap-1 max-sm:px-2 max-sm:text-[10px] xl:h-7 xl:gap-1 xl:px-2 xl:text-[9px] ${
                              selected
                                ? "ops-brand-border-glow border-primary-soft bg-primary-light text-primary-soft"
                                : "ops-brand-border-glow border-border bg-surface text-muted hover:bg-primary-light/50"
                            }`}
                          >
                            {item.label}
                            <span className="tabular-nums xl:text-[8px]">
                              {item.count.toLocaleString("en-IN")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <JobsTableFilters
                      filters={filters}
                      filterOptions={
                        data?.filterOptions ?? EMPTY_JOBS_FILTER_OPTIONS
                      }
                      onChange={handleFiltersChange}
                      onClear={handleClearFilters}
                    />
                  </div>
                </div>
                <JobsTableSection
                  jobs={data?.jobs ?? []}
                  isLoading={jobsQuery.isFetching && !data}
                  isError={jobsQuery.isError}
                  errorMessage={errorMessage}
                  onRetry={() => void jobsQuery.refetch()}
                  pendingStatusJobId={
                    statusMutation.isPending
                      ? statusMutation.variables?.jobId
                      : null
                  }
                  onStatusAction={handleStatusAction}
                />
              </div>
            </OperationsOverviewSplit>
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
