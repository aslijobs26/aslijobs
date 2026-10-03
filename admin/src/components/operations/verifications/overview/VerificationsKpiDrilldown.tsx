import { useMemo, useState } from "react";
import { VERIFICATION_OVERVIEW_KPI_VIEWS } from "../../../../constants/operations-verifications-overview";
import { useOperationsVerificationsList } from "../../../../hooks/use-operations-verifications";
import type {
  OperationsVerificationOverviewKpi,
  OperationsVerificationsAnalyticsParams,
  OperationsVerificationsFilterOptions,
  OperationsVerificationsListParams,
} from "../../../../types/operations-verifications";
import { JobsPaginationBar } from "../../jobs/JobsPaginationBar";
import { OperationsKpiDrilldownBar } from "../../layout/OperationsKpiDrilldownBar";
import {
  EMPTY_VERIFICATIONS_FILTERS,
  VerificationsFiltersBar,
  type VerificationsFiltersState,
} from "../VerificationsFiltersBar";
import { VerificationsTableSection } from "../VerificationsTableSection";

const EMPTY_FILTER_OPTIONS: OperationsVerificationsFilterOptions = {
  statuses: [],
  industries: [],
  locations: [],
  slaOptions: [],
};

interface VerificationsKpiDrilldownProps {
  kpi: OperationsVerificationOverviewKpi;
  /** Count and caption shown on the selected card, for the same analytics range. */
  cardCount?: number;
  cardCaption?: string;
  analyticsFilters: OperationsVerificationsAnalyticsParams;
  onBack: () => void;
  getErrorMessage: (error: unknown) => string;
}

export function VerificationsKpiDrilldown({
  kpi,
  cardCount,
  cardCaption,
  analyticsFilters,
  onBack,
  getErrorMessage,
}: VerificationsKpiDrilldownProps) {
  const view = VERIFICATION_OVERVIEW_KPI_VIEWS[kpi];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<VerificationsFiltersState>(
    EMPTY_VERIFICATIONS_FILTERS,
  );

  const listParams = useMemo<OperationsVerificationsListParams>(
    () => ({
      page,
      limit,
      search: filters.search
        .trim()
        .replace(/^AJ-EMP-/i, "")
        .replace(/^EMP-/i, ""),
      status: filters.status,
      industry: filters.industry,
      location: filters.location,
      datePreset: filters.submissionPreset || "all",
      kpi,
      kpiPreset: analyticsFilters.preset,
      kpiDateFrom:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateFrom : "",
      kpiDateTo:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateTo : "",
    }),
    [page, limit, filters, kpi, analyticsFilters],
  );

  const listQuery = useOperationsVerificationsList(listParams);
  const listData = listQuery.data;
  const total = listData?.pagination.total ?? 0;
  const hasFilters = Object.values(filters).some((value) => value.trim() !== "");

  const handleFiltersChange = (next: Partial<VerificationsFiltersState>) => {
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

      <VerificationsTableSection
        title={view.label}
        items={listData?.items ?? []}
        totalItems={listData ? total : (cardCount ?? 0)}
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        errorMessage={
          listQuery.error ? getErrorMessage(listQuery.error) : undefined
        }
        onRetry={() => void listQuery.refetch()}
        emptyTitle={view.emptyMessage}
        emptyDescription={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Nothing matches this card for the selected date range."
        }
        toolbar={
          <VerificationsFiltersBar
            filters={filters}
            filterOptions={listData?.filterOptions ?? EMPTY_FILTER_OPTIONS}
            onChange={handleFiltersChange}
            onClear={() => {
              setFilters(EMPTY_VERIFICATIONS_FILTERS);
              setPage(1);
            }}
          />
        }
      />

      {listData?.pagination && listData.pagination.total > 0 ? (
        <div className="border-t border-border-subtle p-3 xl:p-2.5">
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
