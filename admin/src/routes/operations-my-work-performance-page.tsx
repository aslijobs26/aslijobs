import { useMemo } from "react";
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
  type TrendDirection,
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

function trendLabel(
  direction: Exclude<TrendDirection, "none">,
  percent: number,
): string {
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  return `${arrow} ${percent}%`;
}

function buildMetrics(
  data: OperationsWorkPerformanceResult,
): PerformanceMetricCardModel[] {
  const firstHalf = sumTrendHalf(data.completionTrend, "first");
  const secondHalf = sumTrendHalf(data.completionTrend, "second");
  const completed7dTrend = percentChange(secondHalf, firstHalf);
  const completedTotalPrior = Math.max(
    0,
    data.completedTotal - data.completedLast7Days,
  );
  const completedTotalTrend = percentChange(
    data.completedLast7Days,
    completedTotalPrior,
  );
  const completionRateTrend =
    data.completionRatePercent == null
      ? null
      : percentChange(data.completionRatePercent, 0);

  return [
    {
      id: "open",
      label: "Open assigned",
      value: formatPerformanceMetric(data.assignedOpen),
      ...PERFORMANCE_METRIC_ICON_PRESETS.open,
      trend: {
        direction: data.assignedOpen === 0 ? "down" : "flat",
        label: trendLabel(data.assignedOpen === 0 ? "down" : "flat", 0),
        caption: "vs last 7 days",
      },
    },
    {
      id: "completed-total",
      label: "Completed (total)",
      value: formatPerformanceMetric(data.completedTotal),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completedTotal,
      trend: {
        direction: completedTotalTrend.direction,
        label: trendLabel(
          completedTotalTrend.direction,
          completedTotalTrend.percent,
        ),
        caption: "vs last 7 days",
      },
    },
    {
      id: "completed-7d",
      label: "Completed (7 days)",
      value: formatPerformanceMetric(data.completedLast7Days),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completed7d,
      trend: {
        direction: completed7dTrend.direction,
        label: trendLabel(
          completed7dTrend.direction,
          completed7dTrend.percent,
        ),
        caption: "vs last 7 days",
      },
    },
    {
      id: "completion-rate",
      label: "Completion rate",
      value: formatPerformanceMetric(data.completionRatePercent, {
        suffix: "%",
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.completionRate,
      trend: {
        direction:
          data.completionRatePercent == null
            ? "none"
            : (completionRateTrend?.direction ?? "flat"),
        label:
          data.completionRatePercent == null || completionRateTrend == null
            ? "No data"
            : trendLabel(
                completionRateTrend.direction,
                completionRateTrend.percent,
              ),
        caption:
          data.completionRatePercent == null ? "" : "vs last 7 days",
      },
    },
    {
      id: "overdue",
      label: "Overdue",
      value: formatPerformanceMetric(data.overdue),
      ...PERFORMANCE_METRIC_ICON_PRESETS.overdue,
      trend: {
        direction: data.overdue === 0 ? "down" : "up",
        label: trendLabel(data.overdue === 0 ? "down" : "up", 0),
        caption: "vs last 7 days",
      },
    },
    {
      id: "sla",
      label: "SLA compliance",
      value: formatPerformanceMetric(data.slaCompliancePercent, {
        suffix: "%",
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.sla,
      trend: {
        direction: data.slaCompliancePercent == null ? "none" : "flat",
        label:
          data.slaCompliancePercent == null
            ? "No data"
            : trendLabel("flat", 0),
        caption:
          data.slaCompliancePercent == null ? "" : "vs last 7 days",
      },
    },
    {
      id: "resolution",
      label: "Avg resolution (h)",
      value: formatPerformanceMetric(data.averageResolutionHours, {
        decimals: 1,
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.resolution,
      trend: {
        direction: "down",
        label: trendLabel("down", 0),
        caption: "vs last 7 days",
      },
    },
    {
      id: "response",
      label: "Avg response (h)",
      value: formatPerformanceMetric(data.averageResponseHours, {
        decimals: 1,
      }),
      ...PERFORMANCE_METRIC_ICON_PRESETS.response,
      trend: {
        direction: "down",
        label: trendLabel("down", 0),
        caption: "vs last 7 days",
      },
    },
  ];
}

export function OperationsMyWorkPerformancePage() {
  const query = useOperationsWorkPerformance();
  const exportMutation = useExportOperationsWork();
  const data = query.data;

  const metrics = useMemo(
    () => (data ? buildMetrics(data) : []),
    [data],
  );

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
          isDownloading={exportMutation.isPending}
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
