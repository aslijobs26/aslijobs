import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import {
  CandidatesFiltersBar,
  type CandidatesFiltersState,
} from "../components/operations/candidates/CandidatesFiltersBar";
import { CandidatesPageSkeleton } from "../components/operations/candidates/CandidatesPageSkeleton";
import { CandidatesTableSection } from "../components/operations/candidates/CandidatesTableSection";
import { CandidatesByExperience } from "../components/operations/candidates/overview/CandidatesByExperience";
import { CandidatesByLanguage } from "../components/operations/candidates/overview/CandidatesByLanguage";
import { CandidatesByLocation } from "../components/operations/candidates/overview/CandidatesByLocation";
import { CandidatesOverviewHeader } from "../components/operations/candidates/overview/CandidatesOverviewHeader";
import { CandidatesOverviewKpiStrip } from "../components/operations/candidates/overview/CandidatesOverviewKpiStrip";
import { CandidatesOverviewTabs } from "../components/operations/candidates/overview/CandidatesOverviewTabs";
import { CandidatesAskAsliCard } from "../components/operations/candidates/overview/CandidatesAskAsliCard";
import { CandidatesProfileFunnel } from "../components/operations/candidates/overview/CandidatesProfileFunnel";
import { CandidatesQuickActions } from "../components/operations/candidates/overview/CandidatesQuickActions";
import { CandidatesRegistrationTrendChart } from "../components/operations/candidates/overview/CandidatesRegistrationTrendChart";
import { CandidatesTopCategories } from "../components/operations/candidates/overview/CandidatesTopCategories";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OPERATIONS_CANDIDATE_GENDERS, OPERATIONS_CANDIDATE_GENDER_LABELS } from "../constants/operations-candidates";
import {
  useExportOperationsCandidates,
  useOperationsCandidates,
  useOperationsCandidatesAnalytics,
} from "../hooks/use-operations-candidates";
import type {
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesAnalyticsPreset,
  OperationsCandidatesExportParams,
  OperationsCandidatesOverviewTab,
} from "../types/operations-candidates";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_FILTERS: CandidatesFiltersState = {
  search: "",
  location: "",
  experience: "",
  gender: "",
  preferredRole: "",
  profileStatus: "",
  applicationPresence: "",
  registrationPreset: "",
};

const EMPTY_TABS = {
  all: 0,
  new: 0,
  profileIncomplete: 0,
  verificationPending: 0,
};
const ANALYTICS_PRESETS: OperationsCandidatesAnalyticsPreset[] = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "custom",
];

function parseOverviewTab(
  value: string | null,
): OperationsCandidatesOverviewTab {
  return value === "new" ||
    value === "profileIncomplete" ||
    value === "verificationPending"
    ? value
    : "all";
}

function parsePreset(
  value: string | null,
): OperationsCandidatesAnalyticsPreset {
  return ANALYTICS_PRESETS.includes(
    value as OperationsCandidatesAnalyticsPreset,
  )
    ? (value as OperationsCandidatesAnalyticsPreset)
    : "all";
}

function errorMessage(error: unknown, fallback: string): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable. Please wait a moment and retry.";
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session expired. Please refresh or sign in again.";
    }
    if (error.response?.status === 403) {
      return "You do not have permission to perform this action.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

function AnalyticsSectionSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[5.5rem] animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
    </div>
  );
}

