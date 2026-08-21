import type { JobListingPaymentStatus, JobStatus } from "../../../constants/job.constants.js";
import type { ListPagination } from "../../../utils/pagination.js";
import type { OPERATIONS_JOB_TABS } from "./operations-jobs.validation.js";

export type OperationsJobTab = (typeof OPERATIONS_JOB_TABS)[number];

export type OperationsJobEmployerSummary = {
  id: string;
  companyName: string;
  logoUrl: string;
  isWhatsappVerified: boolean;
  registrationCompleted: boolean;
};

export type OperationsJobListItem = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobType: string;
  isFeatured: boolean;
  status: JobStatus;
  statusLabel: string;
  listingPaymentStatus: JobListingPaymentStatus;
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
  employer: OperationsJobEmployerSummary;
};

export type OperationsJobsKpis = {
  totalJobs: number;
  activeJobs: number;
  pendingPaymentJobs: number;
  liveJobs: number;
  expiredJobs: number;
  draftJobs: number;
};

export type OperationsJobsTabCounts = {
  all: number;
  live: number;
  pending_payment: number;
  expired: number;
  drafts: number;
};

export type OperationsJobsInsight = {
  id: string;
  label: string;
  count: number;
  tab: OperationsJobTab | "paused_inactive";
};

export type OperationsJobsFilterOptions = {
  categories: string[];
  locations: string[];
};

export type OperationsJobsListResult = {
  kpis: OperationsJobsKpis;
  counts: OperationsJobsTabCounts;
  insights: OperationsJobsInsight[];
  filterOptions: OperationsJobsFilterOptions;
  jobs: OperationsJobListItem[];
  pagination: ListPagination;
};
