import {
  ForecastsCard,
  HiringFunnelCard,
  KeyInsightsSection,
  MarketIntelligenceCard,
  PlacementIntelligenceCard,
  SupplyDemandCard,
  TopLocationsCard,
} from "./AnalyticsInsightsDashboard";
import { AnalyticsTrendsPanel } from "./AnalyticsTrendsPanel";
import { PlatformKpisStrip } from "./PlatformKpisStrip";
import { WebsiteTrafficPanel } from "./WebsiteTrafficPanel";
import { OperationsCard } from "../../ui/OperationsCard";
import type {
  AnalyticsTabId,
  OperationsAnalyticsOverview,
} from "../../../types/operations-analytics";

interface AnalyticsTabContentProps {
  tab: AnalyticsTabId;
  data: OperationsAnalyticsOverview;
  canExport: boolean;
  onExport: () => void;
  isExporting?: boolean;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function AnalyticsTabContent({
  tab,
  data,
  canExport,
  onExport,
  isExporting = false,
}: AnalyticsTabContentProps) {
  if (tab === "insights") {
    return (
      <div className="flex min-w-0 flex-col gap-3 max-sm:gap-2.5">
        <PlatformKpisStrip
          kpis={data.platformKpis ?? []}
          rangeLabel={data.range.label}
        />
        <WebsiteTrafficPanel
          traffic={data.websiteTraffic}
          rangeLabel={data.range.label}
        />
        <KeyInsightsSection insights={data.keyInsights} />
        {/*
          Tablet (md–xl): two cards per row; third card spans full width.
          Desktop (xl+): equal 3-column mosaic.
        */}
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

  if (tab === "website-traffic") {
    return (
      <div className="flex min-w-0 flex-col gap-3 max-sm:gap-2.5">
        <PlatformKpisStrip
          kpis={(data.platformKpis ?? []).filter((kpi) =>
            ["unique-visitors", "page-views", "sessions"].includes(kpi.id),
          )}
          rangeLabel={data.range.label}
        />
        <WebsiteTrafficPanel
          traffic={data.websiteTraffic}
          rangeLabel={data.range.label}
        />
      </div>
    );
  }

  if (tab === "trends") {
    return (
      <AnalyticsTrendsPanel
        trends={data.trends ?? []}
        rangeLabel={data.range.label}
      />
    );
  }

  if (tab === "hiring-funnel") {
    return (
      <div className="operations-analytics-grid grid grid-cols-1 gap-3 lg:grid-cols-2">
        <HiringFunnelCard
          stages={data.funnel}
          rangeLabel={data.range.label}
        />
        <OperationsCard
          title="Funnel stage totals"
          subtitle="Exact counts for the selected period"
          className="h-full min-w-0"
          bodyClassName="p-0"
        >
          {data.funnel.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              No funnel data for this period.
            </p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle bg-hero-bg/50 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-3 py-2.5">Stage</th>
                  <th className="px-3 py-2.5">Count</th>
                  <th className="px-3 py-2.5">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.funnel.map((stage) => (
                  <tr
                    key={stage.key}
                    className="border-b border-border-subtle/70 last:border-b-0"
                  >
                    <td className="px-3 py-2.5 text-[12px] font-medium text-foreground">
                      {stage.label}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] tabular-nums text-foreground">
                      {formatCount(stage.count)}
                    </td>
                    <td className="px-3 py-2.5 text-[12px] tabular-nums text-muted">
                      {Math.round(stage.conversionPercent)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OperationsCard>
      </div>
    );
  }

  if (tab === "supply-demand") {
    return (
      <div className="operations-analytics-grid grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SupplyDemandCard rows={data.supplyDemand} />
        <TopLocationsCard locations={data.topLocations} />
      </div>
    );
  }

  if (tab === "market-intelligence") {
    return <MarketIntelligenceCard rows={data.marketIntelligence} />;
  }

  if (tab === "placement-intelligence") {
    return (
      <PlacementIntelligenceCard
        metrics={data.placementMetrics}
        rangeLabel={data.range.label}
      />
    );
  }

  if (tab === "forecasts") {
    return <ForecastsCard forecasts={data.forecasts} />;
  }

  // reports
  const reportRows = [
    ...(data.platformKpis ?? []).map((kpi) => ({
      section: "Platform KPIs",
      metric: kpi.label,
      value:
        kpi.changePercent != null
          ? `${formatCount(kpi.value)} (${kpi.changePercent > 0 ? "+" : ""}${Math.round(kpi.changePercent)}% vs prior)`
          : formatCount(kpi.value),
    })),
    {
      section: "Website Traffic",
      metric: "Page views",
      value: formatCount(data.websiteTraffic.pageViews),
    },
    {
      section: "Website Traffic",
      metric: "Unique visitors",
      value: formatCount(data.websiteTraffic.uniqueVisitors),
    },
    {
      section: "Website Traffic",
      metric: "Sessions",
      value: formatCount(data.websiteTraffic.sessions),
    },
    {
      section: "Website Traffic",
      metric: "New / Returning",
      value: `${formatCount(data.websiteTraffic.newVisitors)} / ${formatCount(data.websiteTraffic.returningVisitors)}`,
    },
    ...data.funnel.map((stage) => ({
      section: "Funnel",
      metric: stage.label,
      value: `${formatCount(stage.count)} (${Math.round(stage.conversionPercent)}%)`,
    })),
    ...data.supplyDemand.map((row) => ({
      section: "Supply & Demand",
      metric: row.category,
      value: `Supply ${formatCount(row.supply)} · Demand ${formatCount(row.demand)} · ${row.status}`,
    })),
    ...data.placementMetrics.map((row) => ({
      section: "Placement Intelligence",
      metric: row.label,
      value: row.secondary ? `${row.value} · ${row.secondary}` : row.value,
    })),
    ...data.marketIntelligence.map((row) => ({
      section: "Market Intelligence",
      metric: row.state,
      value: `${row.talentSupply}/${row.jobDemand}/${row.placementRate} · ${row.marketStatus}`,
    })),
  ];

  return (
    <OperationsCard
      title="Analytics report summary"
      subtitle={`${data.range.label}${data.state ? ` · ${data.state}` : " · All India"}`}
      action={
        canExport ? (
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
          >
            {isExporting ? "Exporting…" : "Download CSV"}
          </button>
        ) : null
      }
      className="min-w-0"
      bodyClassName="p-0"
    >
      {reportRows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted">
          No reportable analytics for this period.
        </p>
      ) : (
        <div className="overflow-x-auto overscroll-x-contain scrollbar-hidden">
          <table className="w-full min-w-[36rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-hero-bg/50 text-[10px] font-semibold uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5">Section</th>
                <th className="px-3 py-2.5">Metric</th>
                <th className="px-3 py-2.5">Value</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((row) => (
                <tr
                  key={`${row.section}-${row.metric}`}
                  className="border-b border-border-subtle/70 last:border-b-0"
                >
                  <td className="px-3 py-2.5 text-[12px] text-muted">
                    {row.section}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] font-medium text-foreground">
                    {row.metric}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-foreground">
                    {row.value}
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
