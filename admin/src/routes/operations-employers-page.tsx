import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { EmployersPageSkeleton } from "../components/operations/employers/EmployersPageSkeleton";
import { EmployersTableSection } from "../components/operations/employers/EmployersTableSection";
import {
  EMPTY_EMPLOYERS_TABLE_FILTERS,
  EmployersTableFilters,
  type EmployersTableFiltersState,
} from "../components/operations/employers/EmployersTableFilters";
import { AddEmployerDialog } from "../components/operations/employers/overview/AddEmployerDialog";
import { EmployerTypeDonut } from "../components/operations/employers/overview/EmployerTypeDonut";
import { EmployersAskAsliCard } from "../components/operations/employers/overview/EmployersAskAsliCard";
import { EmployersByIndustry } from "../components/operations/employers/overview/EmployersByIndustry";
import { EmployersByLocation } from "../components/operations/employers/overview/EmployersByLocation";
import { EmployersOnboardingFunnel } from "../components/operations/employers/overview/EmployersOnboardingFunnel";
import { EmployersOverviewHeader } from "../components/operations/employers/overview/EmployersOverviewHeader";
import { EmployersOverviewKpiStrip } from "../components/operations/employers/overview/EmployersOverviewKpiStrip";
import { EmployersOverviewTabs } from "../components/operations/employers/overview/EmployersOverviewTabs";
import { EmployersQuickActions } from "../components/operations/employers/overview/EmployersQuickActions";
import { EmployersRegistrationTrendChart } from "../components/operations/employers/overview/EmployersRegistrationTrendChart";
import { TopHiringLocations } from "../components/operations/employers/overview/TopHiringLocations";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useExportOperationsEmployersCsv,
  useOperationsEmployers,
  useOperationsEmployersAnalytics,
  useUpdateOperationsEmployerStatus,
  useUpdateOperationsEmployerVerification,
} from "../hooks/use-operations-employers";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployerListItem,
  OperationsEmployersAnalyticsParams,
  OperationsEmployersAnalyticsPreset,
  OperationsEmployersExportParams,
  OperationsEmployersFilterOptions,
  OperationsEmployersOverviewTab,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const ANALYTICS_PRESETS: OperationsEmployersAnalyticsPreset[] = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
];

const EMPTY_TABS = {
  all: 0,
  new: 0,
  verificationPending: 0,
  active: 0,
  inactive: 0,
};

const EMPTY_FILTER_OPTIONS: OperationsEmployersFilterOptions = {
  verificationStatuses: [],
  employerTypes: [],
  locations: [],
  statuses: [],
};

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
): OperationsEmployersAnalyticsPreset {
  return ANALYTICS_PRESETS.includes(value as OperationsEmployersAnalyticsPreset)
    ? (value as OperationsEmployersAnalyticsPreset)
    : "all";
}

