import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  CandidatesDateAnalyticsBar,
  type CandidatesDateFiltersState,
} from "../components/operations/candidates/CandidatesDateAnalyticsBar";
import {
  CandidatesFiltersBar,
  type CandidatesFiltersState,
} from "../components/operations/candidates/CandidatesFiltersBar";
import { CandidatesKpiStrip } from "../components/operations/candidates/CandidatesKpiStrip";
import { CandidatesPageSkeleton } from "../components/operations/candidates/CandidatesPageSkeleton";
import { CandidatesTableSection } from "../components/operations/candidates/CandidatesTableSection";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { formatCandidateDisplayId } from "../components/operations/candidates/candidates-format";
import { useOperationsCandidates } from "../hooks/use-operations-candidates";
import type {
  OperationsCandidateDatePreset,
  OperationsCandidatesListResult,
} from "../types/operations-candidates";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const DEFAULT_FILTERS: CandidatesFiltersState = {
  search: "",
  location: "",
  experience: "",
  preferredRole: "",
  profileStatus: "",
  registrationPreset: "",
};

const DEFAULT_DATE_FILTERS: CandidatesDateFiltersState = {
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
};

function exportCandidatesCsv(result: OperationsCandidatesListResult): void {
  const header = [
    "Candidate ID",
    "Candidate",
    "Phone",
    "Preferred Roles",
    "Experience",
    "Location",
    "Registered At",
    "Applications",
    "Profile Status",
  ];

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

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `operations-candidates-page-${result.pagination.page}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function OperationsCandidatesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CandidatesFiltersState>(DEFAULT_FILTERS);
  const [dateFilters, setDateFilters] =
    useState<CandidatesDateFiltersState>(DEFAULT_DATE_FILTERS);

  const listDatePreset: OperationsCandidateDatePreset = dateFilters.datePreset;
  const listDateFrom =
    listDatePreset === "custom" ? dateFilters.dateFrom : "";
  const listDateTo = listDatePreset === "custom" ? dateFilters.dateTo : "";

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      tab: "all" as const,
      search: filters.search.trim(),
      status: "" as const,
      jobId: "",
      employerId: "",
      location: filters.location,
      experience: filters.experience,
      gender: "",
      preferredRole: filters.preferredRole,
      profileStatus: filters.profileStatus,
      datePreset: listDatePreset,
      dateFrom: listDateFrom,
      dateTo: listDateTo,
      dateField: "registered" as const,
      analyticsPreset: listDatePreset,
      analyticsFrom: listDateFrom,
      analyticsTo: listDateTo,
    }),
    [
      page,
      limit,
      filters.search,
      filters.location,
      filters.experience,
      filters.preferredRole,
      filters.profileStatus,
      listDatePreset,
      listDateFrom,
      listDateTo,
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

    if (isOperationsSessionTransientError(candidatesQuery.error)) {
      return "The API server is temporarily unavailable. Please wait a moment and retry.";
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

    if (next.registrationPreset !== undefined) {
      if (next.registrationPreset === "") {
        setDateFilters({
          datePreset: "all",
          dateFrom: "",
          dateTo: "",
        });
      } else {
        setDateFilters({
          datePreset: next.registrationPreset,
          dateFrom: "",
          dateTo: "",
        });
      }
    }

    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setDateFilters(DEFAULT_DATE_FILTERS);
    setPage(1);
  };

  const handleDateFiltersChange = (
    next: Partial<CandidatesDateFiltersState>,
  ) => {
    const merged = { ...dateFilters, ...next };
    setDateFilters(merged);
    setFilters((current) => ({
      ...current,
      registrationPreset:
        merged.datePreset === "all" || merged.datePreset === "custom"
          ? ""
          : merged.datePreset,
    }));
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
            <CandidatesTableSection
              applications={data.applications}
              totalCandidates={data.pagination.total}
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
