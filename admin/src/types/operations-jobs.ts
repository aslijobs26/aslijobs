export type OperationsJobStatus =
  | "draft"
  | "active"
  | "paused"
  | "closed"
  | "expired";

export type OperationsJobPaymentStatus =
  | "pending"
  | "paid"
  | "unpaid"
  | "not_applicable";

export type OperationsJobTab =
  | "all"
  | "live"
  | "pending_payment"
  | "expired"
  | "drafts";

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
  cityName: string;
  stateName: string;
  locationLabel: string;
  publishedAt: string | null;
  createdAt: string;
  applications: number;
  applicationsToday: number;
  employer: OperationsJobEmployer;
}

export interface OperationsJobsKpis {
  totalJobs: number;
  activeJobs: number;
  pendingPaymentJobs: number;
  liveJobs: number;
  expiredJobs: number;
  draftJobs: number;
}

export interface OperationsJobsTabCounts {
  all: number;
  live: number;
  pending_payment: number;
  expired: number;
  drafts: number;
}

export interface OperationsJobsInsight {
  id: string;
  label: string;
  count: number;
  tab: OperationsJobTab | "paused_inactive";
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
  category: string;
  location: string;
}
