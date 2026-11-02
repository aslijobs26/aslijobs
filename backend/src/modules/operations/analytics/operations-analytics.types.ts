export const ANALYTICS_DATE_PRESETS = [
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "last_6_months",
  "last_12_months",
  "this_month",
  "last_month",
  "this_quarter",
  "this_year",
  "all",
  "custom",
] as const;

export const ANALYTICS_EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;
export const ANALYTICS_REPORTS = [
  "summary",
  "website-traffic",
  "job-demand",
  "applications",
  "hiring-funnel",
  "interviews",
  "employers",
  "placements",
  "supply-demand",
  "forecast",
  "category-coverage",
  "acquisition",
  "registration-funnel",
  "job-conversion",
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
  comparisonBasis?: "equivalent_length" | "previous_calendar_period" | "unavailable";
  timezone?: "Asia/Kolkata";
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
  definition?: string;
}

export interface OperationsAnalyticsSupplyDemandRow {
  category: string;
  categoryId?: string;
  supply: number;
  demand: number;
  applications?: number;
  ratio?: number | null;
  unclassified?: boolean;
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
  absoluteDifference?: number | null;
  changePercent: number | null;
  trendDirection: "up" | "down" | "flat" | null;
  changeLabel?: "percent" | "new" | "no_baseline" | "unavailable";
  format: "number" | "percent";
  /** Set when this KPI ignores one or more active filters. */
  filterNote?: string;
  definition?: {
    definition: string;
    method: string;
    source: string;
    dateField: string;
    filters: string;
    limitation: string;
  };
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
  /** Explains when visit totals are job-page views for the active filters. */
  scopeNote?: string;
}

export interface OperationsAnalyticsFilters {
  country: string;
  state: string;
  city: string;
  category: string;
  employer: string;
  jobType: string;
  applicationStatus: string;
  horizonDays: number;
}

export interface OperationsAnalyticsInterviewMetrics {
  scheduled: number;
  completed: number;
  rescheduled: number;
  cancelled: number;
  missingHistory: number;
  noShows: number | null;
  completionRate: number | null;
  interviewToOfferRate: number | null;
  avgDaysApplicationToInterview: number | null;
  avgDaysInterviewToOffer: number | null;
  byCategory: Array<{ category: string; scheduled: number; completed: number; offers: number }>;
  byEmployer: Array<{ employerId: string; scheduled: number; completed: number; offers: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  note: string;
}

export interface OperationsAnalyticsEmployerHiring {
  totalEmployers: number;
  verifiedEmployers: number;
  activeHiringEmployers: number;
  employersWithJobs: number;
  employersWithApplications: number;
  employersInterviewing: number;
  employersWithOffers: number;
  employersWithPlacements: number;
  hiringConversionPercent: number | null;
  repeatHiringPercent: number | null;
  averageJobsPerPostingEmployer: number | null;
  averageHiresPerHiringEmployer: number | null;
  verifiedInPeriod?: number;
  employersWhoSelected?: number;
  repeatHiringEmployers?: number;
  averageApplicationsPerEmployer?: number | null;
  employerToApplicationPercent?: number | null;
  employerToJoinPercent?: number | null;
  rows?: Array<{
    employerName: string;
    jobs: number;
    applications: number;
    interviews: number;
    offers: number;
    selected: number;
    joined: number;
    distinctJobs: number;
  }>;
  truncated?: boolean;
  note?: string;
}

export interface OperationsAnalyticsCategoryBreakdown {
  rows: Array<{
    category: string;
    unclassified: boolean;
    jobs: number;
    applications: number;
    interviews: number;
    offers: number;
    selected: number;
    joined: number;
    employers: number;
    applicationToInterviewPercent: number | null;
    offerToJoinPercent: number | null;
  }>;
  jobsWithoutApplications: number;
  applicationsWithoutInterviews: number;
  offersWithoutJoins: number;
  truncated: boolean;
  note: string;
}

export interface OperationsAnalyticsAcquisition {
  model: "first_touch";
  rows: Array<{
    source: string;
    medium: string;
    campaign: string;
    content: string;
    term: string;
    landingPath: string;
    visitors: number;
    sessions: number;
    registrations: number;
    applications: number;
    visitorToApplicationPercent: number | null;
  }>;
  note: string;
}

export interface OperationsAnalyticsRegistrationStage {
  key: string;
  label: string;
  count: number | null;
  dropOff: number | null;
  conversionPercent: number | null;
  definition?: string;
  source?: string;
  unavailableReason?: string;
}

export interface OperationsAnalyticsRegistrationFunnel {
  jobSeekers: OperationsAnalyticsRegistrationStage[];
  employers: OperationsAnalyticsRegistrationStage[];
  ignoredPageViewsAsStarts: boolean;
  note: string;
}

export interface OperationsAnalyticsJobConversion {
  detailViewsTracked: boolean;
  detailViewEvents: number | null;
  detailViewVisitors: number | null;
  visitorJobPairs: number;
  jobsWithViewsNoApplications: number;
  applications: number;
  applyStarts: number | null;
  viewToApplicationPercent: number | null;
  startToSubmitPercent: number | null;
  applicationsPerJob: number | null;
  jobsWithApplicationsNoInterviews: number;
  jobsWithInterviewsNoOffers: number;
  jobsWithOffersNoJoins: number;
  rows: Array<{ jobLabel: string; applications: number; interviews: number; offers: number; joined: number }>;
  note: string;
}

export interface OperationsAnalyticsForecastSeries {
  id: string;
  label: string;
  sufficient: boolean;
  message: string;
  methodology: string;
  history: Array<{ date: string; actual: number }>;
  projection: Array<{ date: string; estimate: number; lower: number; upper: number }>;
  backtest: {
    holdoutDays: number;
    mae: number;
    mape: number | null;
    from?: string;
    to?: string;
  } | null;
}

export interface OperationsAnalyticsForecastModel {
  horizonDays: number;
  methodology: string;
  generatedAt: string;
  series: OperationsAnalyticsForecastSeries[];
}

export interface OperationsAnalyticsOverview {
  range: OperationsAnalyticsRange;
  state: string;
  filters?: OperationsAnalyticsFilters;
  limitations?: string[];
  generatedAt?: string;
  platformKpis: OperationsAnalyticsKpiCard[];
  websiteTraffic: OperationsAnalyticsWebsiteTraffic;
  keyInsights: OperationsAnalyticsKeyInsight[];
  funnel: OperationsAnalyticsFunnelStage[];
  supplyDemand: OperationsAnalyticsSupplyDemandRow[];
  categoryCoverage?: {
    jobsMapped: number;
    jobsUnmapped: number;
    candidatesMapped: number;
    candidatesUnmapped: number;
    coveragePercent: number | null;
  };
  topLocations: OperationsAnalyticsTopLocation[];
  placementMetrics: OperationsAnalyticsPlacementMetric[];
  marketIntelligence: OperationsAnalyticsMarketRow[];
  interviewMetrics?: OperationsAnalyticsInterviewMetrics;
  employerHiring?: OperationsAnalyticsEmployerHiring;
  categoryBreakdown?: OperationsAnalyticsCategoryBreakdown;
  acquisition?: OperationsAnalyticsAcquisition;
  registrationFunnel?: OperationsAnalyticsRegistrationFunnel;
  jobConversion?: OperationsAnalyticsJobConversion;
  forecasts: OperationsAnalyticsForecast[];
  forecastModel?: OperationsAnalyticsForecastModel;
  trends: OperationsAnalyticsTrendPoint[];
  scheduledReports?: false;
  supplyDemandTruncated?: boolean;
}
