export const VERIFICATIONS_ANALYTICS_PRESETS = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
] as const;

export type VerificationsAnalyticsPreset =
  (typeof VERIFICATIONS_ANALYTICS_PRESETS)[number];

export interface OperationsVerificationsAnalyticsQuery {
  preset: VerificationsAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
}

export interface OperationsVerificationsAnalyticsRange {
  preset: VerificationsAnalyticsPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  label: string;
  granularity: "day" | "week" | "month";
}

export interface OperationsVerificationsOverviewKpis {
  totalVerifications: number;
  totalVerificationsTrendPercent: number | null;
  totalVerificationsCaption: string;
  pendingReview: number;
  pendingReviewTrendPercent: number | null;
  pendingReviewCaption: string;
  pendingReviewPercentOfTotal: number | null;
  verifiedEmployers: number;
  verifiedEmployersTrendPercent: number | null;
  verifiedEmployersCaption: string;
  verifiedEmployersPercentOfTotal: number | null;
  needsAttention: number;
  needsAttentionTrendPercent: number | null;
  needsAttentionCaption: string;
  needsAttentionPercentOfTotal: number | null;
  rejected: number;
  rejectedTrendPercent: number | null;
  rejectedCaption: string;
  rejectedPercentOfTotal: number | null;
}

export interface OperationsVerificationsTabCounts {
  overview: number;
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  slaBreaches: number;
}

export interface OperationsVerificationsTrendPoint {
  date: string;
  label: string;
  submitted: number;
  verified: number;
  rejected: number;
}

export interface OperationsVerificationsStatusCount {
  key: string;
  label: string;
  count: number;
  percent: number | null;
}

export interface OperationsVerificationsNamedCount {
  key: string;
  label: string;
  count: number;
}

export interface OperationsVerificationsLocationAnalytics {
  states: OperationsVerificationsNamedCount[];
  topStates: OperationsVerificationsNamedCount[];
}

export interface OperationsVerificationsSlaMetrics {
  averageDays: number | null;
  averageDaysTrendPercent: number | null;
  withinSlaPercent: number | null;
  withinSlaTrendPercent: number | null;
  beyondSlaPercent: number | null;
  beyondSlaTrendPercent: number | null;
  targetDays: number;
}

export interface OperationsVerificationsAnalyticsResult {
  range: OperationsVerificationsAnalyticsRange;
  kpis: OperationsVerificationsOverviewKpis;
  tabs: OperationsVerificationsTabCounts;
  trend: OperationsVerificationsTrendPoint[];
  byStatus: OperationsVerificationsStatusCount[];
  documentsBreakdown: OperationsVerificationsNamedCount[];
  byIndustry: OperationsVerificationsNamedCount[];
  byLocation: OperationsVerificationsLocationAnalytics;
  sla: OperationsVerificationsSlaMetrics;
}

/** Operational UI status — derived; not a DB enum value. */
export type OperationsVerificationOperationalStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected"
  | "needs_attention"
  | "sla_breach";

export type OperationsVerificationListSort =
  | "submittedAt"
  | "companyName"
  | "status"
  | "sla";

export interface OperationsVerificationAllowedActions {
  canReview: boolean;
  canApprove: boolean;
  canReject: boolean;
  canRequestDocuments: boolean;
  canViewDocuments: boolean;
  canDownloadDocuments: boolean;
}

export interface OperationsVerificationListItem {
  id: string;
  displayId: string;
  companyName: string;
  displayName: string;
  industry: string;
  location: string;
  city: string;
  state: string;
  logoUrl: string;
  submittedAt: string | null;
  submittedAtDate: string;
  documentsCount: number;
  documentsApprovedCount: number;
  documentsLabel: string;
  verificationStatus: "pending" | "verified" | "rejected";
  operationalStatus: OperationsVerificationOperationalStatus;
  statusLabel: string;
  slaLabel: string;
  slaBreach: boolean;
  needsAttention: boolean;
  assignedToLabel: string;
  assignedToId: string | null;
  phone?: string;
  email?: string;
  accountType: string;
  allowedActions: OperationsVerificationAllowedActions;
}

export interface OperationsVerificationsFilterOptions {
  statuses: Array<{ value: string; label: string }>;
  industries: Array<{ value: string; label: string }>;
  locations: string[];
  slaOptions: Array<{ value: string; label: string }>;
}

export interface OperationsVerificationsListResult {
  items: OperationsVerificationListItem[];
  filterOptions: OperationsVerificationsFilterOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface OperationsVerificationDetail {
  id: string;
  displayId: string;
  companyName: string;
  displayName: string;
  establishmentName: string;
  accountType: string;
  organizationType: string;
  industry: string;
  location: string;
  city: string;
  state: string;
  logoUrl: string;
  phone?: string;
  email?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  operationalStatus: OperationsVerificationOperationalStatus;
  statusLabel: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  verificationRemarks: string;
  assignedToLabel: string;
  assignedToId: string | null;
  slaLabel: string;
  slaBreach: boolean;
  needsAttention: boolean;
  documentsCount: number;
  documentsApprovedCount: number;
  documentsLabel: string;
  documents: Array<{
    id: string;
    documentType: string;
    documentTypeLabel: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    verificationStatus: string;
    verificationStatusLabel: string;
    uploadedAt: string | null;
    url: string;
  }>;
  companyAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  website: string;
  companyDescription: string;
  contactPersonName?: string;
  allowedActions: OperationsVerificationAllowedActions;
}
