export type OperationsCandidateTab =
  | "all"
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";

export type OperationsCandidateDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export type OperationsCandidateDateField = "applied" | "registered";

export type OperationsApplicationStatus =
  | "submitted"
  | "viewed"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_sent"
  | "selected"
  | "joined"
  | "rejected"
  | "withdrawn";

export interface OperationsCandidateListItem {
  id: string;
  applicationId: string | null;
  jobSeekerId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateHeadline: string;
  candidateExperienceLabel: string;
  candidateLocation: string;
  candidateSkills: string[];
  candidateGender: string;
  profilePhotoUrl: string;
  publicJobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerLogoUrl: string;
  employerVerified: boolean;
  status: OperationsApplicationStatus | null;
  statusLabel: string;
  appliedAt: string | null;
  registeredAt: string | null;
  hasApplication: boolean;
}

export interface OperationsCandidatesKpis {
  totalCandidates: number;
  newThisWeek: number;
  newThisWeekChangePercent: number | null;
  activeApplications: number;
  shortlisted: number;
  shortlistedPercent: number | null;
  hired: number;
  hiredPercent: number | null;
  rejected: number;
  rejectedPercent: number | null;
}

export interface OperationsCandidatesTabCounts {
  all: number;
  applied: number;
  under_review: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
}

export interface OperationsCandidatesInsight {
  id: string;
  label: string;
  count: number;
  tab?: OperationsCandidateTab;
  datePreset?: OperationsCandidateDatePreset;
}

export interface OperationsCandidatesPeriodStats {
  preset: OperationsCandidateDatePreset;
  from: string | null;
  to: string | null;
  candidatesRegistered: number;
  applicationsReceived: number;
}

export interface OperationsCandidatesFilterOptions {
  jobs: Array<{ value: string; label: string }>;
  employers: Array<{ value: string; label: string }>;
  locations: string[];
  experienceLevels: string[];
  genders: string[];
}

export interface OperationsCandidatesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface OperationsCandidatesListResult {
  kpis: OperationsCandidatesKpis;
  counts: OperationsCandidatesTabCounts;
  insights: OperationsCandidatesInsight[];
  periodStats: OperationsCandidatesPeriodStats;
  filterOptions: OperationsCandidatesFilterOptions;
  applications: OperationsCandidateListItem[];
  pagination: OperationsCandidatesPagination;
}

export interface OperationsCandidatesListParams {
  page: number;
  limit: number;
  tab: OperationsCandidateTab;
  search: string;
  status: "" | OperationsApplicationStatus;
  jobId: string;
  employerId: string;
  location: string;
  experience: string;
  gender: string;
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
  dateField: OperationsCandidateDateField;
}

export interface OperationsCandidateDetail extends OperationsCandidateListItem {
  candidateCity: string;
  candidateState: string;
  skills: string[];
  jobCompanyName: string;
  resumeVersion: number;
  resumeStatus: string;
  statusHistory: Array<{
    status: string;
    statusLabel: string;
    at: string;
    actor: string;
  }>;
  descriptionExcerpt: string;
}
