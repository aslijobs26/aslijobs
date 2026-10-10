import { useMemo, useState } from "react";
import {
  CANDIDATE_OVERVIEW_KPI_VIEWS,
  EMPTY_CANDIDATES_FILTERS,
  EMPTY_CANDIDATES_FILTER_OPTIONS,
} from "../../../../constants/operations-candidates-overview";
import { useOperationsCandidates } from "../../../../hooks/use-operations-candidates";
import type {
  OperationsCandidateListItem,
  OperationsCandidateOverviewKpi,
  OperationsCandidatesAnalyticsParams,
  OperationsCandidatesListParams,
} from "../../../../types/operations-candidates";
import { JobsPaginationBar } from "../../jobs/JobsPaginationBar";
import { OperationsKpiDrilldownBar } from "../../layout/OperationsKpiDrilldownBar";
import {
  CandidatesFiltersBar,
  type CandidatesFiltersState,
} from "../CandidatesFiltersBar";
import { CandidatesTableSection } from "../CandidatesTableSection";

interface CandidatesKpiDrilldownProps {
  kpi: OperationsCandidateOverviewKpi;
  /** Count and caption shown on the selected card, for the same analytics range. */
  cardCount?: number;
  cardCaption?: string;
  analyticsFilters: OperationsCandidatesAnalyticsParams;
  onBack: () => void;
  onDelete?: (application: OperationsCandidateListItem) => void;
  getErrorMessage: (error: unknown) => string;
}

export function CandidatesKpiDrilldown({
  kpi,
  cardCount,
  cardCaption,
  analyticsFilters,
  onBack,
  onDelete,
  getErrorMessage,
}: CandidatesKpiDrilldownProps) {
  const view = CANDIDATE_OVERVIEW_KPI_VIEWS[kpi];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<CandidatesFiltersState>(
    EMPTY_CANDIDATES_FILTERS,
  );

  const listParams = useMemo<OperationsCandidatesListParams>(
    () => ({
      page,
      limit,
      tab: "all",
      search: filters.search.trim(),
      status: "",
      jobId: "",
      employerId: "",
      location: filters.location,
      experience: filters.experience,
      gender: filters.gender,
      preferredRole: filters.preferredRole,
      profileStatus: filters.profileStatus,
      applicationPresence: filters.applicationPresence,
      datePreset: filters.registrationPreset || "all",
      dateFrom: "",
      dateTo: "",
      dateField: "registered",
      analyticsPreset: "all",
      analyticsFrom: "",
      analyticsTo: "",
      kpi,
      kpiPreset: analyticsFilters.preset,
      kpiDateFrom:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateFrom : "",
      kpiDateTo:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateTo : "",
    }),
    [page, limit, filters, kpi, analyticsFilters],
  );

  const candidatesQuery = useOperationsCandidates(listParams);
  const listData = candidatesQuery.data;
  const total = listData?.pagination.total ?? 0;
  const hasFilters = Object.values(filters).some((value) => value.trim() !== "");

  const handleFiltersChange = (next: Partial<CandidatesFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };

  return (
    <section
      aria-label={`${view.label} details`}
      className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg"
    >
      <OperationsKpiDrilldownBar
        label={view.label}
        caption={cardCaption}
        filteredCount={listData ? total : undefined}
        cardCount={cardCount}
        hasFilters={hasFilters}
        onBack={onBack}
      />

      <CandidatesTableSection
        title={view.label}
        applications={listData?.applications ?? []}
        totalCandidates={listData ? total : (cardCount ?? 0)}
        isLoading={candidatesQuery.isPending}
        isError={candidatesQuery.isError}
        errorMessage={
          candidatesQuery.error
            ? getErrorMessage(candidatesQuery.error)
            : undefined
        }
        onRetry={() => void candidatesQuery.refetch()}
        onDelete={onDelete}
        emptyTitle={view.emptyMessage}
        emptyDescription={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Nothing matches this card for the selected date range."
        }
        toolbar={
          <CandidatesFiltersBar
            filters={filters}
            filterOptions={
              listData?.filterOptions ?? EMPTY_CANDIDATES_FILTER_OPTIONS
            }
            onChange={handleFiltersChange}
            onClear={() => {
              setFilters(EMPTY_CANDIDATES_FILTERS);
              setPage(1);
            }}
          />
        }
      />

      {listData?.pagination && listData.pagination.total > 0 ? (
        <div className="border-t border-border-subtle p-3 max-sm:p-2.5 xl:p-2.5">
          <JobsPaginationBar
            pagination={listData.pagination}
            ariaLabel={`${view.label} pagination`}
            onPageChange={setPage}
            onLimitChange={(nextLimit: number) => {
              setLimit(nextLimit);
              setPage(1);
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
