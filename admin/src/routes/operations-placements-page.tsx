import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { PlacementsAskAsliCard } from "../components/operations/placements/overview/PlacementsAskAsliCard";
import { PlacementsByCategory } from "../components/operations/placements/overview/PlacementsByCategory";
import { PlacementsByLocation } from "../components/operations/placements/overview/PlacementsByLocation";
import { PlacementsFunnel } from "../components/operations/placements/overview/PlacementsFunnel";
import { PlacementsJoiningStatusDonut } from "../components/operations/placements/overview/PlacementsJoiningStatusDonut";
import { PlacementsKeyInsights } from "../components/operations/placements/overview/PlacementsKeyInsights";
import { PlacementsOverviewHeader } from "../components/operations/placements/overview/PlacementsOverviewHeader";
import { PlacementsOverviewKpiStrip } from "../components/operations/placements/overview/PlacementsOverviewKpiStrip";
import { PlacementsQuickActions } from "../components/operations/placements/overview/PlacementsQuickActions";
import { PlacementsTimeToJoin } from "../components/operations/placements/overview/PlacementsTimeToJoin";
import { PlacementsTrendChart } from "../components/operations/placements/overview/PlacementsTrendChart";
import { PlacementsPageSkeleton } from "../components/operations/placements/PlacementsPageSkeleton";
import { PlacementsTableSection } from "../components/operations/placements/PlacementsTableSection";
import {
  useExportOperationsPlacements,
  useOperationsPlacementsAnalytics,
  useOperationsPlacementsList,
} from "../hooks/use-operations-placements";
import type {
  OperationsPlacementsAnalyticsParams,
  OperationsPlacementsExportParams,
  OperationsPlacementsListParams,
  OperationsPlacementsTableTab,
  PlacementJoiningStatusFilter,
  PlacementsAnalyticsPreset,
} from "../types/operations-placements";
import { PLACEMENTS_ANALYTICS_PRESETS } from "../types/operations-placements";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_TAB_COUNTS = {
  all: 0,
  joined: 0,
  joiningPending: 0,
  didNotJoin: 0,
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
): PlacementsAnalyticsPreset {
  return PLACEMENTS_ANALYTICS_PRESETS.includes(
    value as PlacementsAnalyticsPreset,
  )
    ? (value as PlacementsAnalyticsPreset)
    : "last_30_days";
}

