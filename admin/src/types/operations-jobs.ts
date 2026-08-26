export type OperationsJobStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "paused"
  | "closed"
  | "expired"
  | "rejected";

export type OperationsJobPaymentStatus =
  | "pending"
  | "paid"
  | "unpaid"
  | "not_applicable";

export type OperationsJobTab =
  | "all"
  | "pending_approval"
  | "live"
  | "paused"
  | "draft"
  | "expired"
  | "closed"
  | "rejected";

export type OperationsJobStatusAction =
  | "publish"
  | "pause"
  | "resume"
  | "close"
  | "expire"
  | "reactivate"
  | "approve"
  | "reject";

export interface OperationsJobEmployer {
  id: string;
  companyName: string;
  logoUrl: string;
  isWhatsappVerified: boolean;
  registrationCompleted: boolean;
}

export interface OperationsJobListItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobType: string;
  isFeatured: boolean;
  status: OperationsJobStatus;
  statusLabel: string;
  listingPaymentStatus: OperationsJobPaymentStatus;
  paymentStatusLabel: string;
  listingPackageLabel: string;
  listingValidUntil: string | null;
  businessCategory: string;
  vacancies: number;
  cityName: string;
  stateName: string;
  locationLabel: string;
  publishedAt: string | null;
  createdAt: string;
  submittedForApprovalAt: string | null;
  applications: number;
  applicationsToday: number;
  isLiveChangeReview: boolean;
  liveChangeReviewStatus: string;
  employer: OperationsJobEmployer;
}

export interface OperationsJobsKpis {
  totalJobs: number;
  activeJobs: number;
  pendingApprovalJobs: number;
  pendingPaymentJobs: number;
  liveJobs: number;
  expiredJobs: number;
  draftJobs: number;
}

export interface OperationsJobsTabCounts {
  all: number;
  pending_approval: number;
  live: number;
  paused: number;
  draft: number;
  expired: number;
  closed: number;
  rejected: number;
}

export interface OperationsJobsInsight {
  id: string;
  label: string;
  count: number;
  tab: OperationsJobTab | "paused_inactive" | "pending_payment";
}

export interface OperationsJobsFilterOptions {
  categories: string[];
  locations: string[];
}

export interface OperationsJobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OperationsJobsListResult {
  kpis: OperationsJobsKpis;
  counts: OperationsJobsTabCounts;
  insights: OperationsJobsInsight[];
  filterOptions: OperationsJobsFilterOptions;
  jobs: OperationsJobListItem[];
  pagination: OperationsJobsPagination;
}

export interface OperationsJobsListParams {
  page: number;
  limit: number;
  tab: OperationsJobTab;
  search: string;
  status: "" | OperationsJobStatus;
  paymentStatus: "" | OperationsJobPaymentStatus;
  location: string;
}

export interface OperationsJobAnalytics {
  views: number;
  applications: number;
  applicationRatePercent: number | null;
  shares: number;
  bookmarks: number;
  shortlisted: number;
  interviews: number;
  hired: number;
  applicationsToday: number;
  daysRemaining: number | null;
  autoExpiryAt: string | null;
}

export interface OperationsJobActivityItem {
  id: string;
  type: string;
  label: string;
  at: string;
}

export interface OperationsJobDetail {
  id: string;
  jobId: string;
  employerId: string;
  companyId: string;
  companyName: string;
  industry: string;
  businessCategory: string;
  companySize: string;
  jobTitle: string;
  jobType: string;
  contractPeriodFrom: string;
  contractPeriodTo: string;
  partTimeSchedule: string;
  partTimeStartTime: string;
  partTimeEndTime: string;
  partTimeFlexibleHours: string;
  workMode: string;
  vacancies: number;
  description: string;
  state: string;
  stateName: string;
  city: string;
  cityName: string;
  address: string;
  landmark: string;
  locationLabel: string;
  salaryType: string;
  salaryPeriod: string;
  fixedSalary: number | null;
  minimumSalary: number | null;
  maximumSalary: number | null;
  salaryLabel: string;
  perks: string[];
  education: string[];
  educationLabel: string;
  experience: string;
  experienceLabel: string;
  languages: string[];
  gender: string[];
  genderLabel: string;
  minimumAge: number | null;
  maximumAge: number | null;
  walkInEnabled: boolean;
  interviewAddress: string;
  walkInStartDate: string;
  walkInEndDate: string;
  walkInStartTime: string;
  walkInEndTime: string;
  interviewInstructions: string;
  contactPersonName: string;
  contactEmail: string;
  contactMobile: string;
  status: OperationsJobStatus;
  statusLabel: string;
  listingPaymentStatus: OperationsJobPaymentStatus;
  paymentStatusLabel: string;
  listingPackageLabel: string;
  listingValidUntil: string | null;
  isFeatured: boolean;
  visibilityLabel: string;
  jobTypeLabel: string;
  workModeLabel: string;
  completedStep: number;
  lastEditedAt: string | null;
  publishedAt: string | null;
  reactivatedAt: string | null;
  lastStatusChangedAt: string | null;
  closedReason: string;
  closedAt: string | null;
  employerNotified: boolean;
  submittedForApprovalAt: string | null;
  reviewDecision: string;
  reviewedAt: string | null;
  reviewedByOperationsUserId: string;
  reviewedByLabel: string;
  rejectionReason: string;
  reviewNotificationSent: boolean;
  pendingLiveRevision: unknown;
  liveChangeReviewStatus: string;
  liveChangeSubmittedAt: string | null;
  liveChangeReviewedAt: string | null;
  liveChangeReviewedByOperationsUserId: string;
  liveChangeRejectionReason: string;
  isLiveChangeReview: boolean;
  createdAt: string;
  updatedAt: string;
  wizardSnapshot: unknown;
  creationSource: "employer" | "operations";
  employerAssigned: boolean;
  employer: OperationsJobEmployer;
  analytics: OperationsJobAnalytics;
  activity: OperationsJobActivityItem[];
}

export interface OperationsJobApplicationItem {
  id: string;
  publicJobId: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidatePhone: string;
  candidateExperienceLabel: string;
  candidateSkills: string[];
  status: string;
  statusLabel: string;
  resumeVersion: number;
  resumeStatus: string;
  appliedAt: string;
  updatedAt: string | null;
  sourceLabel: string;
}

export interface OperationsJobApplicationsResult {
  applications: OperationsJobApplicationItem[];
  pagination: OperationsJobsPagination;
}

export interface OperationsJobApplicationsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}
