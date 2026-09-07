import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type { OperationsJobsAnalyticsResult } from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import { OperationsCard } from "../../../ui/OperationsCard";
import { JOBS_ANALYTICS_STATUS_COLORS } from "../analytics/jobs-analytics-theme";
import { JobsByLocation } from "./JobsByLocation";

const EMPLOYMENT_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#8B5CF6", "#0EA5E9"];

interface JobsOverviewAnalyticsProps {
  data: OperationsJobsAnalyticsResult;
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="flex min-h-28 items-center justify-center text-center text-xs text-muted xl:min-h-24">
      {message}
    </p>
  );
}

/** ~5 bar rows visible; overflow scrolls (matches Jobseekers Top Categories). */
const BARS_SCROLL_CLASS =
  "max-h-[calc((2.5rem*5)+(0.625rem*4))] overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[calc((2rem*5)+(0.375rem*4))]";

function HorizontalBars({
  items,
  emptyMessage,
}: {
  items: Array<{ key: string; label: string; count: number }>;
  emptyMessage: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }
  return (
    <ul
      className={cn(
        "flex min-h-0 flex-col gap-2.5 xl:gap-1.5",
        BARS_SCROLL_CLASS,
      )}
    >
      {items.slice(0, 12).map((item) => (
        <li key={item.key} className="min-w-0 shrink-0">
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] xl:mb-0.5 xl:text-[10px]">
            <span className="truncate font-medium text-foreground">
              {item.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {item.count.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#EEF2F6] dark:bg-hero-bg xl:h-1.5">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.max(8, Math.round((item.count / max) * 100))}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function JobsOverviewAnalytics({ data }: JobsOverviewAnalyticsProps) {
  const colors = useOperationsThemeColors();
  const postingsTrend =
    data.postingsTrend?.length > 0
      ? data.postingsTrend
      : (data.jobsCreated ?? []).map((point) => ({
          date: point.date,
          label: point.label,
          jobsPosted: point.count,
          jobsApproved: 0,
        }));
  const hasTrend = postingsTrend.some(
    (point) => point.jobsPosted > 0 || point.jobsApproved > 0,
  );
  const statusItems = data.status ?? [];
  const statusTotal = statusItems.reduce((sum, item) => sum + item.count, 0);
  const employmentItems = data.jobsByEmploymentType ?? [];
  const employmentTotal = employmentItems.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const locationData = data.jobsByLocation ?? {
    states: [],
    cities: [],
    topLocations: [],
  };
  const trendPointCount = postingsTrend.length;
  const trendMaxBarSize =
    trendPointCount <= 14 ? 36 : trendPointCount <= 26 ? 26 : 16;
  const trendCategoryGap =
    trendPointCount <= 14 ? "28%" : trendPointCount <= 26 ? "22%" : "18%";

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <OperationsCard
          title="Job Postings Trend"
          subtitle={
            data.range.preset === "all"
              ? "Last 12 months · jobs posted vs approved"
              : "Jobs posted vs approved"
          }
          className="jobs-analytics-card min-w-0"
        >
          {!hasTrend ? (
            <EmptyState message="No posting activity in this period." />
          ) : (
            <div className="h-52 min-w-0 sm:h-56 xl:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={postingsTrend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barGap={3}
                  barCategoryGap={trendCategoryGap}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={colors.borderSubtle}
                    strokeDasharray="4 6"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#5a6570" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={20}
                    height={28}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#5a6570" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      Number(value).toLocaleString("en-IN"),
                      name === "jobsPosted" ? "Jobs Posted" : "Jobs Approved",
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                    formatter={(value) =>
                      value === "jobsPosted" ? "Jobs Posted" : "Jobs Approved"
                    }
                  />
                  <Bar
                    dataKey="jobsPosted"
                    fill={colors.chartAccent}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={trendMaxBarSize}
                  />
                  <Bar
                    dataKey="jobsApproved"
                    fill={colors.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={trendMaxBarSize}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </OperationsCard>

        <OperationsCard
          title="Jobs by Status"
          subtitle="Current job lifecycle distribution"
          className="jobs-analytics-card min-w-0"
        >
          {statusTotal === 0 ? (
            <EmptyState message="No status data available." />
          ) : (
            <div className="flex min-h-28 min-w-0 flex-col gap-4 sm:flex-row sm:items-center xl:min-h-24 xl:gap-2.5">
              <div className="relative mx-auto size-36 shrink-0 xl:size-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusItems}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={1.5}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {statusItems.map((item) => (
                        <Cell
                          key={item.key}
                          fill={
                            JOBS_ANALYTICS_STATUS_COLORS[item.key] ?? "#94a3b8"
                          }
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold leading-none text-foreground xl:text-base">
                    {statusTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="mt-1 text-[10px] font-medium text-muted xl:mt-0.5 xl:text-[9px]">
                    Total
                  </span>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5 xl:space-y-1">
                {statusItems.map((item) => {
                  const percent =
                    item.percent ??
                    (statusTotal > 0
                      ? Math.round((item.count / statusTotal) * 100)
                      : 0);
                  return (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-2 text-[11px] xl:text-[10px]"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-muted">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              JOBS_ANALYTICS_STATUS_COLORS[item.key] ??
                              "#94a3b8",
                          }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-foreground">
                        <span className="font-semibold">
                          {item.count.toLocaleString("en-IN")}
                        </span>
                        <span className="ml-1 text-muted">{percent}%</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </OperationsCard>

        <OperationsCard
          title="Jobs by Industry"
          subtitle="Top industries by job volume"
          className="jobs-analytics-card min-w-0"
        >
          <HorizontalBars
            items={data.jobsByIndustry ?? []}
            emptyMessage="No industry data available."
          />
        </OperationsCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <JobsByLocation data={locationData} />

        <OperationsCard
          title="Top Job Roles"
          subtitle="Most common job titles"
          className="jobs-analytics-card min-w-0"
        >
          <HorizontalBars
            items={data.topJobRoles ?? []}
            emptyMessage="No job role data available."
          />
        </OperationsCard>

        <OperationsCard
          title="Jobs by Employment Type"
          subtitle="Full-time, part-time, contract"
          className="jobs-analytics-card min-w-0"
        >
          {employmentTotal === 0 ? (
            <EmptyState message="No employment type data available." />
          ) : (
            <div className="flex min-h-28 min-w-0 flex-col gap-4 sm:flex-row sm:items-center xl:min-h-24 xl:gap-2.5">
              <div className="relative mx-auto size-36 shrink-0 xl:size-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={employmentItems}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="100%"
                      paddingAngle={1.5}
                      startAngle={90}
                      endAngle={-270}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {employmentItems.map((item, index) => (
                        <Cell
                          key={item.key}
                          fill={
                            EMPLOYMENT_COLORS[index % EMPLOYMENT_COLORS.length]
                          }
                          stroke="none"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold leading-none text-foreground xl:text-base">
                    {employmentTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="mt-1 text-[10px] font-medium text-muted xl:mt-0.5 xl:text-[9px]">
                    Total
                  </span>
                </div>
              </div>
              <ul className="min-w-0 max-h-[9.5rem] flex-1 space-y-1.5 overflow-y-auto overscroll-contain scrollbar-hidden xl:max-h-[7.5rem] xl:space-y-1">
                {employmentItems.map((item, index) => {
                  const percent =
                    item.percent ??
                    (employmentTotal > 0
                      ? Math.round((item.count / employmentTotal) * 100)
                      : 0);
                  return (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-2 text-[11px] xl:text-[10px]"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-muted">
                        <span
                          className={cn("size-2 shrink-0 rounded-full")}
                          style={{
                            backgroundColor:
                              EMPLOYMENT_COLORS[
                                index % EMPLOYMENT_COLORS.length
                              ],
                          }}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-foreground">
                        <span className="font-semibold">
                          {item.count.toLocaleString("en-IN")}
                        </span>
                        <span className="ml-1 text-muted">{percent}%</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </OperationsCard>
      </div>
    </div>
  );
}
