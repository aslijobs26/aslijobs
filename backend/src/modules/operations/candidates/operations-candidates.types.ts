import type { ListPagination } from "../../../utils/pagination.js";
import type { ApplicationStatus } from "../../applications/application.types.js";
import type { OPERATIONS_CANDIDATE_TABS } from "./operations-candidates.validation.js";

export type OperationsCandidateTab = (typeof OPERATIONS_CANDIDATE_TABS)[number];

export type OperationsCandidateDatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export type OperationsCandidateListItem = {
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
  status: ApplicationStatus | null;
  statusLabel: string;
  appliedAt: string | null;
  registeredAt: string | null;
  hasApplication: boolean;
};

export type OperationsCandidatesKpis = {
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
};

export type OperationsCandidatesTabCounts = {
  all: number;
  applied: number;
  under_review: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

export type OperationsCandidatesInsight = {
  id: string;
  label: string;
  count: number;
  tab?: OperationsCandidateTab;
  datePreset?: OperationsCandidateDatePreset;
};

export type OperationsCandidatesPeriodStats = {
  preset: OperationsCandidateDatePreset;
  from: string | null;
  to: string | null;
  candidatesRegistered: number;
  applicationsReceived: number;
};

export type OperationsCandidatesFilterOptions = {
  jobs: Array<{ value: string; label: string }>;
  employers: Array<{ value: string; label: string }>;
  locations: string[];
  experienceLevels: string[];
  genders: string[];
};

export type OperationsCandidatesListResult = {
  kpis: OperationsCandidatesKpis;
  counts: OperationsCandidatesTabCounts;
  insights: OperationsCandidatesInsight[];
  periodStats: OperationsCandidatesPeriodStats;
  filterOptions: OperationsCandidatesFilterOptions;
  applications: OperationsCandidateListItem[];
  pagination: ListPagination;
};

export type OperationsCandidateDetail = OperationsCandidateListItem & {
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
};
