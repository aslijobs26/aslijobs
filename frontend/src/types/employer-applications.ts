import type { ResumeJson, ResumeStatus } from "@/types/job-seeker-resume";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUSES,
  type ApplicationInterview,
  type ApplicationOffer,
  type ApplicationStatus,
  type ApplicationStatusHistoryEntry,
} from "@/types/job-seeker-applications";

export const EMPLOYER_APPLICATION_STATUSES = APPLICATION_STATUSES;

export type EmployerApplicationStatus = ApplicationStatus;

export const EMPLOYER_APPLICATION_STATUS_LABELS = APPLICATION_STATUS_LABELS;

/** Ordered hiring stages (excludes terminal side-exits rejected/withdrawn). */
export const EMPLOYER_FORWARD_PIPELINE = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
] as const satisfies readonly EmployerApplicationStatus[];

export const EMPLOYER_TERMINAL_STATUSES = [
  "joined",
  "rejected",
  "withdrawn",
] as const satisfies readonly EmployerApplicationStatus[];

export function isEmployerTerminalStatus(
  status: string,
): status is (typeof EMPLOYER_TERMINAL_STATUSES)[number] {
  return (EMPLOYER_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function getAllowedEmployerStatusTransitions(
  current: EmployerApplicationStatus,
): EmployerApplicationStatus[] {
  if (isEmployerTerminalStatus(current)) {
    return [];
  }

  const currentIndex = (
    EMPLOYER_FORWARD_PIPELINE as readonly string[]
  ).indexOf(current);
  if (currentIndex < 0) {
    return [];
  }

  return [
    ...EMPLOYER_FORWARD_PIPELINE.slice(currentIndex + 1),
    "rejected",
    "withdrawn",
  ];
}

export const EMPLOYER_AVAILABILITY_FILTERS = [
  "immediate",
  "within_7",
  "within_15",
  "within_30",
  "currently_working",
] as const;

export type EmployerAvailabilityFilter =
  (typeof EMPLOYER_AVAILABILITY_FILTERS)[number];

export type EmployerAvailabilityFilterValue = EmployerAvailabilityFilter | "";

export const EMPLOYER_AVAILABILITY_FILTER_LABELS: Record<
  EmployerAvailabilityFilter,
  string
> = {
  immediate: "Immediately Available",
  within_7: "Within 7 Days",
  within_15: "Within 15 Days",
  within_30: "Within 30 Days",
  currently_working: "Currently Working",
};

export type ApplicationResumeSnapshot = {
  resumeJson: ResumeJson;
  templateId: string;
  templateVersion: string;
  versionNumber: number;
  profileCompletionPercent: number;
  generatedAt: string | null;
  status: ResumeStatus | string;
};

export type EmployerApplicationListItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidatePhone?: string;
  candidateExperienceLabel?: string;
  candidateSkills?: string[];
  candidateAvailability?: string;
  candidateAvailabilityStatus?: string | null;
  status: EmployerApplicationStatus;
  resumeVersion: number;
  resumeStatus: string;
  appliedAt: string;
  updatedAt: string | null;
};

export type EmployerApplicationStats = {
  total: number;
  submitted: number;
  viewed: number;
  under_review: number;
  shortlisted: number;
  interview_scheduled: number;
  interview_completed: number;
  offer_sent: number;
  selected: number;
  joined: number;
  rejected: number;
  withdrawn: number;
};

export type EmployerApplicationsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type EmployerApplicationDetail = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  status: EmployerApplicationStatus;
  resumeVersion: number;
  resumeStatus: string;
  resumeSnapshot: ApplicationResumeSnapshot;
  employerNotes: string;
  employerNotesVisibleToSeeker: boolean;
  rejectReason: string;
  interview: ApplicationInterview;
  offer: ApplicationOffer;
  statusHistory: ApplicationStatusHistoryEntry[];
  appliedAt: string;
  viewedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  candidate: {
    fullName: string;
    phone: string;
    city: string;
    state: string;
    headline: string;
    experienceLabel?: string;
    availability?: string;
    availabilityStatus?: string | null;
    preferredJobLocation?: string | null;
    languages?: string[];
    expectedSalary?: number | null;
    expectedSalaryPeriod?: string | null;
    dateOfBirth?: string | null;
  };
};

export type EmployerHiringUpdatePayload = {
  status?: EmployerApplicationStatus;
  interview?: Partial<ApplicationInterview>;
  offer?: Partial<ApplicationOffer>;
  rejectReason?: string;
  employerNotesVisibleToSeeker?: boolean;
};

export type EmployerApplicationsListParams = {
  publicJobId?: string;
  status?: EmployerApplicationStatus;
  search?: string;
  sort?: "newest" | "oldest" | "updated";
  page?: number;
  limit?: number;
  location?: string;
  experience?: string;
  skills?: string;
  availability?: EmployerAvailabilityFilter;
  appliedFrom?: string;
  appliedTo?: string;
};

export const EMPLOYER_EXPORT_FORMATS = ["xlsx", "csv", "pdf"] as const;

export type EmployerExportFormat = (typeof EMPLOYER_EXPORT_FORMATS)[number];

export const EMPLOYER_EXPORT_FIELDS = [
  "candidateName",
  "phone",
  "appliedJob",
  "appliedDate",
  "status",
  "location",
  "experience",
  "resume",
] as const;

export type EmployerExportField = (typeof EMPLOYER_EXPORT_FIELDS)[number];

export const EMPLOYER_EXPORT_FIELD_LABELS: Record<EmployerExportField, string> =
  {
    candidateName: "Candidate Name",
    phone: "Phone Number",
    appliedJob: "Applied Job",
    appliedDate: "Applied Date",
    status: "Current Status",
    location: "Location",
    experience: "Experience",
    resume: "Resume",
  };

export const EMPLOYER_EXPORT_DEFAULT_FIELDS: EmployerExportField[] = [
  "candidateName",
  "phone",
  "appliedJob",
  "appliedDate",
  "status",
  "location",
  "experience",
  "resume",
];

export const EMPLOYER_EXPORT_FORMAT_LABELS: Record<EmployerExportFormat, string> =
  {
    xlsx: "Excel (.xlsx)",
    csv: "CSV (.csv)",
    pdf: "PDF (.pdf)",
  };

export const EMPLOYER_EXPORT_QUICK_DATE_FILTERS = [
  "all_time",
  "today",
  "yesterday",
  "last_7_days",
  "last_30_days",
  "this_month",
  "last_month",
  "custom",
] as const;

export type EmployerExportQuickDateFilter =
  (typeof EMPLOYER_EXPORT_QUICK_DATE_FILTERS)[number];

export const EMPLOYER_EXPORT_QUICK_DATE_LABELS: Record<
  EmployerExportQuickDateFilter,
  string
> = {
  all_time: "All Time",
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 Days",
  last_30_days: "Last 30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom Date Range",
};

export type EmployerApplicationsExportParams = {
  format: EmployerExportFormat;
  fields: EmployerExportField[];
  publicJobId?: string;
  status?: EmployerApplicationStatus;
  search?: string;
  location?: string;
  experience?: string;
  skills?: string;
  availability?: EmployerAvailabilityFilter | "";
  quickDateFilter?: EmployerExportQuickDateFilter;
  appliedFrom?: string;
  appliedTo?: string;
};
