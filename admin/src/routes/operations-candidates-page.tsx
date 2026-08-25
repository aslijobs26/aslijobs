import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  CandidatesDateAnalyticsBar,
  type CandidatesDateFiltersState,
} from "../components/operations/candidates/CandidatesDateAnalyticsBar";
import {
  CandidatesFiltersBar,
  type CandidatesFiltersState,
} from "../components/operations/candidates/CandidatesFiltersBar";
import { CandidatesInsightsStrip } from "../components/operations/candidates/CandidatesInsightsStrip";
import { CandidatesKpiStrip } from "../components/operations/candidates/CandidatesKpiStrip";
import { CandidatesPageSkeleton } from "../components/operations/candidates/CandidatesPageSkeleton";
import { CandidatesTableSection } from "../components/operations/candidates/CandidatesTableSection";
import { CandidatesTabs } from "../components/operations/candidates/CandidatesTabs";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { formatCandidateDisplayId } from "../components/operations/candidates/candidates-format";
import { useOperationsCandidates } from "../hooks/use-operations-candidates";
import type {
  OperationsCandidateTab,
  OperationsCandidatesInsight,
  OperationsCandidatesListResult,
} from "../types/operations-candidates";

const DEFAULT_FILTERS: CandidatesFiltersState = {
  search: "",
  status: "",
  jobId: "",
  employerId: "",
  location: "",
  experience: "",
  gender: "",
};

const DEFAULT_DATE_FILTERS: CandidatesDateFiltersState = {
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
};

function exportCandidatesCsv(result: OperationsCandidatesListResult): void {
  const header = [
    "Candidate ID",
    "Application ID",
    "Candidate",
    "Email",
    "Phone",
    "Job ID",
    "Job Title",
    "Employer",
    "Status",
    "Applied At",
    "Registered At",
    "Experience",
    "Location",
  ];

  const rows = result.applications.map((item) => [
    formatCandidateDisplayId(item.jobSeekerId || item.id),
    item.applicationId ?? "",
    item.candidateName,
    item.candidateEmail,
    item.candidatePhone,
    item.publicJobId,
    item.jobTitle,
    item.employerName,
    item.statusLabel,
    item.appliedAt ?? "",
    item.registeredAt ?? "",
    item.candidateExperienceLabel,
    item.candidateLocation,
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
  anchor.download = `operations-candidates-page-${result.pagination.page}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function OperationsCandidatesPage() {
  const [tab, setTab] = useState<OperationsCandidateTab>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CandidatesFiltersState>(DEFAULT_FILTERS);
  const [dateFilters, setDateFilters] =
    useState<CandidatesDateFiltersState>(DEFAULT_DATE_FILTERS);
  const [dateField, setDateField] =
    useState<"applied" | "registered">("registered");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
      jobId: filters.jobId,
      employerId: filters.employerId,
      location: filters.location,
      experience: filters.experience,
      gender: filters.gender,
      datePreset: dateFilters.datePreset,
      dateFrom: dateFilters.dateFrom,
      dateTo: dateFilters.dateTo,
      dateField,
    }),
    [
      page,
      limit,
      tab,
      debouncedSearch,
      filters.status,
      filters.jobId,
      filters.employerId,
      filters.location,
      filters.experience,
      filters.gender,
      dateFilters.datePreset,
      dateFilters.dateFrom,
      dateFilters.dateTo,
      dateField,
    ],
  );

  const candidatesQuery = useOperationsCandidates(queryParams);
  const data = candidatesQuery.data;
  const isPageLoading =
    candidatesQuery.isPending || (candidatesQuery.isFetching && !data);
  const isSoftRefreshing =
    Boolean(data) && candidatesQuery.isFetching && !candidatesQuery.isPending;

  const errorMessage = (() => {
    if (!candidatesQuery.error) {
      return undefined;
    }

    if (isAxiosError(candidatesQuery.error)) {
      const status = candidatesQuery.error.response?.status;
      if (status === 401) {
        return "Your session is invalid or expired. Please log out and sign in again to load candidates.";
      }

      const payload = candidatesQuery.error.response?.data as
        | { message?: string }
        | undefined;
      if (payload?.message?.trim()) {
        return payload.message.trim();
      }

      return candidatesQuery.error.message;
    }

    if (candidatesQuery.error instanceof Error) {
      return candidatesQuery.error.message;
    }

    return "Failed to load candidates.";
  })();

  const handleFiltersChange = (next: Partial<CandidatesFiltersState>) => {
    setFilters((current) => ({ ...current, ...next }));
    if (next.status !== undefined && next.status !== "") {
      setTab("all");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setDateFilters(DEFAULT_DATE_FILTERS);
    setDateField("registered");
    setPage(1);
  };

  const handleDateFiltersChange = (
    next: Partial<CandidatesDateFiltersState>,
  ) => {
    setDateFilters((current) => ({ ...current, ...next }));
    // Arrival analytics always filters the table by registration date.
    setDateField("registered");
    setPage(1);
  };

  const handleTabChange = (nextTab: OperationsCandidateTab) => {
    setTab(nextTab);
    if (nextTab !== "all") {
      setFilters((current) => ({ ...current, status: "" }));
    }
    setPage(1);
  };

  const handleInsightSelect = (insight: OperationsCandidatesInsight) => {
    if (insight.datePreset) {
      setDateFilters({
        datePreset: insight.datePreset,
        dateFrom: "",
        dateTo: "",
      });
      setDateField(
        insight.id === "new-today" || insight.id === "registered-7d"
          ? "registered"
          : "applied",
      );
    }

    if (insight.tab) {
      setTab(insight.tab);
      setFilters((current) => ({ ...current, status: "" }));
    } else if (insight.id === "needs-review") {
      setTab("applied");
      setFilters((current) => ({ ...current, status: "" }));
    } else if (insight.id === "no-active-app") {
      setTab("all");
      setFilters(DEFAULT_FILTERS);
      setDateFilters(DEFAULT_DATE_FILTERS);
      setDateField("registered");
    }

    setPage(1);
  };

  return (
    <OperationsLayout
      title="Candidates"
      subtitle="View, search and manage all job candidates across jobs and employers."
    >
      {isPageLoading ? (
        <CandidatesPageSkeleton rowCount={limit} />
      ) : candidatesQuery.isError && !data ? (
        <div className="rounded-xl border border-border-subtle bg-surface px-4 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-danger">
            {errorMessage ?? "Failed to load candidates."}
          </p>
          <button
            type="button"
            onClick={() => void candidatesQuery.refetch()}
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

          <CandidatesKpiStrip kpis={data.kpis} />

          <CandidatesDateAnalyticsBar
            filters={dateFilters}
            periodStats={data.periodStats}
            onChange={handleDateFiltersChange}
          />

          <CandidatesInsightsStrip
            insights={data.insights}
            onSelect={handleInsightSelect}
          />

          <CandidatesFiltersBar
            filters={filters}
            filterOptions={data.filterOptions}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            onExport={() => exportCandidatesCsv(data)}
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
              <CandidatesTabs
                activeTab={tab}
                counts={data.counts}
                onChange={handleTabChange}
              />
            </div>
            <CandidatesTableSection
              applications={data.applications}
              isLoading={isSoftRefreshing}
              isError={candidatesQuery.isError}
              errorMessage={errorMessage}
              onRetry={() => void candidatesQuery.refetch()}
            />
          </div>

          <JobsPaginationBar
            pagination={data.pagination}
            ariaLabel="Candidates pagination"
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        </div>
      ) : null}
    </OperationsLayout>
  );
}