function parseTableTab(value: string | null): OperationsPlacementsTableTab {
  if (
    value === "joined" ||
    value === "joiningPending" ||
    value === "didNotJoin" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

function tabToStatus(
  tab: OperationsPlacementsTableTab,
): PlacementJoiningStatusFilter {
  switch (tab) {
    case "joined":
      return "joined";
    case "joiningPending":
      return "joining_pending";
    case "didNotJoin":
      return "did_not_join";
    case "all":
    default:
      return "all";
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

export function OperationsPlacementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(
    () => searchParams.get("search")?.trim() ?? "",
  );
  const [activeTab, setActiveTab] = useState<OperationsPlacementsTableTab>(() =>
    parseTableTab(searchParams.get("tab")),
  );
  const [analyticsFilters, setAnalyticsFilters] =
    useState<OperationsPlacementsAnalyticsParams>({
      preset: parseAnalyticsPreset(searchParams.get("preset")),
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    });

  useEffect(() => {
    setActiveTab(parseTableTab(searchParams.get("tab")));
  }, [searchParams]);

  const listQueryParams = useMemo<OperationsPlacementsListParams>(
    () => ({
      page,
      limit,
      search: search.trim(),
      status: tabToStatus(activeTab),
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
    [page, limit, search, activeTab, analyticsFilters],
  );

  const exportParams = useMemo<OperationsPlacementsExportParams>(
    () => ({
      search: search.trim(),
      status: tabToStatus(activeTab),
      preset: analyticsFilters.preset,
      dateFrom:
        analyticsFilters.preset === "custom"
          ? analyticsFilters.dateFrom
          : undefined,
      dateTo:
        analyticsFilters.preset === "custom"
          ? analyticsFilters.dateTo
          : undefined,
      format: "xlsx",
    }),
    [search, activeTab, analyticsFilters],
  );

  const analyticsQuery = useOperationsPlacementsAnalytics(analyticsFilters);
  const listQuery = useOperationsPlacementsList(listQueryParams);
  const exportMutation = useExportOperationsPlacements();

  const analytics = analyticsQuery.data;
  const listData = listQuery.data;

  const syncAnalyticsParams = (next: OperationsPlacementsAnalyticsParams) => {
    setAnalyticsFilters(next);
    const params = new URLSearchParams(searchParams);
    if (next.preset === "last_30_days") {
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

  const handlePresetChange = (preset: PlacementsAnalyticsPreset) => {
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

  const handleTabChange = (tab: OperationsPlacementsTableTab) => {
    setActiveTab(tab);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (tab === "all") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next, { replace: true });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleExport = () => {
    void exportMutation.mutateAsync(exportParams).catch(() => {
      // surfaced via mutation error state
    });
  };

  const isInitialLoading =
    (analyticsQuery.isLoading && !analytics) ||
    (listQuery.isLoading && !listData);

  const listErrorMessage = listQuery.error
    ? queryErrorMessage(
        listQuery.error,
        "Failed to load placements. Please try again.",
      )
    : undefined;

  const analyticsErrorMessage = analyticsQuery.error
    ? queryErrorMessage(
        analyticsQuery.error,
        "Failed to load placement analytics. Please try again.",
      )
    : undefined;

  return (
    <OperationsLayout
      title="Placements Overview"
      subtitle="Track offers, joining outcomes, and placement performance."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
        {isInitialLoading ? (
          <PlacementsPageSkeleton />
        ) : (
          <>
            <PlacementsOverviewHeader
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
              <PlacementsOverviewKpiStrip kpis={analytics.kpis} />
            ) : null}

            {analytics ? (
              <div className="grid grid-cols-1 gap-3 max-sm:gap-2 md:grid-cols-2 xl:grid-cols-3">
                <PlacementsTrendChart
                  data={analytics.trend}
                  rangeLabel={analytics.range.label}
                />
                <PlacementsFunnel stages={analytics.funnel} />
                <PlacementsByCategory items={analytics.byCategory} />
                <PlacementsByLocation
                  items={analytics.byLocation.states}
                  isLoading={analyticsQuery.isFetching && !analytics}
                  isError={analyticsQuery.isError}
                  onRetry={() => void analyticsQuery.refetch()}
                />
                <PlacementsJoiningStatusDonut
                  total={analytics.joiningStatus.total}
                  segments={analytics.joiningStatus.segments}
                />
                <PlacementsTimeToJoin
                  avgDays={analytics.timeToJoin.avgDays}
                  trendPercent={analytics.timeToJoin.trendPercent}
                  series={analytics.timeToJoin.series}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 max-sm:gap-2 xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:items-start xl:gap-3.5">
              <div className="min-w-0">
                {analytics ? (
                  <PlacementsKeyInsights insights={analytics.insights} />
                ) : null}
              </div>
              <aside className="flex min-w-0 flex-col gap-3 max-sm:gap-2">
                <PlacementsQuickActions
                  onExport={handleExport}
                  isExporting={exportMutation.isPending}
                />
                <PlacementsAskAsliCard />
              </aside>
            </div>

            <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow xl:rounded-lg">
              <PlacementsTableSection
                items={listData?.items ?? []}
                totalItems={listData?.pagination.total ?? 0}
                tabCounts={analytics?.tabs ?? EMPTY_TAB_COUNTS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                search={search}
                onSearchChange={handleSearchChange}
                isLoading={listQuery.isFetching && !listData}
                isError={listQuery.isError}
                errorMessage={listErrorMessage}
                onRetry={() => void listQuery.refetch()}
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
    </OperationsLayout>
  );
}
