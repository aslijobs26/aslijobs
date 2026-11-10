export type OperationsEmployerVerificationStatus =
  | "verified"
  | "pending"
  | "rejected";

export type OperationsEmployerStatus = "active" | "suspended" | "inactive";

export type OperationsEmployerDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export interface OperationsEmployerKpis {
  totalEmployers: number;
  newEmployersToday: number;
  newThisWeek: number;
  activeEmployers: number;
  activeEmployersPercent: number | null;
  verifiedEmployers: number;
  verifiedEmployersPercent: number | null;
  pendingVerification: number;
  pendingVerificationPercent: number | null;
  suspended: number;
  suspendedPercent: number | null;
  rejected: number;
  rejectedPercent: number | null;
}

export interface OperationsEmployersPeriodStats {
  registered: number;
  verified: number;
  pendingVerification: number;
  suspended: number;
  rejected: number;
}

export interface OperationsEmployerListItem {
  id: string;
  displayId: string;
  accountType: string;
  displayName: string;
  companyName: string;
  establishmentName: string;
  organizationType: string;
  industry: string;
  phone: string;
  email: string;
  location: string;
  city: string;
  state: string;
  registeredAt: string | null;
  registeredAtDate: string;
  registeredAtTime: string;
  verificationStatus: OperationsEmployerVerificationStatus;
  verificationStatusLabel: string;
  verifiedAt: string | null;
  verifiedAtDate: string;
  /** Present on detail; optional on list when API includes it. */
  verificationSubmittedAt?: string | null;
  /** Present on detail; optional on list when API includes it. */
  rejectedAt?: string | null;
  /** Present on detail; optional on list when API includes it. */
  verifiedByLabel?: string;
  /** Present on detail; optional on list when API includes it. */
  rejectedByLabel?: string;
  /** Optional list enrichment when API includes document totals. */
  documentsCount?: number;
  status: OperationsEmployerStatus;
  statusLabel: string;
  activeJobsCount: number;
  totalJobsCount: number;
  logoUrl: string;
  isWhatsappVerified: boolean;
  isProfileComplete: boolean;
  registrationStatus: string;
  /** True when registration awareness state is still "new". */
  isNewRegistration?: boolean;
  registrationAwarenessState?: "new" | "seen" | null;
}

export interface OperationsEmployersFilterOptions {
  verificationStatuses: Array<{ value: string; label: string }>;
  employerTypes: Array<{ value: string; label: string }>;
  locations: string[];
  statuses: Array<{ value: string; label: string }>;
}

export interface OperationsEmployersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OperationsEmployersListResult {
  kpis: OperationsEmployerKpis;
  periodStats: OperationsEmployersPeriodStats;
  filterOptions: OperationsEmployersFilterOptions;
  employers: OperationsEmployerListItem[];
  pagination: OperationsEmployersPagination;
}

export interface OperationsEmployersListParams {
  page: number;
  limit: number;
  search?: string;
  verificationStatus?: string;
  /** Derived queue: under_review | sla_breaches | needs_attention */
  verificationQueue?: string;
  employerType?: string;
  location?: string;
  status?: string;
  datePreset?: OperationsEmployerDatePreset;
  dateFrom?: string;
  dateTo?: string;
  analyticsPreset?: OperationsEmployerDatePreset;
  analyticsFrom?: string;
  analyticsTo?: string;
  kpi?: OperationsEmployerOverviewKpi;
  kpiPreset?: OperationsEmployersAnalyticsPreset;
  kpiDateFrom?: string;
  kpiDateTo?: string;
}

/** Overview KPI card whose employers are shown in the drill-down list. */
export type OperationsEmployerOverviewKpi =
  | "total"
  | "new"
  | "verified"
  | "active"
  | "hiring";

export interface OperationsEmployerDocumentItem {
  id: string;
  documentType: string;
  documentTypeLabel: string;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: string;
  uploadedAt: string;
}

