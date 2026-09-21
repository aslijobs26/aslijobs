import { isAxiosError } from "axios";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  const preset: AnalyticsDatePreset = isAnalyticsPreset(
    searchParams.get("preset"),
  )
    ? (searchParams.get("preset") as AnalyticsDatePreset)
    : "last_6_months";

  const state = searchParams.get("state") ?? "";

  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      preset,
      state,
    }),
    [preset, state],
  );

  const overviewQuery = useOperationsAnalyticsOverview(params);
  const data = overviewQuery.data;

  const canExport =
    isSuperAdmin ||
    canKey("jobs.list.export") ||
    can("jobs", "export") ||
    can("reports", "read") ||
    canKey("reports.view");

  const stateOptions = useMemo(
    () => [
      { value: "", label: "All India" },
      ...INDIAN_STATES_AND_UTS.map((name) => ({ value: name, label: name })),
    ],
    [],
  );

  const updateParams = (next: {
    tab?: AnalyticsTabId;
    preset?: AnalyticsDatePreset;
    state?: string;
  }) => {
    const updated = new URLSearchParams(searchParams);
    if (next.tab) {
      if (next.tab === "insights") updated.delete("tab");
      else updated.set("tab", next.tab);
    }
    if (next.preset) {
      if (next.preset === "last_6_months") updated.delete("preset");
      else updated.set("preset", next.preset);
    }
    if (next.state !== undefined) {
      if (!next.state) updated.delete("state");
      else updated.set("state", next.state);
    }
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
          state={state}
          stateOptions={stateOptions}
          onPresetChange={(next) => updateParams({ preset: next })}
          onStateChange={(next) => updateParams({ state: next })}
          onExport={() => void handleExport()}
          isExporting={exporting}
          canExport={canExport}
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

        {overviewQuery.isLoading && !data ? (
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
          />
        ) : (
          <OperationsCard className="min-w-0" bodyClassName="p-6">
            <p className="text-center text-sm text-muted">
              No analytics data available for this period.
            </p>
          </OperationsCard>
        )}
      </div>
    </OperationsLayout>
  );
}
