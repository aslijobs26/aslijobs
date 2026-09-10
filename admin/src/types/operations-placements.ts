export const PLACEMENTS_ANALYTICS_PRESETS = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
] as const;

export type PlacementsAnalyticsPreset =
  (typeof PLACEMENTS_ANALYTICS_PRESETS)[number];

export type PlacementJoiningStatus =
  | "joining_pending"
  | "joined"
  | "did_not_join";

export type PlacementJoiningStatusFilter = "all" | PlacementJoiningStatus;

export type OperationsPlacementsListSort =
  | "placedAt"
  | "offerDate"
  | "joiningDate"
  | "candidateName"
  | "company";

export interface OperationsPlacementsAnalyticsParams {
  preset: PlacementsAnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationsPlacementsAnalyticsRange {
  preset: PlacementsAnalyticsPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
  granularity: "day" | "week" | "month";
}

export interface OperationsPlacementsOverviewKpis {
  totalPlacements: number;
  totalPlacementsTrendPercent: number | null;
  totalPlacementsCaption: string;
  joined: number;
  joinedTrendPercent: number | null;
  joinedCaption: string;
  joinedPercentOfTotal: number | null;
  joiningPending: number;
  joiningPendingTrendPercent: number | null;
  joiningPendingCaption: string;
  joiningPendingPercentOfTotal: number | null;
  didNotJoin: number;
  didNotJoinTrendPercent: number | null;
  didNotJoinCaption: string;
  didNotJoinPercentOfTotal: number | null;
  avgTimeToJoinDays: number | null;
  avgTimeToJoinTrendPercent: number | null;
  avgTimeToJoinCaption: string;
}

export interface OperationsPlacementsTabCounts {
  all: number;
  joined: number;
  joiningPending: number;
  didNotJoin: number;
}
export type OperationsPlacementsTableTab =
  | "all"
  | "joined"
  | "joiningPending"
  | "didNotJoin";

export interface OperationsPlacementsTrendPoint {
  date: string;
  label: string;
  placements: number;
  joined: number;
}

export interface OperationsPlacementsFunnelStage {
  key: string;
  label: string;
  count: number;
  percent: number | null;
}

export interface OperationsPlacementsNamedCount {
  key: string;
  label: string;
  count: number;
  percent?: number | null;
}


export interface OperationsPlacementsJoiningStatusSegment {
  key: PlacementJoiningStatus;
  label: string;
  count: number;
  percent: number | null;
}

export interface OperationsPlacementsTimeToJoinPoint {
  date: string;
  label: string;
  avgDays: number | null;
}

export interface OperationsPlacementsInsight {
  id: string;
  tone?: "positive" | "negative" | "neutral" | "warning";
  text?: string;
  label?: string;
}

export interface OperationsPlacementsAnalyticsResult {
  range: OperationsPlacementsAnalyticsRange;
  kpis: OperationsPlacementsOverviewKpis;
  tabs: OperationsPlacementsTabCounts;
  trend: OperationsPlacementsTrendPoint[];
  funnel: OperationsPlacementsFunnelStage[];
  byCategory: OperationsPlacementsNamedCount[];
  byLocation: {
    states: OperationsPlacementsNamedCount[];
    cities: OperationsPlacementsNamedCount[];
  };
  joiningStatus: {
    total: number;
    segments: OperationsPlacementsJoiningStatusSegment[];
  };
  timeToJoin: {
    avgDays: number | null;
    trendPercent: number | null;
    series: OperationsPlacementsTimeToJoinPoint[];
  };
  insights: OperationsPlacementsInsight[];
}

export interface OperationsPlacementListItem {
  id: string;
  displayId: string;
  candidateName: string;
  candidatePhone?: string;
  candidateEmail?: string;
  jobRole: string;
  company: string;
  location: string;
  city: string;
  state: string;
  category: string;
  offerDate: string | null;
  joiningDate: string | null;
  joiningStatus: PlacementJoiningStatus;
  statusLabel: string;
  applicationStatus: string;
  publicJobId: string;
  jobId: string;
  employerId: string;
  jobSeekerId: string;
  placedAt: string | null;
  updatedAt: string | null;
  appliedAt: string | null;
}

export interface OperationsPlacementTimelineEntry {
  status: string;
  statusLabel: string;
  joiningStatus: PlacementJoiningStatus | null;
  at: string;
  actorType: string;
  remark: string;
}

export interface OperationsPlacementDetail extends OperationsPlacementListItem {
  candidateCity: string;
  candidateState: string;
  employerName: string;
  employerPhone?: string;
  employerEmail?: string;
  employerLogoUrl: string;
  employerVerified: boolean;
  jobTitle: string;
  jobCompanyName: string;
  jobLocation: string;
  offer: {
    offerDate: string;
    joiningDate: string;
    packageText: string;
    notes: string;
  } | null;
  timeline: OperationsPlacementTimelineEntry[];
  daysToJoin: number | null;
  canUpdateJoining: boolean;
}

export interface OperationsPlacementsFilterOptions {
  statuses: Array<{ value: PlacementJoiningStatusFilter; label: string }>;
  categories: Array<{ value: string; label: string }>;
  states: string[];
  cities: string[];
}

export interface OperationsPlacementsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OperationsPlacementsListResult {
  items: OperationsPlacementListItem[];
  filterOptions: OperationsPlacementsFilterOptions;
  pagination: OperationsPlacementsPagination;
}

export interface OperationsPlacementsListParams {
  page: number;
  limit: number;
  search?: string;
  status?: PlacementJoiningStatusFilter;
  category?: string;
  state?: string;
  city?: string;
  employerId?: string;
  jobId?: string;
  sort?: OperationsPlacementsListSort;
  order?: "asc" | "desc";
  preset?: PlacementsAnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationsPlacementsExportParams {
  search?: string;
  status?: PlacementJoiningStatusFilter;
  category?: string;
  state?: string;
  city?: string;
  employerId?: string;
  jobId?: string;
  sort?: OperationsPlacementsListSort;
  order?: "asc" | "desc";
  preset?: PlacementsAnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
  format?: "xlsx" | "csv";
}

export interface UpdatePlacementJoiningStatusInput {
  joiningStatus: "joined" | "did_not_join";
  expectedStatus?: "selected";
  remarks?: string;
}
