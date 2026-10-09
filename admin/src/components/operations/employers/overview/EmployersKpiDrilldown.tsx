import { useMemo, useState } from "react";
import { EMPLOYER_OVERVIEW_KPI_VIEWS } from "../../../../constants/operations-employers-overview";
import { useOperationsEmployers } from "../../../../hooks/use-operations-employers";
import type {
  OperationsEmployerListItem,
  OperationsEmployerOverviewKpi,
  OperationsEmployersAnalyticsParams,
  OperationsEmployersFilterOptions,
  OperationsEmployersListParams,
} from "../../../../types/operations-employers";
import { JobsPaginationBar } from "../../jobs/JobsPaginationBar";
import { OperationsKpiDrilldownBar } from "../../layout/OperationsKpiDrilldownBar";
import { EmployersTableSection } from "../EmployersTableSection";
import {
  EMPTY_EMPLOYERS_TABLE_FILTERS,
  EmployersTableFilters,
  type EmployersTableFiltersState,
} from "../EmployersTableFilters";

const EMPTY_FILTER_OPTIONS: OperationsEmployersFilterOptions = {
  verificationStatuses: [],
  employerTypes: [],
  locations: [],
  statuses: [],
};

interface EmployersKpiDrilldownProps {
  kpi: OperationsEmployerOverviewKpi;
  /** Count and caption shown on the selected card, for the same analytics range. */
  cardCount?: number;
  cardCaption?: string;
  analyticsFilters: OperationsEmployersAnalyticsParams;
  onBack: () => void;
  getErrorMessage: (error: unknown) => string;
  onVerify: (employer: OperationsEmployerListItem) => void;
  onReject: (employer: OperationsEmployerListItem) => void;
  onToggleStatus: (employer: OperationsEmployerListItem) => void;
  onDelete: (employer: OperationsEmployerListItem) => void;
}

export function EmployersKpiDrilldown({
  kpi,
  cardCount,
  cardCaption,
  analyticsFilters,
  onBack,
  getErrorMessage,
  onVerify,
  onReject,
  onToggleStatus,
  onDelete,
}: EmployersKpiDrilldownProps) {
  const view = EMPLOYER_OVERVIEW_KPI_VIEWS[kpi];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<EmployersTableFiltersState>(
    EMPTY_EMPLOYERS_TABLE_FILTERS,
  );

  const listParams = useMemo<OperationsEmployersListParams>(
    () => ({
      page,
      limit,
      search: filters.search.trim(),
      verificationStatus: filters.verificationStatus,
      status: filters.status,
      employerType: filters.employerType,
      location: filters.location,
      datePreset: filters.registrationPreset || "all",
      kpi,
      kpiPreset: analyticsFilters.preset,
      kpiDateFrom:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateFrom : "",
      kpiDateTo:
        analyticsFilters.preset === "custom" ? analyticsFilters.dateTo : "",
    }),
    [page, limit, filters, kpi, analyticsFilters],
  );

  const employersQuery = useOperationsEmployers(listParams);
  const listData = employersQuery.data;
  const total = listData?.pagination.total ?? 0;
  const hasFilters = Object.values(filters).some((value) =>
    typeof value === "string" ? value.trim() !== "" : Boolean(value),
  );

  const handleFiltersChange = (next: Partial<EmployersTableFiltersState>) => {
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

      <EmployersTableSection
        title={view.label}
        employers={listData?.employers ?? []}
        totalEmployers={listData ? total : (cardCount ?? 0)}
        isLoading={employersQuery.isPending}
        isError={employersQuery.isError}
        errorMessage={
          employersQuery.error
            ? getErrorMessage(employersQuery.error)
            : undefined
        }
        onRetry={() => void employersQuery.refetch()}
        onVerify={onVerify}
        onReject={onReject}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
        emptyTitle={view.emptyMessage}
        emptyDescription={
          hasFilters
            ? "Try adjusting your search or filters."
            : "Nothing matches this card for the selected date range."
        }
        toolbar={
          <EmployersTableFilters
            filters={filters}
            filterOptions={listData?.filterOptions ?? EMPTY_FILTER_OPTIONS}
            onChange={handleFiltersChange}
            onClear={() => {
              setFilters(EMPTY_EMPLOYERS_TABLE_FILTERS);
              setPage(1);
            }}
          />
        }
      />

      {listData?.pagination && listData.pagination.total > 0 ? (
        <div className="border-t border-border-subtle p-3 xl:p-2.5">
          <JobsPaginationBar
            pagination={listData.pagination}
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
