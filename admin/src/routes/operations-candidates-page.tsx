import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { CandidatesFiltersBar, type CandidatesFiltersState } from "../components/operations/candidates/CandidatesFiltersBar";
import { CandidatesPageSkeleton } from "../components/operations/candidates/CandidatesPageSkeleton";
import { CandidatesTableSection } from "../components/operations/candidates/CandidatesTableSection";
import { formatCandidateDisplayId } from "../components/operations/candidates/candidates-format";
import { CandidatesByExperience } from "../components/operations/candidates/overview/CandidatesByExperience";
import { CandidatesByLanguage } from "../components/operations/candidates/overview/CandidatesByLanguage";
import { CandidatesByLocation } from "../components/operations/candidates/overview/CandidatesByLocation";
import { CandidatesOverviewHeader } from "../components/operations/candidates/overview/CandidatesOverviewHeader";
import { CandidatesOverviewKpiStrip } from "../components/operations/candidates/overview/CandidatesOverviewKpiStrip";
import { CandidatesOverviewTabs } from "../components/operations/candidates/overview/CandidatesOverviewTabs";
import { CandidatesProfileFunnel } from "../components/operations/candidates/overview/CandidatesProfileFunnel";
import { CandidatesAskAsliCard } from "../components/operations/candidates/overview/CandidatesAskAsliCard";
import { CandidatesQuickActions } from "../components/operations/candidates/overview/CandidatesQuickActions";
import { CandidatesRegistrationTrendChart } from "../components/operations/candidates/overview/CandidatesRegistrationTrendChart";
import { CandidatesTopCategories } from "../components/operations/candidates/overview/CandidatesTopCategories";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { useOperationsCandidates, useOperationsCandidatesAnalytics } from "../hooks/use-operations-candidates";
import type {
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesAnalyticsPreset,
  OperationsCandidatesListResult,
  OperationsCandidatesOverviewTab,
} from "../types/operations-candidates";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_FILTERS: CandidatesFiltersState = {
  search: "",
  location: "",
  experience: "",
  preferredRole: "",
  profileStatus: "",
  registrationPreset: "",
};

const EMPTY_TABS = { all: 0, new: 0, profileIncomplete: 0, verificationPending: 0 };
const ANALYTICS_PRESETS: OperationsCandidatesAnalyticsPreset[] = ["all", "last_7_days", "last_30_days", "last_3_months", "custom"];

function parseOverviewTab(value: string | null): OperationsCandidatesOverviewTab {
  return value === "new" || value === "profileIncomplete" || value === "verificationPending" ? value : "all";
}

function parsePreset(value: string | null): OperationsCandidatesAnalyticsPreset {
  return ANALYTICS_PRESETS.includes(value as OperationsCandidatesAnalyticsPreset) ? value as OperationsCandidatesAnalyticsPreset : "all";
}

