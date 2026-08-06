export type SavedJobsStatsFilter =
  | "all"
  | "recent"
  | "high_match"
  | "applied"
  | "expired";

export type SavedJobsSort =
  | "recently_saved"
  | "newest"
  | "oldest"
  | "salary_high"
  | "salary_low"
  | "company_az"
  | "highest_match";

export type SavedJobListItem = {
  id: string;
  publicJobId: string;
  jobMongoId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  isVerified: boolean;
  location: string;
  city: string;
  cityName: string;
  state: string;
  stateName: string;
  salaryLabel: string;
  salarySortValue: number | null;
  jobType: string;
  workMode: string;
  experience: string;
  experienceLabel: string;
  partTimeSchedule: string;
  shiftLabel: string;
  perks: string[];
  perkLabels: string[];
  matchPercent: number;
  isHighMatch: boolean;
  isApplied: boolean;
  isExpired: boolean;
  jobStatus: string;
  savedAt: string;
  publishedAt: string | null;
  createdAt: string;
};

export type SavedJobsStats = {
  total: number;
  recent: number;
  highMatch: number;
  applied: number;
  expired: number;
};

export type SavedJobsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/** Only fields backed by Job Posting schema / saved-jobs API. */
export type SavedJobsAdvancedFilters = {
  location: string;
  minSalary: string;
  maxSalary: string;
  jobType: string;
  workMode: string;
  schedule: string;
  experience: string;
  company: string;
  perk: string;
};
