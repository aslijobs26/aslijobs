import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../hooks/use-operations-theme-colors";
import type { OperationsAnalyticsWebsiteTraffic } from "../../../types/operations-analytics";
import { cn } from "../../../utils/cn";
import { OperationsCard } from "../../ui/OperationsCard";

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

type TrafficStatTone = "indigo" | "violet" | "orange" | "emerald" | "sky";

const TRAFFIC_STAT_TONES: Record<TrafficStatTone, string> = {
  indigo:
    "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-500/25 dark:from-indigo-500/10 dark:to-surface",
  violet:
    "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white dark:border-violet-500/25 dark:from-violet-500/10 dark:to-surface",
  orange:
    "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white dark:border-orange-500/25 dark:from-orange-500/10 dark:to-surface",
  emerald:
    "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-500/25 dark:from-emerald-500/10 dark:to-surface",
  sky: "border-sky-200/80 bg-gradient-to-br from-sky-50 to-white dark:border-sky-500/25 dark:from-sky-500/10 dark:to-surface",
};

interface WebsiteTrafficPanelProps {
  traffic: OperationsAnalyticsWebsiteTraffic;
  rangeLabel: string;
}

export function WebsiteTrafficPanel({
  traffic,
  rangeLabel,
}: WebsiteTrafficPanelProps) {
  const colors = useOperationsThemeColors();
  const hasDaily = traffic.daily.some(
    (row) => row.pageViews > 0 || row.uniqueVisitors > 0,
  );
  const hasAny =
    traffic.pageViews > 0 ||
    traffic.uniqueVisitors > 0 ||
    traffic.sessions > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <OperationsCard
        title="Website traffic"
        subtitle={`${rangeLabel} · page views from privacy-safe analytics events (IST)`}
        className="min-w-0"
        bodyClassName="p-3 sm:p-3.5"
      >
        {!hasAny ? (
          <div className="flex min-h-40 flex-col items-center justify-center gap-1 px-4 text-center">
            <p className="text-sm text-muted">
              No website traffic recorded for this period.
            </p>
            <p className="text-[11px] text-muted">
              {traffic.trackingActive
                ? "Tracking is live — numbers will appear as visitors browse the public site and portals."
                : "Page-view tracking is configured. Deployed beacons send events to /api/v1/analytics/events."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <TrafficStat
                label="Page views"
                value={traffic.pageViews}
                tone="indigo"
              />
              <TrafficStat
                label="Unique visitors"
                value={traffic.uniqueVisitors}
                tone="violet"
              />
              <TrafficStat
                label="Sessions"
                value={traffic.sessions}
                tone="orange"
              />
              <TrafficStat
                label="New visitors"
                value={traffic.newVisitors}
                tone="emerald"
              />
              <TrafficStat
                label="Returning"
                value={traffic.returningVisitors}
                tone="sky"
              />
            </div>

            <div className="mt-4 h-56 min-w-0 sm:h-64">
              {hasDaily ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={traffic.daily}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="analyticsPageViewsFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={colors.primary}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={colors.primary}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#5a6570" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#5a6570" }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 8,
                        borderColor: "#E5E7EB",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      name="Page views"
                      stroke={colors.primary}
                      fill="url(#analyticsPageViewsFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="uniqueVisitors"
                      name="Unique visitors"
                      stroke="#8B5CF6"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-muted">
                  No daily traffic series for this period.
                </p>
              )}
            </div>
          </>
        )}
      </OperationsCard>
    </div>
  );
}

function TrafficStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: TrafficStatTone;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 shadow-sm",
        TRAFFIC_STAT_TONES[tone],
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-foreground sm:text-[18px]">
        {formatCount(value)}
      </p>
    </div>
  );
}