function parseOverviewTab(
  value: string | null,
): OperationsEmployersOverviewTab {
  if (
    value === "new" ||
    value === "verificationPending" ||
    value === "active" ||
    value === "inactive"
  ) {
    return value;
  }
  return "all";
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

export function OperationsEmployersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tableFilters, setTableFilters] = useState<EmployersTableFiltersState>(
    EMPTY_EMPLOYERS_TABLE_FILTERS,
  );
  const [activeTab, setActiveTab] = useState<OperationsEmployersOverviewTab>(
    () =>
      searchParams.get("verificationStatus") === "pending"
        ? "verificationPending"
        : parseOverviewTab(searchParams.get("tab")),
  );
  const [analyticsFilters, setAnalyticsFilters] =
    useState<OperationsEmployersAnalyticsParams>({
      preset: parseAnalyticsPreset(searchParams.get("preset")),
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    });
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [selectedEmployer, setSelectedEmployer] =
    useState<OperationsEmployerListItem | null>(null);
  const [actionType, setActionType] = useState<
    "verify" | "reject" | "suspend" | "activate" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("verificationStatus") === "pending") {
      setActiveTab("verificationPending");
    }
  }, [searchParams]);

  const tabListFilters = useMemo(() => {
    switch (activeTab) {
      case "new":
        return {
          verificationStatus: "",
          status: "",
          datePreset: "last_30_days" as const,
        };
      case "verificationPending":
        return {
          verificationStatus: "pending",
          status: "",
          datePreset: "all" as const,
        };
      case "active":
        return {
          verificationStatus: "",
          status: "active",
          datePreset: "all" as const,
        };
      case "inactive":
        return {
          verificationStatus: "",
          status: "inactive",
          datePreset: "all" as const,
        };
      default:
        return {
          verificationStatus: "",
          status: "",
          datePreset: "all" as const,
        };
    }
  }, [activeTab]);

  const effectiveListFilters = useMemo(() => {
    const datePreset = (tableFilters.registrationPreset ||
      tabListFilters.datePreset) as OperationsEmployerDatePreset;

    return {
      verificationStatus:
        tableFilters.verificationStatus || tabListFilters.verificationStatus,
      status: tableFilters.status || tabListFilters.status,
      datePreset,
      employerType: tableFilters.employerType,
      location: tableFilters.location,
    };
  }, [tableFilters, tabListFilters]);

  const listQueryParams = useMemo(
    () => ({
      page,
      limit,
      search: tableFilters.search.trim(),
      verificationStatus: effectiveListFilters.verificationStatus,
      status: effectiveListFilters.status,
      employerType: effectiveListFilters.employerType,
      location: effectiveListFilters.location,
      datePreset: effectiveListFilters.datePreset,
      dateFrom: "",
      dateTo: "",
    }),
    [page, limit, tableFilters.search, effectiveListFilters],
  );

  const analyticsQuery = useOperationsEmployersAnalytics(analyticsFilters);
  const employersQuery = useOperationsEmployers(listQueryParams);
  const exportMutation = useExportOperationsEmployersCsv();
  const verifyMutation = useUpdateOperationsEmployerVerification(
    selectedEmployer?.id,
  );
  const statusMutation = useUpdateOperationsEmployerStatus(
    selectedEmployer?.id,
  );

  const exportParams = useMemo<OperationsEmployersExportParams>(
    () => ({
      search: tableFilters.search.trim(),
      verificationStatus: effectiveListFilters.verificationStatus,
      status: effectiveListFilters.status,
      employerType: effectiveListFilters.employerType,
      location: effectiveListFilters.location,
      datePreset: effectiveListFilters.datePreset,
    }),
    [tableFilters.search, effectiveListFilters],
  );

  const filterOptions =
    employersQuery.data?.filterOptions ?? EMPTY_FILTER_OPTIONS;

  const handleTableFiltersChange = (
    next: Partial<EmployersTableFiltersState>,
  ) => {
    setTableFilters((prev) => ({ ...prev, ...next }));
    setPage(1);

    // If the user picks an explicit status/verification filter, leave specialized tabs
    // so the dropdown is clearly the active constraint.
    if (
      ("verificationStatus" in next && next.verificationStatus) ||
      ("status" in next && next.status) ||
      ("registrationPreset" in next && next.registrationPreset)
    ) {
      if (activeTab !== "all") {
        setActiveTab("all");
        const params = new URLSearchParams(searchParams);
        params.delete("tab");
        params.delete("verificationStatus");
        setSearchParams(params, { replace: true });
      }
    }
  };

  const handleClearTableFilters = () => {
    setTableFilters(EMPTY_EMPLOYERS_TABLE_FILTERS);
    setPage(1);
  };

  const syncAnalyticsParams = (
    next: OperationsEmployersAnalyticsParams,
  ) => {
    setAnalyticsFilters(next);
    const params = new URLSearchParams(searchParams);
    if (next.preset === "all") {
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

  const handlePresetChange = (preset: OperationsEmployersAnalyticsPreset) => {
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

  const handleTabChange = (tab: OperationsEmployersOverviewTab) => {
    setActiveTab(tab);
    setPage(1);
    // Clear dropdown filters that tabs already express, keep search/type/location.
    setTableFilters((prev) => ({
      ...prev,
      verificationStatus: "",
      status: "",
      registrationPreset: "",
    }));
    const next = new URLSearchParams(searchParams);
    if (tab === "verificationPending") {
      next.set("verificationStatus", "pending");
    } else {
      next.delete("verificationStatus");
    }
    if (tab === "all") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleExport = () => {
    void exportMutation.mutateAsync(exportParams).catch(() => {
      // surfaced via mutation error state below if needed
    });
  };

  const handleOpenVerify = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType("verify");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenReject = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType("reject");
    setActionReason("");
    setActionError(null);
  };

  const handleOpenToggleStatus = (employer: OperationsEmployerListItem) => {
    setSelectedEmployer(employer);
    setActionType(employer.status === "suspended" ? "activate" : "suspend");
    setActionReason("");
    setActionError(null);
  };

  const handleCloseModal = () => {
    setSelectedEmployer(null);
    setActionType(null);
    setActionReason("");
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedEmployer || !actionType) return;
    setActionError(null);

    try {
      if (actionType === "verify") {
        await verifyMutation.mutateAsync({
          verificationStatus: "verified",
          remarks: actionReason,
        });
      } else if (actionType === "reject") {
        await verifyMutation.mutateAsync({
          verificationStatus: "rejected",
          remarks: actionReason,
        });
      } else if (actionType === "suspend") {
        await statusMutation.mutateAsync({
          status: "suspended",
          reason: actionReason,
        });
      } else if (actionType === "activate") {
        await statusMutation.mutateAsync({
          status: "active",
          reason: actionReason,
        });
      }
      handleCloseModal();
    } catch (err) {
      if (isAxiosError(err)) {
        setActionError(
          err.response?.data?.message || "Action failed. Please try again.",
        );
      } else {
        setActionError("Action failed. Please try again.");
      }
    }
  };

  const analytics = analyticsQuery.data;
  const listData = employersQuery.data;
  const isInitialLoading =
    (analyticsQuery.isLoading && !analytics) ||
    (employersQuery.isLoading && !listData);

  const listErrorMessage = employersQuery.error
    ? queryErrorMessage(
        employersQuery.error,
        "Failed to load employers. Please try again.",
      )
    : undefined;

  const analyticsErrorMessage = analyticsQuery.error
    ? queryErrorMessage(
        analyticsQuery.error,
        "Failed to load employer analytics. Please try again.",
      )
    : undefined;

  return (
    <OperationsLayout
      title="Employers Overview"
      subtitle="Track registrations, verification, and hiring activity."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {isInitialLoading ? (
          <EmployersPageSkeleton />
        ) : (
          <>
            <EmployersOverviewHeader
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
              onAddEmployer={() => setAddDialogOpen(true)}
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
              <>
                <EmployersOverviewKpiStrip kpis={analytics.kpis} />

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <EmployersRegistrationTrendChart
                    data={analytics.registrationTrend}
                    isOverall={analyticsFilters.preset === "all"}
                  />
                  <EmployersOnboardingFunnel
                    stages={analytics.onboardingFunnel}
                    isLoading={analyticsQuery.isFetching && !analytics}
                    isError={analyticsQuery.isError}
                    onRetry={() => void analyticsQuery.refetch()}
                  />
                  <EmployersByIndustry items={analytics.byIndustry} />
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <EmployersByLocation
                    items={analytics.byLocation}
                    isLoading={analyticsQuery.isFetching && !analytics}
                    isError={analyticsQuery.isError}
                    onRetry={() => void analyticsQuery.refetch()}
                  />
                  <EmployerTypeDonut
                    items={analytics.employerType}
                    total={analytics.employerTypeTotal}
                  />
                  <TopHiringLocations
                    items={analytics.topHiringLocations}
                    isLoading={analyticsQuery.isFetching && !analytics}
                    isError={analyticsQuery.isError}
                    onRetry={() => void analyticsQuery.refetch()}
                  />
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start xl:gap-3.5">
              <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg">
                <EmployersTableSection
                  employers={listData?.employers ?? []}
                  totalEmployers={listData?.pagination.total ?? 0}
                  isLoading={employersQuery.isFetching && !listData}
                  isError={employersQuery.isError}
                  errorMessage={listErrorMessage}
                  onRetry={() => void employersQuery.refetch()}
                  onVerify={handleOpenVerify}
                  onReject={handleOpenReject}
                  onToggleStatus={handleOpenToggleStatus}
                  toolbar={
                    <div className="flex min-w-0 flex-col gap-2.5 xl:gap-2">
                      <EmployersOverviewTabs
                        activeTab={activeTab}
                        counts={analytics?.tabs ?? EMPTY_TABS}
                        onChange={handleTabChange}
                      />
                      <EmployersTableFilters
                        filters={tableFilters}
                        filterOptions={filterOptions}
                        onChange={handleTableFiltersChange}
                        onClear={handleClearTableFilters}
                      />
                    </div>
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

              <aside className="flex min-w-0 flex-col gap-3">
                <EmployersQuickActions
                  onExport={handleExport}
                  isExporting={exportMutation.isPending}
                />
                <EmployersAskAsliCard />
              </aside>
            </div>

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

      <AddEmployerDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />

      {actionType && selectedEmployer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-border-subtle bg-surface p-4 shadow-xl sm:p-5 animate-in fade-in-0 zoom-in-95">
            <h3 className="text-sm font-bold text-foreground">
              {actionType === "verify" && "Verify Employer"}
              {actionType === "reject" && "Reject Employer Verification"}
              {actionType === "suspend" && "Suspend Employer Account"}
              {actionType === "activate" && "Activate Employer Account"}
            </h3>

            <p className="mt-2 text-xs text-muted">
              {actionType === "verify" &&
                `Are you sure you want to verify ${selectedEmployer.displayName}? Their documents will be marked as approved.`}
              {actionType === "reject" &&
                `Are you sure you want to reject verification for ${selectedEmployer.displayName}?`}
              {actionType === "suspend" &&
                `Suspending ${selectedEmployer.displayName} will prevent them from posting new jobs and accessing active listings.`}
              {actionType === "activate" &&
                `Are you sure you want to reactivate ${selectedEmployer.displayName}?`}
            </p>

            {(actionType === "reject" || actionType === "suspend") && (
              <div className="mt-3">
                <label className="mb-1 block text-[11px] font-semibold text-muted">
                  Reason / Remarks
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action…"
                  rows={3}
                  className="w-full rounded-lg border border-border-subtle bg-hero-bg/60 p-2 text-xs text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            )}

            {actionError ? (
              <p className="mt-2 text-xs text-danger">{actionError}</p>
            ) : null}

            <div className="mt-4 flex flex-col-reverse items-center justify-end gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={
                  verifyMutation.isPending || statusMutation.isPending
                }
                className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-hero-bg/60 hover:text-foreground sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleExecuteAction()}
                disabled={
                  verifyMutation.isPending || statusMutation.isPending
                }
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors sm:w-auto ${
                  actionType === "reject" || actionType === "suspend"
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
              >
                {verifyMutation.isPending || statusMutation.isPending
                  ? "Processing…"
                  : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </OperationsLayout>
  );
}