export function OperationsCandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CandidatesFiltersState>(() => ({
    ...EMPTY_FILTERS,
    search: searchParams.get("search")?.trim() ?? "",
  }));
  const [activeTab, setActiveTab] = useState<OperationsCandidatesOverviewTab>(
    () => parseOverviewTab(searchParams.get("overviewTab")),
  );
  const [analyticsFilters, setAnalyticsFilters] =
    useState<OperationsCandidatesAnalyticsParams>({
      preset: parsePreset(searchParams.get("preset")),
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    });

  useEffect(() => {
    setActiveTab(parseOverviewTab(searchParams.get("overviewTab")));
  }, [searchParams]);

  useEffect(() => {
    const urlSearch = searchParams.get("search")?.trim() ?? "";
    setFilters((current) =>
      current.search === urlSearch ? current : { ...current, search: urlSearch },
    );
  }, [searchParams]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      overviewTab: activeTab,
      verificationStatus: activeTab === "verificationPending" ? "pending" : "",
      tab: "all" as const,
      search: filters.search.trim(),
      status: "" as const,
      jobId: "",
      employerId: "",
      location: filters.location,
      experience: filters.experience,
      gender: filters.gender,
      preferredRole: filters.preferredRole,
      profileStatus:
        activeTab === "profileIncomplete"
          ? ("incomplete" as const)
          : filters.profileStatus,
      applicationPresence: filters.applicationPresence,
      datePreset:
        filters.registrationPreset ||
        (activeTab === "new" ? ("last_30_days" as const) : ("all" as const)),
      dateFrom: "",
      dateTo: "",
      dateField: "registered" as const,
      analyticsPreset: "all" as const,
      analyticsFrom: "",
      analyticsTo: "",
    }),
    [activeTab, filters, limit, page],
  );

  const exportParams = useMemo<OperationsCandidatesExportParams>(
    () => ({
      overviewTab: activeTab,
      verificationStatus: activeTab === "verificationPending" ? "pending" : "",
      search: filters.search.trim(),
      location: filters.location,
      experience: filters.experience,
      gender: filters.gender,
      preferredRole: filters.preferredRole,
      profileStatus:
        activeTab === "profileIncomplete"
          ? "incomplete"
          : filters.profileStatus,
      applicationPresence: filters.applicationPresence,
      datePreset:
        filters.registrationPreset ||
        (activeTab === "new" ? "last_30_days" : "all"),
      format: "xlsx",
    }),
    [activeTab, filters],
  );

  const analyticsQuery = useOperationsCandidatesAnalytics(analyticsFilters);
  const candidatesQuery = useOperationsCandidates(listParams);
  const exportMutation = useExportOperationsCandidates();
  const analytics = analyticsQuery.data;
  const listData = candidatesQuery.data;
  const isInitialLoading =
    (candidatesQuery.isLoading && !listData) ||
    (analyticsQuery.isLoading && !analytics && !listData);

  const syncAnalytics = (next: OperationsCandidatesAnalyticsParams) => {
    setAnalyticsFilters(next);
    const params = new URLSearchParams(searchParams);
    if (next.preset === "all") params.delete("preset");
    else params.set("preset", next.preset);
    if (next.preset === "custom" && next.dateFrom) {
      params.set("dateFrom", next.dateFrom);
    } else params.delete("dateFrom");
    if (next.preset === "custom" && next.dateTo) {
      params.set("dateTo", next.dateTo);
    } else params.delete("dateTo");
    setSearchParams(params, { replace: true });
  };

  const handleTabChange = (tab: OperationsCandidatesOverviewTab) => {
    setActiveTab(tab);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (tab === "all") params.delete("overviewTab");
    else params.set("overviewTab", tab);
    setSearchParams(params, { replace: true });
  };

  const handleFiltersChange = (next: Partial<CandidatesFiltersState>) => {
    setFilters((current) => {
      const merged = { ...current, ...next };
      if ("search" in next) {
        const params = new URLSearchParams(searchParams);
        const search = merged.search.trim();
        if (search) params.set("search", search);
        else params.delete("search");
        setSearchParams(params, { replace: true });
      }
      return merged;
    });
    setPage(1);
  };

  const handleExport = () => {
    void exportMutation.mutateAsync(exportParams).catch(() => undefined);
  };

  const listError = candidatesQuery.error
    ? errorMessage(candidatesQuery.error, "Failed to load jobseekers.")
    : undefined;
  const analyticsError = analyticsQuery.error
    ? errorMessage(
        analyticsQuery.error,
        "Failed to load jobseeker analytics.",
      )
    : undefined;
  const exportError = exportMutation.error
    ? errorMessage(exportMutation.error, "Failed to export jobseekers.")
    : undefined;

  return (
    <OperationsLayout
      title="Jobseekers Overview"
      subtitle="Track registrations, profile completion, WhatsApp verification and engagement."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {isInitialLoading ? (
          <CandidatesPageSkeleton rowCount={limit} />
        ) : (
          <>
            <CandidatesOverviewHeader
              preset={analyticsFilters.preset}
              dateFrom={analyticsFilters.dateFrom ?? ""}
              dateTo={analyticsFilters.dateTo ?? ""}
              onPresetChange={(preset) =>
                syncAnalytics(
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
                syncAnalytics({
                  ...analyticsFilters,
                  preset: "custom",
                  dateFrom,
                })
              }
              onDateToChange={(dateTo) =>
                syncAnalytics({
                  ...analyticsFilters,
                  preset: "custom",
                  dateTo,
                })
              }
              onExport={handleExport}
              isExporting={exportMutation.isPending}
            />

            {exportError ? (
              <div
                className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger"
                role="alert"
              >
                {exportError}
              </div>
            ) : null}

            {analyticsQuery.isFetching && !analytics ? (
              <AnalyticsSectionSkeleton />
            ) : null}

            {analyticsError && !analytics ? (
              <div
                className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger"
                role="alert"
              >
                {analyticsError}{" "}
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
                <CandidatesOverviewKpiStrip kpis={analytics.kpis} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <CandidatesRegistrationTrendChart
                    data={analytics.registrationTrend}
                    isOverall={analyticsFilters.preset === "all"}
                  />
                  <CandidatesProfileFunnel stages={analytics.onboardingFunnel} />
                  <CandidatesByLanguage
                    items={analytics.byLanguage}
                    total={analytics.languageTotal}
                  />
                  <CandidatesByLocation
                    items={analytics.byLocation}
                    cities={analytics.byCity ?? []}
                  />
                  <CandidatesByExperience items={analytics.byExperience} />
                  <CandidatesTopCategories items={analytics.topJobCategories} />
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start xl:gap-3.5">
              <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg">
                <CandidatesTableSection
                  applications={listData?.applications ?? []}
                  totalCandidates={listData?.pagination.total ?? 0}
                  isLoading={candidatesQuery.isFetching && !listData}
                  isError={candidatesQuery.isError}
                  errorMessage={listError}
                  onRetry={() => void candidatesQuery.refetch()}
                  toolbar={
                    <div className="flex min-w-0 flex-col gap-2.5 xl:gap-1.5">
                      <CandidatesOverviewTabs
                        activeTab={activeTab}
                        counts={analytics?.tabs ?? EMPTY_TABS}
                        onChange={handleTabChange}
                      />
                      <CandidatesFiltersBar
                        filters={filters}
                        filterOptions={
                          listData?.filterOptions ?? {
                            jobs: [],
                            employers: [],
                            locations: [],
                            experienceLevels: [],
                            genders: OPERATIONS_CANDIDATE_GENDERS.map((value) => ({
                              value,
                              label: OPERATIONS_CANDIDATE_GENDER_LABELS[value],
                            })),
                            preferredRoles: [],
                            profileStatuses: [],
                          }
                        }
                        onChange={handleFiltersChange}
                        onClear={() => {
                          setFilters(EMPTY_FILTERS);
                          setPage(1);
                          const params = new URLSearchParams(searchParams);
                          params.delete("search");
                          setSearchParams(params, { replace: true });
                        }}
                      />
                    </div>
                  }
                />
                {listData?.pagination ? (
                  <div className="border-t border-border-subtle p-3 xl:p-2.5">
                    <JobsPaginationBar
                      pagination={listData.pagination}
                      ariaLabel="Jobseekers pagination"
                      onPageChange={setPage}
                      onLimitChange={(next) => {
                        setLimit(next);
                        setPage(1);
                      }}
                    />
                  </div>
                ) : null}
              </div>

              <aside className="flex min-w-0 flex-col gap-3">
                <CandidatesQuickActions
                  onExport={handleExport}
                  isExporting={exportMutation.isPending}
                />
                <CandidatesAskAsliCard />
              </aside>
            </div>
          </>
        )}
      </div>
    </OperationsLayout>
  );
}