function errorMessage(error: unknown, fallback: string): string {
  if (isOperationsSessionTransientError(error)) return "The API server is temporarily unavailable. Please wait a moment and retry.";
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session expired. Please refresh or sign in again.";
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function exportCandidatesCsv(result: OperationsCandidatesListResult): void {
  const rows = result.applications.map((item) => [
    formatCandidateDisplayId(item.jobSeekerId || item.id),
    item.candidateName,
    item.candidatePhone,
    (item.preferredRoles ?? []).join("; "),
    item.candidateExperienceLabel,
    item.candidateLocation,
    item.registeredAt ?? "",
    String(item.applicationCount ?? 0),
    item.profileStatusLabel,
  ]);
  const csv = [["Candidate ID", "Candidate", "Phone", "Preferred Roles", "Experience", "Location", "Registered At", "Applications", "Profile Status"], ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `operations-jobseekers-page-${result.pagination.page}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function OperationsCandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CandidatesFiltersState>(EMPTY_FILTERS);
  const [activeTab, setActiveTab] = useState<OperationsCandidatesOverviewTab>(() => parseOverviewTab(searchParams.get("overviewTab")));
  const [analyticsFilters, setAnalyticsFilters] = useState<OperationsCandidatesAnalyticsParams>({
    preset: parsePreset(searchParams.get("preset")),
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
  });

  useEffect(() => {
    setActiveTab(parseOverviewTab(searchParams.get("overviewTab")));
  }, [searchParams]);

  const listParams = useMemo(() => ({
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
    gender: "",
    preferredRole: filters.preferredRole,
    profileStatus: activeTab === "profileIncomplete" ? "incomplete" as const : filters.profileStatus,
    datePreset: filters.registrationPreset || (activeTab === "new" ? "last_30_days" as const : "all" as const),
    dateFrom: "",
    dateTo: "",
    dateField: "registered" as const,
    analyticsPreset: "all" as const,
    analyticsFrom: "",
    analyticsTo: "",
  }), [activeTab, filters, limit, page]);

  const analyticsQuery = useOperationsCandidatesAnalytics(analyticsFilters);
  const candidatesQuery = useOperationsCandidates(listParams);
  const analytics = analyticsQuery.data;
  const listData = candidatesQuery.data;
  const isInitialLoading = (analyticsQuery.isLoading && !analytics) || (candidatesQuery.isLoading && !listData);

  const syncAnalytics = (next: OperationsCandidatesAnalyticsParams) => {
    setAnalyticsFilters(next);
    const params = new URLSearchParams(searchParams);
    if (next.preset === "all") params.delete("preset");
    else params.set("preset", next.preset);
    if (next.preset === "custom" && next.dateFrom) params.set("dateFrom", next.dateFrom);
    else params.delete("dateFrom");
    if (next.preset === "custom" && next.dateTo) params.set("dateTo", next.dateTo);
    else params.delete("dateTo");
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

  const handleExport = () => {
    if (listData) exportCandidatesCsv(listData);
  };

  const listError = candidatesQuery.error ? errorMessage(candidatesQuery.error, "Failed to load jobseekers.") : undefined;
  const analyticsError = analyticsQuery.error ? errorMessage(analyticsQuery.error, "Failed to load jobseeker analytics.") : undefined;

  return (
    <OperationsLayout title="Jobseekers Overview" subtitle="Track registrations, profile completion, verification and engagement." headerVariant="command">
      <div className="flex w-full min-w-0 flex-col gap-3">
        {isInitialLoading ? <CandidatesPageSkeleton rowCount={limit} /> : (
          <>
            <CandidatesOverviewHeader
              preset={analyticsFilters.preset}
              dateFrom={analyticsFilters.dateFrom ?? ""}
              dateTo={analyticsFilters.dateTo ?? ""}
              onPresetChange={(preset) => syncAnalytics(preset === "custom" ? { preset, dateFrom: analyticsFilters.dateFrom || new Date().toISOString().slice(0, 10), dateTo: analyticsFilters.dateTo || new Date().toISOString().slice(0, 10) } : { preset, dateFrom: "", dateTo: "" })}
              onDateFromChange={(dateFrom) => syncAnalytics({ ...analyticsFilters, preset: "custom", dateFrom })}
              onDateToChange={(dateTo) => syncAnalytics({ ...analyticsFilters, preset: "custom", dateTo })}
              onExport={handleExport}
            />

            {analyticsError && !analytics ? <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-3 text-xs text-danger" role="alert">{analyticsError} <button type="button" className="ml-2 font-semibold underline" onClick={() => void analyticsQuery.refetch()}>Retry</button></div> : null}

            {analytics ? (
              <>
                <CandidatesOverviewKpiStrip kpis={analytics.kpis} />
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <CandidatesRegistrationTrendChart
                    data={analytics.registrationTrend}
                    isOverall={analyticsFilters.preset === "all"}
                  />
                  <CandidatesProfileFunnel stages={analytics.onboardingFunnel} />
                  <CandidatesByLanguage items={analytics.byLanguage} total={analytics.languageTotal} />
                </div>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  <CandidatesByLocation items={analytics.byLocation} />
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
                            genders: [],
                            preferredRoles: [],
                            profileStatuses: [],
                          }
                        }
                        onChange={(next) => {
                          setFilters((current) => ({ ...current, ...next }));
                          setPage(1);
                        }}
                        onClear={() => {
                          setFilters(EMPTY_FILTERS);
                          setPage(1);
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
                <CandidatesQuickActions onExport={handleExport} />
                <CandidatesAskAsliCard />
              </aside>
            </div>
          </>
        )}
      </div>
    </OperationsLayout>
  );
}