export interface OperationsEmployerJobItem {
  id: string;
  jobId: string;
  jobTitle: string;
  businessCategory: string;
  jobType: string;
  workMode: string;
  city: string;
  state: string;
  salary: string;
  status: string;
  statusLabel: string;
  applicationsCount: number;
  createdAt: string;
}

export interface OperationsEmployerJobsResult {
  jobs: OperationsEmployerJobItem[];
  pagination: OperationsEmployersPagination;
}

export const OPERATIONS_EMPLOYER_ACTIVITY_CATEGORIES = [
  "account",
  "profile",
  "verification",
  "job",
  "application",
  "interview",
  "offer",
  "candidate",
  "team",
  "operations",
] as const;

export type OperationsEmployerActivityCategory =
  (typeof OPERATIONS_EMPLOYER_ACTIVITY_CATEGORIES)[number];

export type OperationsEmployerActivityActor =
  | "employer"
  | "candidate"
  | "operations"
  | "system";

export interface OperationsEmployerActivityEvent {
  id: string;
  type: string;
  category: OperationsEmployerActivityCategory;
  title: string;
  description: string;
  at: string;
  actor: OperationsEmployerActivityActor;
  actorName: string;
  publicJobId: string;
  jobTitle: string;
  applicationId: string | null;
  /** Job seeker id; only set on candidate events the user may see. */
  candidateId: string | null;
  candidateDisplayId: string;
  candidateName: string;
}

export interface OperationsEmployerJourneyStage {
  id: string;
  label: string;
  state: "done" | "current" | "pending";
  at: string | null;
  detail: string;
}

export interface OperationsEmployerActivitySummary {
  jobs: number;
  draftJobs: number;
  liveJobs: number;
  pendingJobs: number;
  closedJobs: number;
  applications: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  savedCandidates: number;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
}

export interface OperationsEmployerActivityPageInfo {
  limit: number;
  /** Total events for the selected category across all pages. */
  total: number;
  hasMore: boolean;
  /** Opaque cursor for the next (older) page; null on the last page. */
  nextCursor: string | null;
}

export interface OperationsEmployerActivityResult {
  journey: OperationsEmployerJourneyStage[];
  summary: OperationsEmployerActivitySummary;
  applicationsRestricted: boolean;
  jobsRestricted: boolean;
  documentsRestricted: boolean;
  categoryCounts: Record<"all" | OperationsEmployerActivityCategory, number>;
  events: OperationsEmployerActivityEvent[];
  pageInfo: OperationsEmployerActivityPageInfo;
}

export interface OperationsEmployerActivityParams {
  limit: number;
  category: "all" | OperationsEmployerActivityCategory;
  /** Empty for the newest page. */
  cursor: string;
}

