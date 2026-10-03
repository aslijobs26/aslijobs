import { useMemo, useState } from "react";
import {
  PLACEMENT_OVERVIEW_KPI_VIEWS,
  type PlacementOverviewKpi,
} from "../../../../constants/operations-placements-overview";
import { useOperationsPlacementsList } from "../../../../hooks/use-operations-placements";
import type {
  OperationsPlacementsAnalyticsParams,
  OperationsPlacementsListParams,
} from "../../../../types/operations-placements";
import { JobsPaginationBar } from "../../jobs/JobsPaginationBar";
import { OperationsKpiDrilldownBar } from "../../layout/OperationsKpiDrilldownBar";
import { PlacementsTableSection } from "../PlacementsTableSection";

interface PlacementsKpiDrilldownProps {
  kpi: PlacementOverviewKpi;
  /** Placements counted by the selected card, for the same analytics range. */
  cardCount?: number;
  cardCaption?: string;
  analyticsFilters: OperationsPlacementsAnalyticsParams;
  onBack: () => void;
  getErrorMessage: (error: unknown) => string;
}

export function PlacementsKpiDrilldown({
  kpi,
  cardCount,
  cardCaption,
  analyticsFilters,
  onBack,
  getErrorMessage,
}: PlacementsKpiDrilldownProps) {
  const view = PLACEMENT_OVERVIEW_KPI_VIEWS[kpi];
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const listParams = useMemo<OperationsPlacementsListParams>(
    () => ({
      page,
      limit,
      search: search.trim(),
      status: view.status,
      preset: analyticsFilters.preset,
      dateFrom:
        analyticsFilters.preset === "custom"
          ? analyticsFilters.dateFrom
          : undefined,
      dateTo:
        analyticsFilters.preset === "custom"
          ? analyticsFilters.dateTo
          : undefined,
      sort: "placedAt",
      order: "desc",
    }),
    [page, limit, search, view.status, analyticsFilters],
  );

  const listQuery = useOperationsPlacementsList(listParams);
  const listData = listQuery.data;
  const total = listData?.pagination.total ?? 0;
  const hasFilters = search.trim() !== "";

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

      <PlacementsTableSection
        title={view.isDays ? "Joined Placements" : view.label}
        items={listData?.items ?? []}
        totalItems={listData ? total : (cardCount ?? 0)}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        isLoading={listQuery.isPending}
        isError={listQuery.isError}
        errorMessage={
          listQuery.error ? getErrorMessage(listQuery.error) : undefined
        }
        onRetry={() => void listQuery.refetch()}
        showViewAll={false}
        emptyTitle={view.emptyMessage}
        emptyDescription={
          hasFilters
            ? "Try adjusting your search."
            : "Nothing matches this card for the selected date range."
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
