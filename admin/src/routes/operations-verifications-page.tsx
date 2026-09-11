import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import {
  EMPTY_VERIFICATIONS_FILTERS,
  VerificationsFiltersBar,
  type VerificationsFiltersState,
} from "../components/operations/verifications/VerificationsFiltersBar";
import { VerificationsAskAsliCard } from "../components/operations/verifications/overview/VerificationsAskAsliCard";
import { VerificationsByIndustry } from "../components/operations/verifications/overview/VerificationsByIndustry";
import { VerificationsByLocation } from "../components/operations/verifications/overview/VerificationsByLocation";
import { VerificationsDocumentsBreakdown } from "../components/operations/verifications/overview/VerificationsDocumentsBreakdown";
import { VerificationsOverviewHeader } from "../components/operations/verifications/overview/VerificationsOverviewHeader";
import { VerificationsOverviewKpiStrip } from "../components/operations/verifications/overview/VerificationsOverviewKpiStrip";
import { VerificationsOverviewTabs } from "../components/operations/verifications/overview/VerificationsOverviewTabs";
import { VerificationsQuickActions } from "../components/operations/verifications/overview/VerificationsQuickActions";
import { VerificationsSlaCard } from "../components/operations/verifications/overview/VerificationsSlaCard";
import { VerificationsStatusDonut } from "../components/operations/verifications/overview/VerificationsStatusDonut";
import { VerificationsTrendChart } from "../components/operations/verifications/overview/VerificationsTrendChart";
import { VerificationsPageSkeleton } from "../components/operations/verifications/VerificationsPageSkeleton";
import { VerificationsTableSection } from "../components/operations/verifications/VerificationsTableSection";
import {
  useExportOperationsVerifications,
  useOperationsVerificationsAnalytics,
  useOperationsVerificationsList,
} from "../hooks/use-operations-verifications";
import type {
  OperationsVerificationListStatus,
  OperationsVerificationsAnalyticsParams,
  OperationsVerificationsExportParams,
  OperationsVerificationsFilterOptions,
  OperationsVerificationsListParams,
  OperationsVerificationsOverviewTab,
  VerificationsAnalyticsPreset,
  VerificationsDatePreset,
} from "../types/operations-verifications";
import { VERIFICATIONS_ANALYTICS_PRESETS } from "../types/operations-verifications";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_FILTER_OPTIONS: OperationsVerificationsFilterOptions = {
  statuses: [],
  industries: [],
  locations: [],
  slaOptions: [],
};

const EMPTY_TAB_COUNTS = {
  overview: 0,
  pending: 0,
  underReview: 0,
  verified: 0,
  rejected: 0,
  slaBreaches: 0,
};

function parseListStatus(
  value: string | null,
): OperationsVerificationListStatus | "" {
  if (
    value === "pending" ||
    value === "under_review" ||
    value === "verified" ||
    value === "rejected"
  ) {
    return value;
  }
  return "";
}

