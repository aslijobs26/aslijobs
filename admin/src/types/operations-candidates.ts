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
  displayId?: string;
  candidateName?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  candidateHeadline: string;
  candidateExperienceLabel: string;
  candidateLocation?: string;
  candidateSkills: string[];
  candidateGender: string;
  profilePhotoUrl: string;
  preferredRoles: string[];
  applicationCount: number;
  profileStatus: OperationsCandidateProfileStatus;
  profileStatusLabel: string;
  registrationStatus: string;
  isWhatsappVerified?: boolean;
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
  /** True when registration awareness state is still "new". */
  isNewRegistration?: boolean;
  registrationAwarenessState?: "new" | "seen" | null;
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
  genders: Array<{ value: string; label: string }>;
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
  overviewTab?: string;
  verificationStatus?: string;
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
  applicationPresence?: "" | "has" | "none";
  datePreset: OperationsCandidateDatePreset;
  dateFrom: string;
  dateTo: string;
  dateField: OperationsCandidateDateField;
  analyticsPreset: OperationsCandidateDatePreset;
  analyticsFrom: string;
  analyticsTo: string;
}

export interface OperationsCandidatesExportParams {
  overviewTab?: string;
  verificationStatus?: string;
  search?: string;
  location?: string;
  experience?: string;
  gender?: string;
  preferredRole?: string;
  profileStatus?: "" | OperationsCandidateProfileStatus;
  applicationPresence?: "" | "has" | "none";
  datePreset?: OperationsCandidateDatePreset;
  dateFrom?: string;
  dateTo?: string;
  format?: "xlsx" | "csv";
}

export type OperationsCandidatesAnalyticsPreset =
  | "all"
  | "last_7_days"
  | "last_30_days"
  | "last_3_months"
  | "custom";

export interface OperationsCandidatesAnalyticsParams {
  preset: OperationsCandidatesAnalyticsPreset;
  dateFrom?: string;
  dateTo?: string;
}

export interface OperationsCandidatesAnalyticsRange {
  preset: OperationsCandidatesAnalyticsPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  granularity: "day" | "week" | "month";
}

export interface OperationsCandidatesOverviewKpis {
  totalJobseekers: number;
  totalJobseekersTrendPercent: number | null;
  totalJobseekersCaption: string;
  newRegistrations: number;
  newRegistrationsTrendPercent: number | null;
  newRegistrationsCaption: string;
  profileCompleted: number;
  profileCompletedTrendPercent: number | null;
  profileCompletedPercent: number | null;
  profileCompletedCaption: string;
  verifiedJobseekers: number;
  verifiedJobseekersTrendPercent: number | null;
  verifiedJobseekersPercent: number | null;
  verifiedJobseekersCaption: string;
  activeJobseekers: number;
  activeJobseekersTrendPercent: number | null;
  activeJobseekersCaption: string;
}

export interface OperationsCandidatesAnalyticsSeriesPoint {
  date: string;
  label: string;
  newRegistrations: number;
  profileCompleted: number;
}

export interface OperationsCandidatesAnalyticsNamedCount {
  id: string;
  label: string;
  count: number;
  percent: number | null;
}

export interface OperationsCandidatesAnalyticsFunnelStage {
  id: string;
  label: string;
  count: number;
  percent: number;
}

export interface OperationsCandidatesAnalyticsTabs {
  all: number;
  new: number;
  profileIncomplete: number;
  verificationPending: number;
}

export type OperationsCandidatesOverviewTab =
  keyof OperationsCandidatesAnalyticsTabs;

export interface OperationsCandidatesAnalyticsResult {
  range: OperationsCandidatesAnalyticsRange;
  kpis: OperationsCandidatesOverviewKpis;
  registrationTrend: OperationsCandidatesAnalyticsSeriesPoint[];
  onboardingFunnel: OperationsCandidatesAnalyticsFunnelStage[];
  byLocation: OperationsCandidatesAnalyticsNamedCount[];
  byCity: OperationsCandidatesAnalyticsNamedCount[];
  byLanguage: OperationsCandidatesAnalyticsNamedCount[];
  languageTotal: number;
  byExperience: OperationsCandidatesAnalyticsNamedCount[];
  topJobCategories: OperationsCandidatesAnalyticsNamedCount[];
  tabs: OperationsCandidatesAnalyticsTabs;
  comparisons: {
    newRegistrationsPrevious: number;
    newRegistrationsChangePercent: number | null;
  };
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
  candidateCity?: string;
  candidateState?: string;
  candidatePincode?: string;
  dateOfBirth?: string | null;
  skills: string[];
  professionalSummary: string;
  education: OperationsCandidateEducation | null;
  experiences: OperationsCandidateExperienceEntry[];
  languages: string[];
  preferredLocations: string[];
  jobType: string;
  workMode: string;
  expectedSalary?: number | null;
  expectedSalaryPeriod?: string;
  availabilityStatus: string;
  availabilityLabel: string;
  profileCompletionPercent: number;
  shortlistedCount: number;
  /** Always empty for clients — use authenticated resume download endpoint. */
  uploadedResumeUrl?: string;
  uploadedResumeName?: string;
  hasUploadedResume?: boolean;
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
