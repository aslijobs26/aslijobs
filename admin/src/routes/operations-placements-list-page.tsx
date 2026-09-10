import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { Download } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCanKey } from "../components/operations/auth/OperationsCanKey";
import {
  EMPTY_PLACEMENTS_FILTERS,
  PlacementsFiltersBar,
  type PlacementsFiltersState,
} from "../components/operations/placements/PlacementsFiltersBar";
import { PlacementsTableSection } from "../components/operations/placements/PlacementsTableSection";
import { OPERATIONS_ROUTES } from "../constants/operations-routes";
import {
  useExportOperationsPlacements,
  useOperationsPlacementsAnalytics,
  useOperationsPlacementsList,
} from "../hooks/use-operations-placements";
import type {
  OperationsPlacementsExportParams,
  OperationsPlacementsFilterOptions,
  OperationsPlacementsListParams,
  OperationsPlacementsTableTab,
  PlacementJoiningStatusFilter,
  PlacementsAnalyticsPreset,
} from "../types/operations-placements";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_FILTER_OPTIONS: OperationsPlacementsFilterOptions = {
  statuses: [],
  categories: [],
  states: [],
  cities: [],
};

const EMPTY_TAB_COUNTS = {
  all: 0,
  joined: 0,
  joiningPending: 0,
  didNotJoin: 0,
};

function statusToTab(
  status: PlacementJoiningStatusFilter | "",
): OperationsPlacementsTableTab {
  switch (status) {
    case "joined":
      return "joined";
    case "joining_pending":
      return "joiningPending";
    case "did_not_join":
      return "didNotJoin";
    default:
      return "all";
  }
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

function parseStatusParam(
  value: string | null,
): PlacementJoiningStatusFilter | "" {
  if (
    value === "joined" ||
    value === "joining_pending" ||
    value === "did_not_join" ||
    value === "all"
  ) {
    return value;
  }
  return "";
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

export function OperationsPlacementsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<PlacementsFiltersState>(() => ({
    ...EMPTY_PLACEMENTS_FILTERS,
    search: searchParams.get("search")?.trim() ?? "",
    status: parseStatusParam(searchParams.get("status")),
    category: searchParams.get("category") ?? "",
    state: searchParams.get("state") ?? "",
    city: searchParams.get("city") ?? "",
    preset: (searchParams.get("preset") as PlacementsAnalyticsPreset) || "",
  }));

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: parseStatusParam(searchParams.get("status")) || prev.status,
    }));
  }, [searchParams]);

  const activeTab = statusToTab(filters.status || "all");

  const listQueryParams = useMemo<OperationsPlacementsListParams>(
    () => ({
      page,
      limit,
      search: filters.search.trim(),
      status: (filters.status || "all") as PlacementJoiningStatusFilter,
      category: filters.category,
      state: filters.state,
      city: filters.city,
      // FiltersBar "All Dates" is empty → treat as overall (`all`), not last 30 days.
      preset: (filters.preset || "all") as PlacementsAnalyticsPreset,
      sort: "placedAt",
      order: "desc",
    }),
    [page, limit, filters],
  );

  const exportParams = useMemo<OperationsPlacementsExportParams>(
    () => ({
      search: filters.search.trim(),
      status: (filters.status || "all") as PlacementJoiningStatusFilter,
      category: filters.category,
      state: filters.state,
      city: filters.city,
      preset: (filters.preset || "all") as PlacementsAnalyticsPreset,
      format: "xlsx",
    }),
    [filters],
  );

  const listQuery = useOperationsPlacementsList(listQueryParams);
  const analyticsQuery = useOperationsPlacementsAnalytics({
    preset: (filters.preset || "all") as PlacementsAnalyticsPreset,
  });
  const exportMutation = useExportOperationsPlacements();

  const filterOptions = listQuery.data?.filterOptions ?? EMPTY_FILTER_OPTIONS;
  const listData = listQuery.data;

  const syncUrl = (nextFilters: PlacementsFiltersState) => {
    const params = new URLSearchParams();
    if (nextFilters.search.trim()) {
      params.set("search", nextFilters.search.trim());
    }
    if (nextFilters.status && nextFilters.status !== "all") {
      params.set("status", nextFilters.status);
    }
    if (nextFilters.category) params.set("category", nextFilters.category);
    if (nextFilters.state) params.set("state", nextFilters.state);
    if (nextFilters.city) params.set("city", nextFilters.city);
    if (nextFilters.preset) params.set("preset", nextFilters.preset);
    setSearchParams(params, { replace: true });
  };

  const handleFiltersChange = (next: Partial<PlacementsFiltersState>) => {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      syncUrl(merged);
      return merged;
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_PLACEMENTS_FILTERS);
    setSearchParams({}, { replace: true });
    setPage(1);
  };

  const handleTabChange = (tab: OperationsPlacementsTableTab) => {
    handleFiltersChange({ status: tabToStatus(tab) });
  };

  const handleExport = () => {
    void exportMutation.mutateAsync(exportParams).catch(() => {
      // surfaced via mutation error state
    });
  };

  const listErrorMessage = listQuery.error
    ? queryErrorMessage(
        listQuery.error,
        "Failed to load placements. Please try again.",
      )
    : undefined;

  const isInitialLoading = listQuery.isLoading && !listData;

  return (
    <OperationsLayout
      title="All Placements"
      subtitle="Search, filter, and export placement records."
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
        <header className="flex min-w-0 flex-col gap-3 max-sm:gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted"
            >
              <Link
                to={OPERATIONS_ROUTES.HOME}
                className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Home
              </Link>
              <span aria-hidden="true">›</span>
              <Link
                to={OPERATIONS_ROUTES.PLACEMENTS}
                className="font-medium hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Placements
              </Link>
              <span aria-hidden="true">›</span>
              <span className="font-semibold text-foreground">List</span>
            </nav>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground max-sm:text-base">
              All Placements
            </h1>
            <p className="mt-0.5 text-xs text-muted">
              Full placement list with filters and export.
            </p>
          </div>

          <OperationsCanKey permissionKey="placements.list.export">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex h-8 min-h-8 items-center justify-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-hero-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            >
              <Download className="size-3.5" aria-hidden="true" />
              {exportMutation.isPending ? "Exporting…" : "Export"}
            </button>
          </OperationsCanKey>
        </header>

        {isInitialLoading ? (
          <div
            className="h-96 animate-pulse rounded-xl border border-border-subtle bg-surface"
            aria-busy="true"
            aria-label="Loading placements list"
          />
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm ops-brand-border-glow">
            <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4">
              <PlacementsFiltersBar
                filters={filters}
                filterOptions={filterOptions}
                onChange={handleFiltersChange}
                onClear={handleClearFilters}
                showStatus={false}
              />
            </div>

            <PlacementsTableSection
              items={listData?.items ?? []}
              totalItems={listData?.pagination.total ?? 0}
              tabCounts={analyticsQuery.data?.tabs ?? EMPTY_TAB_COUNTS}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              search={filters.search}
              onSearchChange={(search) => handleFiltersChange({ search })}
              isLoading={listQuery.isFetching && !listData}
              isError={listQuery.isError}
              errorMessage={listErrorMessage}
              onRetry={() => void listQuery.refetch()}
              showViewAll={false}
              hideInlineSearch
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
        )}

        {exportMutation.isError ? (
          <p className="text-xs text-danger" role="alert">
            {queryErrorMessage(
              exportMutation.error,
              "Export failed. Please try again.",
            )}
          </p>
        ) : null}
      </div>
    </OperationsLayout>
  );
}
