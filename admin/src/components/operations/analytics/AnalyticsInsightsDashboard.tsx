import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Building2,
  CalendarDays,
  FileCheck2,
  Rocket,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import type {
  AnalyticsInsightTone,
  AnalyticsLevel,
  AnalyticsOpportunityLevel,
  AnalyticsSupplyDemandStatus,
  OperationsAnalyticsForecast,
  OperationsAnalyticsFunnelStage,
  OperationsAnalyticsKeyInsight,
  OperationsAnalyticsMarketRow,
  OperationsAnalyticsOverview,
  OperationsAnalyticsPlacementMetric,
  OperationsAnalyticsSupplyDemandRow,
  OperationsAnalyticsTopLocation,
} from "../../../types/operations-analytics";
import { cn } from "../../../utils/cn";
import { OperationsCard } from "../../ui/OperationsCard";

const INSIGHT_TONE_STYLES: Record<
  AnalyticsInsightTone,
  { card: string; iconWrap: string; icon: LucideIcon; cta: string }
> = {
  growth: {
    card: "border-emerald-200/80 bg-emerald-50/70",
    iconWrap: "bg-emerald-100 text-emerald-700",
    icon: BarChart3,
    cta: "text-emerald-700 hover:text-emerald-800",
  },
  concern: {
    card: "border-rose-200/80 bg-rose-50/70",
    iconWrap: "bg-rose-100 text-rose-700",
    icon: AlertTriangle,
    cta: "text-rose-700 hover:text-rose-800",
  },
  expansion: {
    card: "border-sky-200/80 bg-sky-50/70",
    iconWrap: "bg-sky-100 text-sky-700",
    icon: Rocket,
    cta: "text-sky-700 hover:text-sky-800",
  },
  gap: {
    card: "border-amber-200/80 bg-amber-50/70",
    iconWrap: "bg-amber-100 text-amber-700",
    icon: Users,
    cta: "text-amber-700 hover:text-amber-800",
  },
  positive: {
    card: "border-violet-200/80 bg-violet-50/70",
    iconWrap: "bg-violet-100 text-violet-700",
    icon: TrendingUp,
    cta: "text-violet-700 hover:text-violet-800",
  },
};

const FUNNEL_BAR_COLORS = [
  "bg-[#3B82F6]",
  "bg-[#60A5FA]",
  "bg-[#34D399]",
  "bg-[#FBBF24]",
  "bg-[#F472B6]",
  "bg-[#A78BFA]",
];

const STATUS_BADGE: Record<
  AnalyticsSupplyDemandStatus,
  string
> = {
  shortage: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
  surplus: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  balanced: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
};

const OPPORTUNITY_BADGE: Record<AnalyticsOpportunityLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  low: "bg-slate-50 text-slate-600 ring-1 ring-slate-200/80",
};

const LEVEL_TEXT: Record<AnalyticsLevel, string> = {
  high: "text-emerald-700",
  medium: "text-amber-600",
  low: "text-rose-600",
};

const MARKET_STATUS_TEXT: Record<
  OperationsAnalyticsMarketRow["marketStatusTone"],
  string
> = {
  danger: "text-rose-600",
  success: "text-emerald-700",
  warning: "text-amber-600",
  info: "text-sky-700",
  neutral: "text-slate-600",
};

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

function InsightCard({ insight }: { insight: OperationsAnalyticsKeyInsight }) {
  const style = INSIGHT_TONE_STYLES[insight.tone];
  const Icon = style.icon;

  return (
    <article
      className={cn(
        "flex min-h-[9.5rem] flex-col rounded-lg border p-3 shadow-sm sm:min-h-[10rem] sm:p-3.5",
        style.card,
      )}
    >
      <div
        className={cn(
          "mb-2 inline-flex h-7 w-7 items-center justify-center rounded-md",
          style.iconWrap,
        )}
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      </div>
      <h4 className="text-[12px] font-semibold text-foreground sm:text-[13px]">
        {insight.title}
      </h4>
      <p className="mt-1 flex-1 text-[11px] leading-snug text-muted sm:text-[12px]">
        {insight.description}
      </p>
      <Link
        to={insight.href}
        className={cn(
          "mt-2 inline-flex text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[12px]",
          style.cta,
        )}
      >
        {insight.ctaLabel}
      </Link>
    </article>
  );
}