export interface OperationsEmployerDetail extends OperationsEmployerListItem {
  industry: string;
  businessCategory: string;
  companyDescription: string;
  website: string;
  foundedYear: number | null;
  companyType: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyAddress: string;
  pincode: string;
  contactPersonName: string;
  contactDesignation: string;
  alternatePhone: string;
  aboutUs: string;
  culture: string;
  benefits: string;
  vision: string;
  mission: string;
  values: string;
  socialLinks: {
    linkedin: string;
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  lastLoginAt: string | null;
  documents: OperationsEmployerDocumentItem[];
  analytics: {
    totalJobs: number;
    activeJobs: number;
    pendingJobs: number;
    draftJobs: number;
    closedJobs: number;
    totalApplications: number;
    shortlistedApplications: number;
    hiredApplications: number;
  };
  verificationRemarks: string;
  verificationSubmittedAt: string | null;
  rejectedAt: string | null;
  verifiedByLabel: string;
  rejectedByLabel: string;
  suspensionReason: string;
}

export interface UpdateOperationsEmployerVerificationInput {
  verificationStatus: "verified" | "pending" | "rejected";
  remarks?: string;
}

export interface UpdateOperationsEmployerStatusInput {
  status: "active" | "suspended" | "inactive";
  reason?: string;
}

export type OperationsEmployersAnalyticsPreset =
  | "all"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

export interface OperationsEmployersAnalyticsParams {
  preset: OperationsEmployersAnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationsEmployersAnalyticsRange {
  preset: OperationsEmployersAnalyticsPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  granularity: "day" | "week" | "month";
}

export interface OperationsEmployersOverviewKpis {
  totalEmployers: number;
  totalEmployersTrendPercent: number | null;
  totalEmployersCaption: string;
  newRegistrations: number;
  newRegistrationsTrendPercent: number | null;
  newRegistrationsCaption: string;
  verifiedEmployers: number;
  verifiedEmployersTrendPercent: number | null;
  verifiedEmployersPercent: number | null;
  verifiedEmployersCaption: string;
  activeEmployers: number;
  activeEmployersTrendPercent: number | null;
  activeEmployersCaption: string;
  employersHiring: number;
  employersHiringTrendPercent: number | null;
  employersHiringCaption: string;
}

export interface OperationsEmployersAnalyticsSeriesPoint {
  date: string;
  label: string;
  newRegistrations: number;
  verifiedEmployers: number;
}

export interface OperationsEmployersAnalyticsNamedCount {
  id: string;
  label: string;
  count: number;
  percent: number | null;
}

export interface OperationsEmployersAnalyticsFunnelStage {
  id: string;
  label: string;
  count: number;
  percent: number;
}

export interface OperationsEmployersAnalyticsTabs {
  all: number;
  new: number;
  verificationPending: number;
  active: number;
  inactive: number;
}

export type OperationsEmployersOverviewTab =
  keyof OperationsEmployersAnalyticsTabs;

export interface OperationsEmployersAnalyticsResult {
  range: OperationsEmployersAnalyticsRange;
  kpis: OperationsEmployersOverviewKpis;
  registrationTrend: OperationsEmployersAnalyticsSeriesPoint[];
  onboardingFunnel: OperationsEmployersAnalyticsFunnelStage[];
  byAccountType: OperationsEmployersAnalyticsNamedCount[];
  byLocation: OperationsEmployersAnalyticsNamedCount[];
  employerType: OperationsEmployersAnalyticsNamedCount[];
  employerTypeTotal: number;
  topHiringLocations: OperationsEmployersAnalyticsNamedCount[];
  tabs: OperationsEmployersAnalyticsTabs;
  comparisons: {
    newRegistrationsPrevious: number;
    newRegistrationsChangePercent: number | null;
  };
}

export interface RegisterOperationsEmployerInput {
  accountType: "company" | "consultancy" | "individual";
  companyName: string;
  establishmentName?: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;
  whatsappNumber: string;
}

export interface CompleteOperationsEmployerInput {
  accountType: "company" | "consultancy" | "individual";
  companyName: string;
  establishmentName: string;
  industry: string;
  businessCategory: string;
  minimumEmployees: number | null;
  maximumEmployees: number | null;
  companyAddress: string;
  pincode: string;
  city: string;
  state: string;
  documentType: string;
}

export interface OperationsEmployerOtpDelivery {
  employerId: string;
  otpExpiresAt: string;
  expiresIn: number;
  resendAvailableIn: number;
}

export interface OperationsEmployersExportParams {
  search?: string;
  verificationStatus?: string;
  verificationQueue?: string;
  employerType?: string;
  location?: string;
  status?: string;
  datePreset?: OperationsEmployerDatePreset;
  dateFrom?: string;
  dateTo?: string;
  analyticsPreset?: OperationsEmployerDatePreset;
  analyticsFrom?: string;
  analyticsTo?: string;
  /** Defaults to xlsx on the server. Pass "csv" for UTF-8 BOM CSV. */
  format?: "xlsx" | "csv";
}
