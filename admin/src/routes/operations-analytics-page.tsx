import { isAxiosError } from "axios";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { canAccessOperationsAnalytics } from "../components/operations/analytics/analytics-access";
import { AnalyticsDrilldownDrawer } from "../components/operations/analytics/AnalyticsDrilldownDrawer";
import { AnalyticsFilterBar } from "../components/operations/analytics/AnalyticsFilterBar";
import { drilldownMetricForKpi } from "../components/operations/analytics/analytics-drilldown";
import type { DrilldownMetric } from "../components/operations/analytics/analytics-drilldown";
import {
  filtersFromSearch,
  writeFiltersToSearch,
  type AnalyticsFilterDraft,
} from "../components/operations/analytics/analytics-filters";
import { AnalyticsInsightsSkeleton } from "../components/operations/analytics/AnalyticsInsightsSkeleton";
import { AnalyticsPageHeader } from "../components/operations/analytics/AnalyticsPageHeader";
import { AnalyticsTabContent } from "../components/operations/analytics/AnalyticsTabContent";
import { AnalyticsTabs } from "../components/operations/analytics/AnalyticsTabs";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsCard } from "../components/ui/OperationsCard";
import {
  downloadOperationsAnalyticsExport,
  useOperationsAnalyticsOverview,
} from "../hooks/use-operations-analytics";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import { INDIAN_STATES_AND_UTS } from "../services/india-location.service";
import {
  ANALYTICS_DATE_PRESETS,
  ANALYTICS_TABS,
  type AnalyticsDatePreset,
  type AnalyticsTabId,
} from "../types/operations-analytics";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function isAnalyticsPreset(value: string | null): value is AnalyticsDatePreset {
  return (
    value != null &&
    (ANALYTICS_DATE_PRESETS as readonly string[]).includes(value)
  );
}

function isAnalyticsTab(value: string | null): value is AnalyticsTabId {
  return value != null && (ANALYTICS_TABS as readonly string[]).includes(value);
}

function overviewErrorMessage(error: unknown): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable. Please wait a moment and retry.";
  }
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string } | undefined;
    if (payload?.message?.trim()) {
      return payload.message.trim();
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unable to load analytics. Try again.";
}

export function OperationsAnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can, canKey, isSuperAdmin } = useOperationsPermissions();

  const activeTab: AnalyticsTabId = isAnalyticsTab(searchParams.get("tab"))
    ? (searchParams.get("tab") as AnalyticsTabId)
    : "insights";

  const appliedFilters = useMemo(
    () => filtersFromSearch(searchParams),
    [searchParams],
  );
  const preset = isAnalyticsPreset(appliedFilters.preset)
    ? appliedFilters.preset
    : "last_6_months";

  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [report, setReport] = useState("summary");
  const [actionError, setActionError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<DrilldownMetric | null>(null);

  const params = useMemo(
    () => ({
      ...appliedFilters,
      preset,
      format: exportFormat,
      report,
    }),
    [appliedFilters, exportFormat, preset, report],
  );

  const canView = canAccessOperationsAnalytics({
    isSuperAdmin,
    reportsRead: can("reports", "read"),
    reportsView: canKey("reports.view"),
  });
  const overviewQuery = useOperationsAnalyticsOverview(params, { enabled: canView });
  const data = overviewQuery.data;

  const canExport = canView;

  const stateOptions = useMemo(
    () => [
      { value: "", label: "All India" },
      ...INDIAN_STATES_AND_UTS.map((name) => ({ value: name, label: name })),
    ],
    [],
  );

  const updateParams = (next: { tab?: AnalyticsTabId }) => {
    const updated = new URLSearchParams(searchParams);
    if (next.tab) {
      if (next.tab === "insights") updated.delete("tab");
      else updated.set("tab", next.tab);
    }
    setSearchParams(updated, { replace: true });
  };

  const applyFilters = (draft: AnalyticsFilterDraft) => {
    const updated = writeFiltersToSearch(searchParams, {
      ...draft,
      preset: isAnalyticsPreset(draft.preset) ? draft.preset : "last_6_months",
    });
    setSearchParams(updated, { replace: true });
  };

  const handleExport = async () => {
    if (!canExport) return;
    setActionError(null);
    setExporting(true);
    try {
      await downloadOperationsAnalyticsExport(params);
    } catch (error) {
      setActionError(overviewErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const errorMessage = overviewQuery.error
    ? overviewErrorMessage(overviewQuery.error)
    : null;

  return (
    <OperationsLayout
      title="Analytics"
      subtitle="From data to decisions — insights for a stronger, more inclusive workforce."
    >
      <div className="flex min-w-0 flex-col gap-3 max-sm:gap-2.5">
        <AnalyticsPageHeader
          preset={preset}
          state={appliedFilters.state}
          stateOptions={stateOptions}
          onPresetChange={() => undefined}
          onStateChange={() => undefined}
          onExport={() => void handleExport()}
          isExporting={exporting}
          canExport={canExport}
          hideControls
        />

        <AnalyticsFilterBar
          applied={{ ...appliedFilters, preset }}
          stateOptions={stateOptions}
          onApply={applyFilters}
          isRefreshing={overviewQuery.isFetching}
        />

        {actionError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {actionError}
          </p>
        ) : null}

        <AnalyticsTabs
          activeTab={activeTab}
          onChange={(tab) => updateParams({ tab })}
        />

        {!canView ? (
          <OperationsCard className="min-w-0" bodyClassName="p-6">
            <p className="text-center text-sm text-muted">
              Analytics requires reports access. Job view does not include website traffic or employer analytics.
            </p>
          </OperationsCard>
        ) : overviewQuery.isLoading && !data ? (
          <AnalyticsInsightsSkeleton />
        ) : errorMessage && !data ? (
          <OperationsCard className="min-w-0" bodyClassName="p-6">
            <p className="text-center text-sm text-muted">{errorMessage}</p>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => void overviewQuery.refetch()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Retry
              </button>
            </div>
          </OperationsCard>
        ) : data ? (
          <AnalyticsTabContent
            tab={activeTab}
            data={data}
            canExport={canExport}
            onExport={() => void handleExport()}
            isExporting={exporting}
            onOpenKpi={(kpiId) => {
              const metric = drilldownMetricForKpi(kpiId);
              if (metric) setDrilldown(metric);
            }}
          />
        ) : (
          <OperationsCard className="min-w-0" bodyClassName="p-6">
            <p className="text-center text-sm text-muted">
              No analytics data available for this period.
            </p>
          </OperationsCard>
        )}
        {drilldown ? (
          <AnalyticsDrilldownDrawer
            metric={drilldown}
            params={params}
            onClose={() => setDrilldown(null)}
          />
        ) : null}
      </div>
    </OperationsLayout>
  );
}