export function KeyInsightsSection({
  insights,
}: {
  insights: OperationsAnalyticsKeyInsight[];
}) {
  return (
    <OperationsCard
      title="Key Insights"
      subtitle="Insights derived from platform data"
      className="min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      {insights.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">
          No insights available for this period.
        </p>
      ) : (
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(var(--insights-count),minmax(0,1fr))] xl:gap-3"
          style={
            {
              "--insights-count": String(
                Math.min(Math.max(insights.length, 1), 5),
              ),
            } as CSSProperties
          }
        >
          {insights.slice(0, 5).map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </OperationsCard>
  );
}

export function HiringFunnelCard({
  stages,
  rangeLabel,
}: {
  stages: OperationsAnalyticsFunnelStage[];
  rangeLabel: string;
}) {
  return (
    <OperationsCard
      title="Hiring Funnel Analytics"
      subtitle="Overall conversion across all job categories"
      action={
        <span className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-[10px] font-medium text-muted">
          {rangeLabel}
        </span>
      }
      className="h-full min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      {stages.length === 0 ? (
        <p className="flex min-h-[14rem] items-center justify-center text-xs text-muted">
          No funnel data available for this period.
        </p>
      ) : (
        <ul
          className="flex min-h-[14rem] flex-col justify-center gap-2.5"
          aria-label="Hiring funnel stages"
        >
          {stages.map((stage, index) => (
            <li
              key={stage.key}
              className="grid grid-cols-[minmax(0,4.75rem)_minmax(0,1fr)_auto_auto] items-center gap-x-2 sm:grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_auto_auto] sm:gap-x-3 md:grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_auto_auto]"
            >
              <span className="truncate text-[11px] font-medium text-foreground sm:text-[12px]">
                {stage.label}
              </span>
              <div
                className="h-3.5 w-full min-w-0 overflow-hidden rounded bg-[#EEF2F6]"
                role="progressbar"
                aria-label={`${stage.label}: ${stage.conversionPercent}% conversion`}
                aria-valuenow={stage.conversionPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={cn(
                    "h-full rounded transition-[width] duration-300",
                    FUNNEL_BAR_COLORS[index % FUNNEL_BAR_COLORS.length],
                  )}
                  style={{ width: `${stage.widthPercent}%` }}
                />
              </div>
              <span className="min-w-[2.5rem] text-right text-[12px] font-semibold tabular-nums text-foreground sm:min-w-[3rem]">
                {formatCount(stage.count)}
              </span>
              <span className="min-w-[2.25rem] text-right text-[11px] tabular-nums text-muted sm:min-w-[2.5rem]">
                {Math.round(stage.conversionPercent)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </OperationsCard>
  );
}

export function SupplyDemandCard({
  rows,
}: {
  rows: OperationsAnalyticsSupplyDemandRow[];
}) {
  const max = Math.max(...rows.flatMap((r) => [r.supply, r.demand]), 1);

  return (
    <OperationsCard
      title="Supply vs Demand by Job Category"
      subtitle="Compare available talent with employer demand"
      action={
        <span className="text-[11px] font-semibold text-primary">View all</span>
      }
      className="h-full min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      <div className="mb-3 flex items-center gap-4 text-[10px] text-muted sm:text-[11px]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#3B82F6]" aria-hidden />
          Jobseekers (Supply)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" aria-hidden />
          Jobs (Demand)
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="flex min-h-[12rem] items-center justify-center text-xs text-muted">
          No supply &amp; demand data for this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.category} className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-medium text-foreground sm:text-[12px]">
                  {row.category}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                    STATUS_BADGE[row.status],
                  )}
                >
                  {row.status}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-[#EEF2F6]">
                    <div
                      className="h-full rounded bg-[#3B82F6]"
                      style={{
                        width: `${Math.max(4, (row.supply / max) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] tabular-nums text-muted">
                    {formatCount(row.supply)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded bg-[#EEF2F6]">
                    <div
                      className="h-full rounded bg-[#10B981]"
                      style={{
                        width: `${Math.max(4, (row.demand / max) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] tabular-nums text-muted">
                    {formatCount(row.demand)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </OperationsCard>
  );
}

export function TopLocationsCard({
  locations,
}: {
  locations: OperationsAnalyticsTopLocation[];
}) {
  return (
    <OperationsCard
      title="Top Locations by Opportunity"
      subtitle="Based on demand-supply gap and growth"
      action={
        <span className="text-[11px] font-semibold text-primary">View all</span>
      }
      className="h-full min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      {locations.length === 0 ? (
        <p className="flex min-h-[12rem] items-center justify-center text-xs text-muted">
          No location opportunity data for this period.
        </p>
      ) : (
        <ol
          className="flex max-h-[calc(4*3.125rem+3*0.625rem)] flex-col gap-2.5 overflow-y-auto overscroll-y-contain pr-0.5 scrollbar-hidden"
          aria-label="Top locations by opportunity"
        >
          {locations.map((location) => (
            <li
              key={`${location.rank}-${location.name}`}
              className="flex min-h-[3.125rem] shrink-0 items-start gap-2.5 rounded-lg border border-border-subtle/80 bg-surface px-2.5 py-2"
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-foreground">
                {location.rank}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-foreground">
                  {location.name}
                </p>
                <p className="mt-0.5 text-[10px] text-muted sm:text-[11px]">
                  {location.description}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                  OPPORTUNITY_BADGE[location.opportunity],
                )}
              >
                {location.opportunity}
              </span>
            </li>
          ))}
        </ol>
      )}
    </OperationsCard>
  );
}

const PLACEMENT_METRIC_STYLES: Record<
  string,
  { icon: LucideIcon; iconWrap: string }
> = {
  "avg-time": {
    icon: FileCheck2,
    iconWrap: "bg-emerald-100 text-emerald-700",
  },
  "interview-offer": {
    icon: UserCheck,
    iconWrap: "bg-sky-100 text-sky-700",
  },
  "employer-repeat": {
    icon: Building2,
    iconWrap: "bg-violet-100 text-violet-700",
  },
  "top-category": {
    icon: Star,
    iconWrap: "bg-amber-100 text-amber-700",
  },
};

export function PlacementIntelligenceCard({
  metrics,
  rangeLabel,
}: {
  metrics: OperationsAnalyticsPlacementMetric[];
  rangeLabel: string;
}) {
  return (
    <OperationsCard
      title="Placement Intelligence"
      subtitle="What drives successful placements?"
      action={
        <span className="rounded-md border border-border-subtle bg-surface px-2 py-1 text-[10px] font-medium text-muted">
          {rangeLabel}
        </span>
      }
      className="h-full min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
        {metrics.map((metric) => {
          const style =
            PLACEMENT_METRIC_STYLES[metric.id] ??
            PLACEMENT_METRIC_STYLES["avg-time"];
          const Icon = style.icon;
          const isTopCategory = metric.id === "top-category";
          const trendPositive =
            metric.id === "avg-time"
              ? metric.trendDirection === "down"
              : metric.trendDirection === "up";
          const TrendIcon =
            metric.trendDirection === "down" ? ArrowDown : ArrowUp;

          return (
            <div
              key={metric.id}
              className="flex min-h-[6.75rem] flex-col rounded-xl border border-slate-200/80 bg-[#F8FAFC] p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div
                className={cn(
                  "mb-2.5 inline-flex h-8 w-8 items-center justify-center rounded-lg",
                  style.iconWrap,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </div>

              {isTopCategory ? (
                <>
                  <p className="text-[11px] font-medium leading-snug text-muted">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-[15px] font-bold leading-tight tracking-tight text-foreground">
                    {metric.value}
                  </p>
                  {metric.secondary ? (
                    <p className="mt-1 text-[11px] text-muted">
                      {metric.secondary}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="text-[1.25rem] font-bold leading-none tracking-tight text-foreground tabular-nums">
                    {metric.value}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-snug text-muted">
                    {metric.label}
                  </p>
                  {metric.trendPercent != null && metric.trendDirection ? (
                    <p
                      className={cn(
                        "mt-auto flex items-center gap-0.5 pt-2 text-[11px] font-semibold",
                        trendPositive ? "text-emerald-600" : "text-rose-600",
                      )}
                    >
                      <TrendIcon className="h-3 w-3" aria-hidden />
                      {Math.abs(Math.round(metric.trendPercent))}%
                      <span className="ml-0.5 font-normal text-muted">
                        vs previous period
                      </span>
                    </p>
                  ) : (
                    <p className="mt-auto pt-2 text-[11px] text-muted/70">
                      vs previous period
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </OperationsCard>
  );
}

export function MarketIntelligenceCard({
  rows,
}: {
  rows: OperationsAnalyticsMarketRow[];
}) {
  return (
    <OperationsCard
      title="Market Intelligence"
      subtitle="Key insights by state"
      action={
        <span className="text-[11px] font-semibold text-primary">View all</span>
      }
      className="h-full min-w-0"
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <p className="flex min-h-[12rem] items-center justify-center px-3 text-xs text-muted">
          No market intelligence for this period.
        </p>
      ) : (
        <div className="min-w-0 w-full overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[32%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border-subtle bg-hero-bg/50 text-[9px] font-semibold uppercase leading-tight tracking-wide text-muted">
                <th className="px-2 py-2 text-left font-semibold">State</th>
                <th className="px-1 py-2 text-center font-semibold">Supply</th>
                <th className="px-1 py-2 text-center font-semibold">Demand</th>
                <th className="px-1 py-2 text-center font-semibold">Place.</th>
                <th className="px-2 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.state}
                  className="border-b border-border-subtle/70 last:border-b-0"
                >
                  <td className="truncate px-2 py-2 text-[11px] font-medium text-foreground">
                    {row.state}
                  </td>
                  <td
                    className={cn(
                      "px-1 py-2 text-center text-[11px] font-semibold capitalize",
                      LEVEL_TEXT[row.talentSupply],
                    )}
                  >
                    {row.talentSupply}
                  </td>
                  <td
                    className={cn(
                      "px-1 py-2 text-center text-[11px] font-semibold capitalize",
                      LEVEL_TEXT[row.jobDemand],
                    )}
                  >
                    {row.jobDemand}
                  </td>
                  <td
                    className={cn(
                      "px-1 py-2 text-center text-[11px] font-semibold capitalize",
                      LEVEL_TEXT[row.placementRate],
                    )}
                  >
                    {row.placementRate}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2 text-[10px] font-medium leading-snug",
                      MARKET_STATUS_TEXT[row.marketStatusTone],
                    )}
                  >
                    <span className="line-clamp-2 break-words">
                      {row.marketStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OperationsCard>
  );
}

export function ForecastsCard({
  forecasts,
}: {
  forecasts: OperationsAnalyticsForecast[];
}) {
  const icons: Record<OperationsAnalyticsForecast["tone"], LucideIcon> = {
    growth: TrendingUp,
    expansion: BarChart3,
    seasonal: CalendarDays,
  };
  const wraps: Record<OperationsAnalyticsForecast["tone"], string> = {
    growth: "bg-emerald-100 text-emerald-700",
    expansion: "bg-violet-100 text-violet-700",
    seasonal: "bg-amber-100 text-amber-700",
  };

  return (
    <OperationsCard
      title="Forecasts & Predictions"
      subtitle="Based on historical data and market trends"
      action={
        <span className="text-[11px] font-semibold text-primary">View all</span>
      }
      className="h-full min-w-0"
      bodyClassName="p-3 sm:p-3.5"
    >
      {forecasts.length === 0 ? (
        <p className="flex min-h-[12rem] items-center justify-center text-xs text-muted">
          No evidence-based outlook available for this period.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {forecasts.map((forecast) => {
            const Icon = icons[forecast.tone];
            return (
              <li
                key={forecast.id}
                className="flex gap-2.5 rounded-lg border border-border-subtle bg-hero-bg/30 p-3"
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                    wraps[forecast.tone],
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <p className="text-[12px] leading-snug text-foreground">
                  {forecast.text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </OperationsCard>
  );
}

interface AnalyticsInsightsDashboardProps {
  data: OperationsAnalyticsOverview;
}

export function AnalyticsInsightsDashboard({
  data,
}: AnalyticsInsightsDashboardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 max-sm:gap-2.5">
      <KeyInsightsSection insights={data.keyInsights} />

      <div className="operations-analytics-grid grid grid-cols-1 gap-3 max-sm:gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <HiringFunnelCard
            stages={data.funnel}
            rangeLabel={data.range.label}
          />
        </div>
        <div className="min-w-0">
          <SupplyDemandCard rows={data.supplyDemand} />
        </div>
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <TopLocationsCard locations={data.topLocations} />
        </div>
      </div>

      <div className="operations-analytics-grid grid grid-cols-1 gap-3 max-sm:gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0">
          <PlacementIntelligenceCard
            metrics={data.placementMetrics}
            rangeLabel={data.range.label}
          />
        </div>
        <div className="min-w-0">
          <MarketIntelligenceCard rows={data.marketIntelligence} />
        </div>
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <ForecastsCard forecasts={data.forecasts} />
        </div>
      </div>
    </div>
  );
}
