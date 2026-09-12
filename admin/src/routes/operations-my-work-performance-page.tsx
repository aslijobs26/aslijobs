import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { MyWorkPerformanceByTypePanel } from "../components/operations/my-work/performance/MyWorkPerformanceByTypePanel";
import { MyWorkPerformanceHeader } from "../components/operations/my-work/performance/MyWorkPerformanceHeader";
import { PERFORMANCE_METRIC_ICON_PRESETS } from "../components/operations/my-work/performance/performance-metric-icons";
import { MyWorkPerformanceKpiGrid } from "../components/operations/my-work/performance/MyWorkPerformanceKpiGrid";
import { MyWorkPerformanceTrendChart } from "../components/operations/my-work/performance/MyWorkPerformanceTrendChart";
import {
  formatPerformanceMetric,
  percentChange,
  sumTrendHalf,
  type PerformanceMetricCardModel,
} from "../components/operations/my-work/performance/performance-format";
import {
  useExportOperationsWork,
  useOperationsWorkPerformance,
} from "../hooks/use-operations-work";
import type { OperationsWorkPerformanceResult } from "../types/operations-work";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

function detailError(error: unknown): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable.";
  }
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Failed to load performance metrics.";
}

function rangePresets() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start7 = new Date(now);
  start7.setDate(start7.getDate() - 6);
  start7.setHours(0, 0, 0, 0);
  const start30 = new Date(now);
  start30.setDate(start30.getDate() - 29);
  start30.setHours(0, 0, 0, 0);
  return {
    "7d": { from: start7.toISOString(), to: end.toISOString(), label: "Last 7 days" },
    "30d": {
      from: start30.toISOString(),
      to: end.toISOString(),
      label: "Last 30 days",
    },
  } as const;
}

function buildMetrics(
  data: OperationsWorkPerformanceResult,
): PerformanceMetricCardModel[] {
  const firstHalf = sumTrendHalf(data.completionTrend, "first");
  const secondHalf = sumTrendHalf(data.completionTrend, "second");
  const completedWindowTrend =
    firstHalf === 0 && secondHalf === 0
      ? null
      : percentChange(secondHalf, firstHalf);

  const noneTrend = {
    direction: "none" as const,
    label: "No data",
    caption: "",
  };

  return [
    {
      id: "open",
      label: "Open assigned",
      value: formatPerformanceMetric(data.assignedOpen),
      ...PERFORMANCE_METRIC_ICON_PRESETS.open,
      trend: noneTrend,
    },
    {
      id: "completed-total",
      label: "Completed (total)",
      value: formatPerformanceMetric(data.completedTotal),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completedTotal,
      trend: noneTrend,
    },
    {
      id: "completed-window",
      label: "Completed (range)",
      value: formatPerformanceMetric(data.completedLast7Days),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completed7d,
      trend:
        completedWindowTrend == null
          ? noneTrend
          : {
              direction: completedWindowTrend.direction,
              label: `${completedWindowTrend.direction === "up" ? "↑" : completedWindowTrend.direction === "down" ? "↓" : "→"} ${completedWindowTrend.percent}%`,
              caption: "2nd half vs 1st half of range",
            },
    },
    {
      id: "completion-rate",
      label: "Completion rate",
      value: formatPerformanceMetric(data.completionRatePercent, {
        suffix: "%",
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completionRate,
      trend: noneTrend,
    },
    {
      id: "overdue",
      label: "Overdue",
      value: formatPerformanceMetric(data.overdue),
      ...PERFORMANCE_METRIC_ICON_PRESETS.overdue,
      trend: noneTrend,
    },
    {
      id: "sla",
      label: "SLA compliance",
      value: formatPerformanceMetric(data.slaCompliancePercent, {
        suffix: "%",
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.sla,
      trend: noneTrend,
    },
    {
      id: "resolution",
      label: "Avg resolution (h)",
      value: formatPerformanceMetric(data.averageResolutionHours, {
        decimals: 1,
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.resolution,
      trend: noneTrend,
    },
    {
      id: "response",
      label: "Avg response (h)",
      value: formatPerformanceMetric(data.averageResponseHours, {
        decimals: 1,
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.response,
      trend: noneTrend,
    },
  ];
}

export function OperationsMyWorkPerformancePage() {
  const presets = useMemo(() => rangePresets(), []);
  const [rangeKey, setRangeKey] = useState<"7d" | "30d">("7d");
  const range = presets[rangeKey];
  const query = useOperationsWorkPerformance({
    from: range.from,
    to: range.to,
  });
  const exportMutation = useExportOperationsWork();
  const data = query.data;

  const metrics = useMemo(() => (data ? buildMetrics(data) : []), [data]);
  const errorMessage = query.error ? detailError(query.error) : null;

  return (
    <OperationsLayout
      title="My Performance"
      subtitle="Your work metrics"
      headerVariant="command"
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[90rem] flex-col gap-3.5">
        <MyWorkPerformanceHeader
          trend={data?.completionTrend ?? []}
          rangeLabel={range.label}
          downloadLabel="Download completed work"
          isDownloading={exportMutation.isPending}
          onRangeChange={setRangeKey}
          rangeKey={rangeKey}
          onDownload={() => {
            exportMutation.mutate({
              tab: "completed",
              type: "",
              priority: "",
              due: "all",
              search: "",
              format: "xlsx",
            });
          }}
        />

        {query.isPending && !data ? (
          <div className="grid animate-pulse grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-28 rounded-xl bg-border-subtle/70"
              />
            ))}
          </div>
        ) : errorMessage && !data ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
            {errorMessage}
          </div>
        ) : data ? (
          <>
            <MyWorkPerformanceKpiGrid metrics={metrics} />
            <MyWorkPerformanceByTypePanel
              byType={data.byType}
              completedTotal={data.completedTotal}
            />
            <MyWorkPerformanceTrendChart
              trend={data.completionTrend}
              generatedAt={data.generatedAt}
            />
          </>
        ) : null}
      </div>
    </OperationsLayout>
  );
}
