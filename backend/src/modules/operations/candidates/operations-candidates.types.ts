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

export type OperationsCandidateProfileStatus = "complete" | "incomplete";

export type OperationsCandidateEducation = {
  level: string;
  levelLabel: string;
  schoolName: string;
  collegeName: string;
  instituteName: string;
  board: string;
  stream: string;
  trade: string;
  branch: string;
  degree: string;
  specialization: string;
  passingYear: string;
  percentage: string;
  cgpa: string;
} | null;

export type OperationsCandidateExperienceEntry = {
  companyName: string;
  jobRole: string;
  industry: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  duration: string;
  salary: string;
  location: string;
  responsibilities: string;
  achievements: string;
};

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
  preferredRoles: string[];
  applicationCount: number;
  profileStatus: OperationsCandidateProfileStatus;
  profileStatusLabel: string;
  registrationStatus: string;
  lastActiveAt: string | null;
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
  newCandidatesToday: number;
  newThisWeek: number;
  newThisWeekChangePercent: number | null;
  activeCandidates: number;
  withApplications: number;
  withApplicationsPercent: number | null;
  withoutApplications: number;
  withoutApplicationsPercent: number | null;
  shortlisted: number;
  hired: number;
  /** @deprecated Kept for backward compatibility with older clients. */
  activeApplications: number;
  shortlistedPercent: number | null;
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
  withApplications: number;
  profilesIncomplete: number;
  recentlyActive: number;
  /** @deprecated Prefer withApplications. */
  applicationsReceived: number;
};

export type OperationsCandidatesFilterOptions = {
  jobs: Array<{ value: string; label: string }>;
  employers: Array<{ value: string; label: string }>;
  locations: string[];
  experienceLevels: string[];
  genders: string[];
  preferredRoles: string[];
  profileStatuses: Array<{ value: OperationsCandidateProfileStatus; label: string }>;
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

export type OperationsCandidateApplicationItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerVerified: boolean;
  status: ApplicationStatus | string;
  statusLabel: string;
  appliedAt: string | null;
  updatedAt: string | null;
};

export type OperationsCandidateApplicationsResult = {
  applications: OperationsCandidateApplicationItem[];
  pagination: ListPagination;
};

export type OperationsCandidateDetail = OperationsCandidateListItem & {
  candidateCity: string;
  candidateState: string;
  candidatePincode: string;
  dateOfBirth: string | null;
  skills: string[];
  professionalSummary: string;
  education: OperationsCandidateEducation;
  experiences: OperationsCandidateExperienceEntry[];
  languages: string[];
  preferredLocations: string[];
  jobType: string;
  workMode: string;
  expectedSalary: number | null;
  expectedSalaryPeriod: string;
  availabilityStatus: string;
  availabilityLabel: string;
  willingToTravel: string | null;
  willingToRelocate: string | null;
  workShiftPreference: string | null;
  profileCompletionPercent: number;
  applicationCount: number;
  shortlistedCount: number;
  uploadedResumeUrl: string;
  uploadedResumeName: string;
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
  notesCount: number;
};
