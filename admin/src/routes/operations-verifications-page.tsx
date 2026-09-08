import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  EMPTY_VERIFICATIONS_FILTERS,
  VerificationsFiltersBar,
  type VerificationsFiltersState,
} from "../components/operations/verifications/VerificationsFiltersBar";
import { VerificationsKpiStrip } from "../components/operations/verifications/VerificationsKpiStrip";
import { VerificationsPageSkeleton } from "../components/operations/verifications/VerificationsPageSkeleton";
import { VerificationsTableSection } from "../components/operations/verifications/VerificationsTableSection";
import {
  VerificationsTabs,
  type OperationsVerificationTab,
  type OperationsVerificationTabCounts,
} from "../components/operations/verifications/VerificationsTabs";
import { useOperationsEmployers } from "../hooks/use-operations-employers";
import type {
  OperationsEmployerDatePreset,
  OperationsEmployersFilterOptions,
} from "../types/operations-employers";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_FILTER_OPTIONS: OperationsEmployersFilterOptions = {
  verificationStatuses: [],
  employerTypes: [],
  locations: [],
  statuses: [],
};

const EMPTY_TAB_COUNTS: OperationsVerificationTabCounts = {
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

function parseVerificationTab(
  value: string | null,
): OperationsVerificationTab {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "all"
  ) {
    return value;
  }
  return "pending";
}

function tabToVerificationStatus(
  tab: OperationsVerificationTab,
): string {
  switch (tab) {
    case "pending":
      return "pending";
    case "approved":
      return "verified";
    case "rejected":
      return "rejected";
    default:
      return "";
  }
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
    employerType: searchParams.get("employerType") ?? "",
    location: searchParams.get("location") ?? "",
  }));
  const [activeTab, setActiveTab] = useState<OperationsVerificationTab>(() =>
    parseVerificationTab(
      searchParams.get("tab") ??
        (searchParams.get("verificationStatus") === "pending"
          ? "pending"
          : null),
    ),
  );

  useEffect(() => {
    const urlTab = parseVerificationTab(
      searchParams.get("tab") ??
        (searchParams.get("verificationStatus") === "pending"
          ? "pending"
          : null),
    );
    setActiveTab(urlTab);
  }, [searchParams]);

  const listQueryParams = useMemo(
    () => ({
      page,
      limit,
      search: filters.search
        .trim()
        .replace(/^AJ-EMP-/i, "")
        .replace(/^EMP-/i, ""),
      verificationStatus: tabToVerificationStatus(activeTab),
      employerType: filters.employerType,
      location: filters.location,
      datePreset: (filters.submissionPreset ||
        "all") as OperationsEmployerDatePreset,
      dateFrom: "",
      dateTo: "",
    }),
    [page, limit, filters, activeTab],
  );

  const pendingTodayQuery = useOperationsEmployers({
    page: 1,
    limit: 1,
    verificationStatus: "pending",
    datePreset: "today",
  });

  const employersQuery = useOperationsEmployers(listQueryParams);

  const filterOptions =
    employersQuery.data?.filterOptions ?? EMPTY_FILTER_OPTIONS;
  const kpis = employersQuery.data?.kpis;
  const listData = employersQuery.data;

  const tabCounts: OperationsVerificationTabCounts = kpis
    ? {
        all: kpis.totalEmployers,
        pending: kpis.pendingVerification,
        approved: kpis.verifiedEmployers,
        rejected: kpis.rejected,
      }
    : EMPTY_TAB_COUNTS;

  const handleFiltersChange = (next: Partial<VerificationsFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_VERIFICATIONS_FILTERS);
    setPage(1);
  };

  const handleTabChange = (tab: OperationsVerificationTab) => {
    setActiveTab(tab);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (tab === "pending") {
      next.set("tab", "pending");
      next.set("verificationStatus", "pending");
    } else if (tab === "all") {
      next.delete("tab");
      next.delete("verificationStatus");
    } else {
      next.set("tab", tab);
      next.delete("verificationStatus");
    }
    setSearchParams(next, { replace: true });
  };

  const isInitialLoading = employersQuery.isLoading && !listData;
  const listErrorMessage = employersQuery.error
    ? queryErrorMessage(
        employersQuery.error,
        "Failed to load employer verifications. Please try again.",
      )
    : undefined;

  return (
    <OperationsLayout
      title="Employer Verifications"
      subtitle="Review and manage employer verification submissions."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3">
        {isInitialLoading ? (
          <VerificationsPageSkeleton />
        ) : (
          <>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground sm:text-lg">
                Employer Verifications
              </h1>
              <p className="mt-0.5 text-xs text-muted">
                Review and manage employer verification submissions.
              </p>
            </div>

            {kpis ? (
              <VerificationsKpiStrip
                kpis={{
                  totalPending: kpis.pendingVerification,
                  pendingToday: pendingTodayQuery.data?.pagination.total ?? 0,
                  approved: kpis.verifiedEmployers,
                  rejected: kpis.rejected,
                }}
              />
            ) : null}

            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow">
              <VerificationsTableSection
                employers={listData?.employers ?? []}
                totalEmployers={listData?.pagination.total ?? 0}
                isLoading={employersQuery.isFetching && !listData}
                isError={employersQuery.isError}
                errorMessage={listErrorMessage}
                onRetry={() => void employersQuery.refetch()}
                toolbar={
                  <div className="flex min-w-0 flex-col gap-2.5 xl:gap-2">
                    <VerificationsTabs
                      activeTab={activeTab}
                      counts={tabCounts}
                      onChange={handleTabChange}
                    />
                    <VerificationsFiltersBar
                      filters={filters}
                      filterOptions={filterOptions}
                      onChange={handleFiltersChange}
                      onClear={handleClearFilters}
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
          </>
        )}
      </div>
    </OperationsLayout>
  );
}
