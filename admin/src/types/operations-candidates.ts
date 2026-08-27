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

export type OperationsCandidateProfileStatus = "complete" | "incomplete";

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

export interface OperationsCandidateEducation {
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
}

export interface OperationsCandidateExperienceEntry {
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
}

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
  status: OperationsApplicationStatus | null;
  statusLabel: string;
  appliedAt: string | null;
  registeredAt: string | null;
  hasApplication: boolean;
}

export interface OperationsCandidatesKpis {
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
  activeApplications: number;
  shortlistedPercent: number | null;
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
  withApplications: number;
  profilesIncomplete: number;
  recentlyActive: number;
  applicationsReceived: number;
}

export interface OperationsCandidatesFilterOptions {
  jobs: Array<{ value: string; label: string }>;
  employers: Array<{ value: string; label: string }>;
  locations: string[];
  experienceLevels: string[];
  genders: string[];
  preferredRoles: string[];
  profileStatuses: Array<{
    value: OperationsCandidateProfileStatus;
    label: string;
  }>;
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
  preferredRole: string;
  profileStatus: "" | OperationsCandidateProfileStatus;
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
  dateField: OperationsCandidateDateField;
  analyticsPreset: OperationsCandidateDatePreset;
  analyticsFrom: string;
  analyticsTo: string;
}

export interface OperationsCandidateApplicationItem {
  id: string;
  publicJobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  employerVerified: boolean;
  status: OperationsApplicationStatus | string;
  statusLabel: string;
  appliedAt: string | null;
  updatedAt: string | null;
}

export interface OperationsCandidateApplicationsResult {
  applications: OperationsCandidateApplicationItem[];
  pagination: OperationsCandidatesPagination;
}

export interface OperationsCandidateDetail extends OperationsCandidateListItem {
  candidateCity: string;
  candidateState: string;
  candidatePincode: string;
  dateOfBirth: string | null;
  skills: string[];
  professionalSummary: string;
  education: OperationsCandidateEducation | null;
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
}
