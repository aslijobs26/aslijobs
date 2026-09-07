import { useId, type ReactNode } from "react";
import { Download, Info, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OperationsDatePicker } from "../../../ui/OperationsDatePicker";
import { useOperationsThemeColors } from "../../../../hooks/use-operations-theme-colors";
import type {
  OperationsJobsAnalyticsParams,
  OperationsJobsAnalyticsPreset,
  OperationsJobsAnalyticsResult,
} from "../../../../types/operations-jobs";
import { cn } from "../../../../utils/cn";
import {
  JOBS_ANALYTICS_BAR_COLORS,
  JOBS_ANALYTICS_CARD_CLASS,
  JOBS_ANALYTICS_INSIGHT_CLASS,
  JOBS_ANALYTICS_PAYMENT_COLORS,
  JOBS_ANALYTICS_STATUS_COLORS,
} from "./jobs-analytics-theme";

const PRESETS: { value: OperationsJobsAnalyticsPreset; label: string }[] = [
  { value: "all", label: "Overall" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_3_months", label: "Last 3 Months" },
  { value: "custom", label: "Custom" },
];

interface JobsAnalyticsSectionProps {
  data: OperationsJobsAnalyticsResult;
  filters: OperationsJobsAnalyticsParams;
  onFiltersChange: (next: Partial<OperationsJobsAnalyticsParams>) => void;
  onExport: () => void;
}

function todayIsoDate(): string {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <p className="flex min-h-40 flex-1 items-center justify-center text-center text-xs text-muted">
      {message}
    </p>
  );
}

function AnalyticsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(JOBS_ANALYTICS_CARD_CLASS, className)}>
      <header className="mb-4 flex items-start justify-between gap-2 xl:mb-3">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-muted" title={description}>
          <Info className="size-3.5" aria-hidden="true" />
          <span className="sr-only">{description}</span>
        </span>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function DonutChartCard({
  title,
  description,
  centerValue,
  centerLabel,
  items,
  colors,
  emptyMessage,
}: {
  title: string;
  description: string;
  centerValue: string;
  centerLabel: string;
  items: Array<{ key: string; label: string; count: number }>;
  colors: Record<string, string>;
  emptyMessage: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const chartData = items.map((item) => ({
    ...item,
    fill: colors[item.key] ?? "#94a3b8",
  }));

  return (
    <AnalyticsCard title={title} description={description}>
      {total === 0 ? (
        <ChartEmptyState message={emptyMessage} />
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative mx-auto size-[9.5rem] shrink-0 sm:mx-0 sm:size-40 xl:size-[7.75rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="label"
                  innerRadius="62%"
                  outerRadius="100%"
                  paddingAngle={1.5}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    Number(value).toLocaleString("en-IN"),
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
              <span className="text-xl font-bold leading-none text-foreground">
                {centerValue}
              </span>
              <span className="mt-1 text-[10px] font-medium text-muted">
                {centerLabel}
              </span>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5">
            {items.map((item) => {
              const percent =
                total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colors[item.key] ?? "#94a3b8" }}
                      aria-hidden="true"
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
    </AnalyticsCard>
  );
}

export function JobsAnalyticsSection({
  data,
  filters,
  onFiltersChange,
  onExport,
}: JobsAnalyticsSectionProps) {
  const colors = useOperationsThemeColors();
  const fromPickerId = useId();
  const toPickerId = useId();
  const createdGradientId = useId().replace(/:/g, "");
  const applicationsGradientId = useId().replace(/:/g, "");
  const todayIso = todayIsoDate();
  const createdTotal = data.jobsCreated.reduce((sum, point) => sum + point.count, 0);
  const applicationsTotal = data.applicationSummary.totalApplications;
  const locationMax = Math.max(
    ...data.jobsByLocation.states.map((item) => item.count),
    ...data.jobsByLocation.cities.map((item) => item.count),
    ...data.jobsByLocation.topLocations.map((item) => item.count),
    0,
  );
  const locationItems =
    data.jobsByLocation.states.length > 0
      ? data.jobsByLocation.states
      : data.jobsByLocation.topLocations.length > 0
        ? data.jobsByLocation.topLocations
        : data.jobsByLocation.cities;
  const topMax = Math.max(
    ...data.topPerformingJobs.map((item) => item.count),
    0,
  );
  const axisTick = { fontSize: 10, fill: "#5a6570" };

  const handlePreset = (preset: OperationsJobsAnalyticsPreset) => {
    if (preset === "custom") {
      const iso = todayIsoDate();
      onFiltersChange({
        preset,
        dateFrom: filters.dateFrom || iso,
        dateTo: filters.dateTo || iso,
      });
      return;
    }
    onFiltersChange({ preset, dateFrom: "", dateTo: "" });
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
            Jobs Analytics
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Real job, application, and payment totals for the selected period.
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            className="flex min-w-0 flex-wrap gap-1.5"
            role="group"
            aria-label="Analytics date range"
          >
            {PRESETS.map((preset) => {
              const selected = filters.preset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePreset(preset.value)}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "border-primary-soft bg-primary-light text-primary-soft"
                      : "border-transparent bg-white text-muted shadow-[inset_0_0_0_1px_#e7eef3] hover:text-foreground dark:bg-surface dark:shadow-[inset_0_0_0_1px_var(--color-border-subtle)]",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-[#e7eef3] bg-white px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-border-subtle dark:bg-surface"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {filters.preset === "custom" ? (
        <div className="grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label
              htmlFor={fromPickerId}
              className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted"
            >
              From
            </label>
            <OperationsDatePicker
              id={fromPickerId}
              value={filters.dateFrom}
              placeholder="Start date"
              maxDate={filters.dateTo || todayIso}
              compact
              onChange={(dateFrom) => {
                const dateTo =
                  filters.dateTo && dateFrom && filters.dateTo < dateFrom
                    ? dateFrom
                    : filters.dateTo;
                onFiltersChange({ dateFrom, dateTo });
              }}
            />
          </div>
          <div>
            <label
              htmlFor={toPickerId}
              className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted"
            >
              To
            </label>
            <OperationsDatePicker
              id={toPickerId}
              value={filters.dateTo}
              placeholder="End date"
              minDate={filters.dateFrom || undefined}
              maxDate={todayIso}
              compact
              onChange={(dateTo) => onFiltersChange({ dateTo })}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <DonutChartCard
          title="Jobs Status"
          description="Distribution of all jobs by current status."
          centerValue={data.kpis.totalJobs.toLocaleString("en-IN")}
          centerLabel="Total Jobs"
          items={data.status}
          colors={JOBS_ANALYTICS_STATUS_COLORS}
          emptyMessage="No jobs are available to chart."
        />

        <AnalyticsCard
          title="Jobs Created"
          description="Jobs created over the selected period."
        >
          {createdTotal === 0 ? (
            <ChartEmptyState message="No jobs were created in this period." />
          ) : (
            <div className="h-48 min-w-0 flex-1 sm:h-52 xl:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.jobsCreated} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={createdGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.chartAccent} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={colors.chartAccent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.borderSubtle} strokeDasharray="4 6" />
                  <XAxis
                    dataKey="label"
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString("en-IN")} jobs`,
                      "Created",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={colors.chartAccent}
                    strokeWidth={2.25}
                    fill={`url(#${createdGradientId})`}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Applications Trend"
          description="Applications received over the selected period."
        >
          {applicationsTotal === 0 ? (
            <ChartEmptyState message="No applications were received in this period." />
          ) : (
            <div className="h-40 min-w-0 sm:h-44 xl:h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.applicationsTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={applicationsGradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.chartAccentAlt} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={colors.chartAccentAlt} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.borderSubtle} strokeDasharray="4 6" />
                  <XAxis
                    dataKey="label"
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString("en-IN")} applications`,
                      "Applications",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={colors.chartAccentAlt}
                    strokeWidth={2.25}
                    fill={`url(#${applicationsGradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-[#e7eef3] pt-3 text-[11px] dark:border-border-subtle">
            <div>
              <dt className="text-muted">Total</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {data.applicationSummary.totalApplications.toLocaleString("en-IN")}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Avg / job</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {data.applicationSummary.averageApplicationsPerJob.toLocaleString(
                  "en-IN",
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted">vs previous</dt>
              <dd className="mt-0.5 text-sm font-semibold text-foreground">
                {data.applicationSummary.changePercent === null
                  ? "N/A"
                  : `${data.applicationSummary.changePercent > 0 ? "+" : ""}${data.applicationSummary.changePercent}%`}
              </dd>
            </div>
          </dl>
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DonutChartCard
          title="Payment Overview"
          description="Listing payment status across all jobs."
          centerValue={data.payment
            .reduce((sum, item) => sum + item.count, 0)
            .toLocaleString("en-IN")}
          centerLabel="Listings"
          items={data.payment}
          colors={JOBS_ANALYTICS_PAYMENT_COLORS}
          emptyMessage="No payment statuses are available to chart."
        />

        <AnalyticsCard
          title="Jobs by Location"
          description="Top job locations from current listings."
        >
          {locationItems.length === 0 ? (
            <ChartEmptyState message="No job locations are available to chart." />
          ) : (
            <ul className="flex flex-1 flex-col justify-center gap-4">
              {locationItems.map((item) => {
                const width =
                  locationMax > 0
                    ? Math.max(10, Math.round((item.count / locationMax) * 80))
                    : 0;
                return (
                  <li
                    key={item.key}
                    className="grid grid-cols-[7.25rem_minmax(0,1fr)_1.5rem] items-center gap-3"
                  >
                    <span className="truncate text-[12px] text-[#4b5563] dark:text-muted">
                      {item.label}
                    </span>
                    <div className="h-3 w-full rounded-full bg-[#e8eef3] dark:bg-border-subtle">
                      <div
                        className="h-3 rounded-full bg-[linear-gradient(90deg,#6ea8ff_0%,#2f6fed_100%)]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-right text-[12px] tabular-nums text-[#374151] dark:text-foreground">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard
          title="Jobs by Employment Type"
          description="Employment types present in current job data."
        >
          {data.jobsByEmploymentType.length === 0 ? (
            <ChartEmptyState message="No employment types are available to chart." />
          ) : (
            <div className="h-52 min-w-0 flex-1 xl:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.jobsByEmploymentType} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.borderSubtle} strokeDasharray="4 6" />
                  <XAxis
                    dataKey="label"
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString("en-IN"),
                      "Jobs",
                    ]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    {data.jobsByEmploymentType.map((item, index) => (
                      <Cell
                        key={item.key}
                        fill={
                          JOBS_ANALYTICS_BAR_COLORS[
                            index % JOBS_ANALYTICS_BAR_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Top Performing Jobs"
          description="Jobs ranked by actual application count."
        >
          {data.topPerformingJobs.length === 0 ? (
            <ChartEmptyState message="No jobs have received applications yet." />
          ) : (
            <ul className="flex flex-1 flex-col justify-center gap-4">
              {data.topPerformingJobs.map((item) => {
                const width =
                  topMax > 0
                    ? Math.max(10, Math.round((item.count / topMax) * 80))
                    : 0;
                return (
                  <li
                    key={item.key}
                    className="grid grid-cols-[7.25rem_minmax(0,1fr)_1.5rem] items-center gap-3"
                  >
                    <span className="truncate text-[12px] text-[#4b5563] dark:text-muted">
                      {item.label}
                    </span>
                    <div className="h-3 w-full rounded-full bg-[#e8eef3] dark:bg-border-subtle">
                      <div
                        className="h-3 rounded-full bg-[linear-gradient(90deg,#00baa5_0%,#16a34a_100%)]"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="text-right text-[12px] tabular-nums text-[#374151] dark:text-foreground">
                      {item.count.toLocaleString("en-IN")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </AnalyticsCard>

        <AnalyticsCard
          title="Jobs Expiring Soon"
          description="Upcoming listing expiry windows from real expiry dates."
        >
          <div className="h-52 min-w-0 flex-1 xl:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.jobsExpiringSoon} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.borderSubtle} strokeDasharray="4 6" />
                <XAxis
                  dataKey="label"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString("en-IN"),
                    "Jobs",
                  ]}
                />
                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      <section className={JOBS_ANALYTICS_INSIGHT_CLASS}>
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-[0_2px_8px_rgba(14,133,133,0.12)] dark:bg-surface">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-foreground">Insights</h3>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {data.insight.headline}
            </p>
            {data.insight.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {data.insight.detail}
              </p>
            ) : null}
          </div>
        </div>
        {data.insight.jobsCreatedChangePercent !== null ? (
          <p
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-xs font-semibold sm:self-center",
              data.insight.trendDirection === "up" && "bg-success/10 text-success",
              data.insight.trendDirection === "down" && "bg-danger/10 text-danger",
              data.insight.trendDirection === "flat" && "bg-white text-muted dark:bg-surface",
            )}
          >
            {data.insight.trendDirection === "down" ? (
              <TrendingDown className="size-3.5" aria-hidden="true" />
            ) : (
              <TrendingUp className="size-3.5" aria-hidden="true" />
            )}
            {data.insight.jobsCreatedChangePercent > 0 ? "+" : ""}
            {data.insight.jobsCreatedChangePercent}% vs. previous period
          </p>
        ) : null}
      </section>
    </div>
  );
}