function todayIsoDate(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseAnalyticsPreset(
  value: string | null,
): VerificationsAnalyticsPreset {
  return VERIFICATIONS_ANALYTICS_PRESETS.includes(
    value as VerificationsAnalyticsPreset,
  )
    ? (value as VerificationsAnalyticsPreset)
    : "last_30_days";
}

function parseOverviewTab(
  value: string | null,
): OperationsVerificationsOverviewTab {
  if (
    value === "pending" ||
    value === "underReview" ||
    value === "verified" ||
    value === "rejected" ||
    value === "slaBreaches" ||
    value === "overview"
  ) {
    return value;
  }
  return "overview";
}

function queryErrorMessage(error: unknown, fallback: string): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable. Please wait a moment and retry.";
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session expired. Please refresh or sign in again.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function OperationsVerificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<VerificationsFiltersState>(() => ({
    ...EMPTY_VERIFICATIONS_FILTERS,
    search: searchParams.get("search")?.trim() ?? "",
    status: parseListStatus(searchParams.get("status")),
    industry: searchParams.get("industry") ?? "",
    location: searchParams.get("location") ?? "",
  }));
  const [activeTab, setActiveTab] = useState<OperationsVerificationsOverviewTab>(
    () => parseOverviewTab(searchParams.get("tab")),
  );
  const [analyticsFilters, setAnalyticsFilters] =
    useState<OperationsVerificationsAnalyticsParams>({
      preset: parseAnalyticsPreset(searchParams.get("preset")),
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    });

  useEffect(() => {
    setActiveTab(parseOverviewTab(searchParams.get("tab")));
  }, [searchParams]);

  const tabListFilters = useMemo((): Pick<
    OperationsVerificationsListParams,
    "status" | "queue"
  > => {
    switch (activeTab) {
      case "pending":
        return { status: "pending", queue: "" };
      case "underReview":
        return { status: "", queue: "under_review" };
      case "verified":
        return { status: "verified", queue: "" };
      case "rejected":
        return { status: "rejected", queue: "" };
      case "slaBreaches":
        return { status: "", queue: "sla_breaches" };
      case "overview":
      default:
        return { status: "", queue: "" };
    }
  }, [activeTab]);

  const listQueryParams = useMemo<OperationsVerificationsListParams>(
    () => ({
      page,
      limit,
      search: filters.search
        .trim()
        .replace(/^AJ-EMP-/i, "")
        .replace(/^EMP-/i, ""),
      status: tabListFilters.status || filters.status || "",
      queue: tabListFilters.queue,
      industry: filters.industry,
      location: filters.location,
      datePreset: (filters.submissionPreset ||
        "all") as VerificationsDatePreset,
      dateFrom: "",
      dateTo: "",
    }),
    [page, limit, filters, tabListFilters],
  );

  const exportParams = useMemo<OperationsVerificationsExportParams>(
    () => ({
      search: filters.search.trim(),
      status: tabListFilters.status || filters.status || "",
      queue: tabListFilters.queue,
      industry: filters.industry,
      location: filters.location,
      datePreset: (filters.submissionPreset ||
        "all") as VerificationsDatePreset,
    }),
    [filters, tabListFilters],
  );

  const analyticsQuery = useOperationsVerificationsAnalytics(analyticsFilters);
  const listQuery = useOperationsVerificationsList(listQueryParams);
  const exportMutation = useExportOperationsVerifications();

  const filterOptions = listQuery.data?.filterOptions ?? EMPTY_FILTER_OPTIONS;
  const analytics = analyticsQuery.data;
  const listData = listQuery.data;

  const syncAnalyticsParams = (
    next: OperationsVerificationsAnalyticsParams,
  ) => {
    setAnalyticsFilters(next);
    const params = new URLSearchParams(searchParams);
    if (next.preset === "last_30_days") {
      params.delete("preset");
    } else {
      params.set("preset", next.preset);
    }
    if (next.preset === "custom" && next.dateFrom) {
      params.set("dateFrom", next.dateFrom);
    } else {
      params.delete("dateFrom");
    }
    if (next.preset === "custom" && next.dateTo) {
      params.set("dateTo", next.dateTo);
    } else {
      params.delete("dateTo");
    }
    setSearchParams(params, { replace: true });
  };

  const handlePresetChange = (preset: VerificationsAnalyticsPreset) => {
    if (preset === "custom") {
      const iso = todayIsoDate();
      syncAnalyticsParams({
        preset,
        dateFrom: analyticsFilters.dateFrom || iso,
        dateTo: analyticsFilters.dateTo || iso,
      });
      return;
    }
    syncAnalyticsParams({ preset, dateFrom: "", dateTo: "" });
  };

  const handleFiltersChange = (next: Partial<VerificationsFiltersState>) => {
    // Status dropdown on overview tabs that already pin status: jump back to
    // overview so the selected Pending/Verified filter actually applies.
    if (next.status !== undefined && activeTab !== "overview") {
      setActiveTab("overview");
      const params = new URLSearchParams(searchParams);
      params.delete("tab");
      setSearchParams(params, { replace: true });
    }
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_VERIFICATIONS_FILTERS);
    setPage(1);
  };

  const handleTabChange = (tab: OperationsVerificationsOverviewTab) => {
    setActiveTab(tab);
    setPage(1);
    // Tab selection owns status; clear the dropdown so it does not fight the tab.
    if (tab !== "overview") {
      setFilters((prev) => ({ ...prev, status: "" }));
    }
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleVerifyEmployer = () => {
    handleTabChange("pending");
  };

  const handleExport = () => {
    void exportMutation.mutateAsync(exportParams).catch(() => {
      // surfaced via mutation error state
    });
  };

  const isInitialLoading =
    (analyticsQuery.isLoading && !analytics) ||
    (listQuery.isLoading && !listData);

  const listErrorMessage = listQuery.error
    ? queryErrorMessage(
        listQuery.error,
        "Failed to load employer verifications. Please try again.",
      )
    : undefined;

  const analyticsErrorMessage = analyticsQuery.error
    ? queryErrorMessage(
        analyticsQuery.error,
        "Failed to load verification analytics. Please try again.",
      )
    : undefined;

  const showOverviewAnalytics = activeTab === "overview";

  return (
    <OperationsLayout
      title="Verifications Overview"
      subtitle="Monitor and manage employer verifications, documents and compliance."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
        {isInitialLoading ? (
          <VerificationsPageSkeleton />
        ) : (
          <>
            <VerificationsOverviewHeader
              preset={analyticsFilters.preset}
              dateFrom={analyticsFilters.dateFrom ?? ""}
              dateTo={analyticsFilters.dateTo ?? ""}
              onPresetChange={handlePresetChange}
              onDateFromChange={(dateFrom) =>
                syncAnalyticsParams({
                  ...analyticsFilters,
                  preset: "custom",
                  dateFrom,
                })
              }
              onDateToChange={(dateTo) =>
                syncAnalyticsParams({
                  ...analyticsFilters,
                  preset: "custom",
                  dateTo,
                })
              }
              onVerifyEmployer={handleVerifyEmployer}
              onExport={handleExport}
              isExporting={exportMutation.isPending}
            />

            {analyticsErrorMessage && !analytics ? (
              <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger">
                {analyticsErrorMessage}
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={() => void analyticsQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {analytics ? (
              <VerificationsOverviewKpiStrip kpis={analytics.kpis} />
            ) : null}

            <VerificationsOverviewTabs
              activeTab={activeTab}
              counts={analytics?.tabs ?? EMPTY_TAB_COUNTS}
              onChange={handleTabChange}
            />

            {showOverviewAnalytics && analytics ? (
              <div className="operations-analytics-grid grid grid-cols-1 gap-3 max-sm:gap-2 md:grid-cols-2 xl:grid-cols-3">
                <VerificationsTrendChart
                  data={analytics.trend}
                  rangeLabel={analytics.range.label}
                />
                <VerificationsStatusDonut items={analytics.byStatus} />
                <VerificationsDocumentsBreakdown
                  items={analytics.documentsBreakdown}
                />
                <VerificationsByIndustry items={analytics.byIndustry} />
                <VerificationsByLocation
                  items={analytics.byLocation.states}
                  isLoading={analyticsQuery.isFetching && !analytics}
                  isError={analyticsQuery.isError}
                  onRetry={() => void analyticsQuery.refetch()}
                />
                <VerificationsSlaCard sla={analytics.sla} />
              </div>
            ) : null}

            <OperationsOverviewSplit
              rail={
                <>
                  <VerificationsQuickActions
                    onExport={handleExport}
                    isExporting={exportMutation.isPending}
                  />
                  <VerificationsAskAsliCard />
                </>
              }
            >
              <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg">
                <VerificationsTableSection
                  items={listData?.items ?? []}
                  totalItems={listData?.pagination.total ?? 0}
                  isLoading={listQuery.isFetching && !listData}
                  isError={listQuery.isError}
                  errorMessage={listErrorMessage}
                  onRetry={() => void listQuery.refetch()}
                  toolbar={
                    <VerificationsFiltersBar
                      filters={filters}
                      filterOptions={filterOptions}
                      statusOverride={tabListFilters.status}
                      onChange={handleFiltersChange}
                      onClear={handleClearFilters}
                    />
                  }
                />

                {listData?.pagination ? (
                  <div className="border-t border-border-subtle p-3 xl:p-2.5">
                    <JobsPaginationBar
                      pagination={listData.pagination}
                      onPageChange={setPage}
                      onLimitChange={(newLimit: number) => {
                        setLimit(newLimit);
                        setPage(1);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </OperationsOverviewSplit>

            {exportMutation.isError ? (
              <p className="text-xs text-danger" role="alert">
                {queryErrorMessage(
                  exportMutation.error,
                  "Export failed. Please try again.",
                )}
              </p>
            ) : null}
          </>
        )}
      </div>
    </OperationsLayout>
  );
}
