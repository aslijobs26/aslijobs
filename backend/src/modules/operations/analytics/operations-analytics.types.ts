export const ANALYTICS_DATE_PRESETS = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "last_6_months",
  "last_12_months",
  "this_year",
  "all",
  "custom",
] as const;

export type AnalyticsDatePreset = (typeof ANALYTICS_DATE_PRESETS)[number];

export type AnalyticsInsightTone =
  | "growth"
  | "concern"
  | "expansion"
  | "gap"
  | "positive";

export type AnalyticsSupplyDemandStatus =
  | "shortage"
  | "surplus"
  | "balanced";

export type AnalyticsOpportunityLevel = "high" | "medium" | "low";

export type AnalyticsLevel = "high" | "medium" | "low";

export interface OperationsAnalyticsRange {
  preset: AnalyticsDatePreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
}

export interface OperationsAnalyticsKeyInsight {
  id: string;
  tone: AnalyticsInsightTone;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

export interface OperationsAnalyticsFunnelStage {
  key: string;
  label: string;
  count: number;
  /** Consecutive-stage conversion percent (first stage is always 100). */
  conversionPercent: number;
  /** Relative bar width vs top stage (0–100). */
  widthPercent: number;
}

export interface OperationsAnalyticsSupplyDemandRow {
  category: string;
  supply: number;
  demand: number;
  status: AnalyticsSupplyDemandStatus;
}

export interface OperationsAnalyticsTopLocation {
  rank: number;
  name: string;
  description: string;
  opportunity: AnalyticsOpportunityLevel;
}

export interface OperationsAnalyticsPlacementMetric {
  id: string;
  value: string;
  label: string;
  trendPercent: number | null;
  trendDirection: "up" | "down" | "flat" | null;
  secondary?: string;
}

export interface OperationsAnalyticsMarketRow {
  state: string;
  talentSupply: AnalyticsLevel;
  jobDemand: AnalyticsLevel;
  placementRate: AnalyticsLevel;
  marketStatus: string;
  marketStatusTone: "danger" | "success" | "warning" | "info" | "neutral";
}

export interface OperationsAnalyticsForecast {
  id: string;
  tone: "growth" | "expansion" | "seasonal";
  text: string;
}

export interface OperationsAnalyticsTrendPoint {
  date: string;
  label: string;
  placements: number;
  joined: number;
  registrations: number;
  jobsCreated: number;
}

export interface OperationsAnalyticsKpiCard {
  id: string;
  label: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  trendDirection: "up" | "down" | "flat" | null;
  format: "number" | "percent";
}

export interface OperationsAnalyticsWebsiteTraffic {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  newVisitors: number;
  returningVisitors: number;
  topPages: Array<{ path: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  bySourceHost: Array<{ host: string; count: number }>;
  daily: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
  trackingActive: boolean;
}

export interface OperationsAnalyticsOverview {
  range: OperationsAnalyticsRange;
  state: string;
  platformKpis: OperationsAnalyticsKpiCard[];
  websiteTraffic: OperationsAnalyticsWebsiteTraffic;
  keyInsights: OperationsAnalyticsKeyInsight[];
  funnel: OperationsAnalyticsFunnelStage[];
  supplyDemand: OperationsAnalyticsSupplyDemandRow[];
  topLocations: OperationsAnalyticsTopLocation[];
  placementMetrics: OperationsAnalyticsPlacementMetric[];
  marketIntelligence: OperationsAnalyticsMarketRow[];
  forecasts: OperationsAnalyticsForecast[];
  trends: OperationsAnalyticsTrendPoint[];
}
