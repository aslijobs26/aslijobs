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

/**
 * Allowed next statuses per current status.
 * `interview_scheduled` is shown in the UI to open the schedule form; direct status update is blocked.
 */
const EMPLOYER_ALLOWED_TRANSITIONS: Record<
  EmployerApplicationStatus,
  readonly EmployerApplicationStatus[]
> = {
  submitted: [
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  viewed: [
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  under_review: [
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  shortlisted: ["interview_scheduled", "rejected", "withdrawn"],
  interview_scheduled: ["interview_completed", "rejected", "withdrawn"],
  interview_completed: ["offer_sent", "rejected", "withdrawn"],
  offer_sent: ["selected", "joined", "rejected", "withdrawn"],
  selected: ["joined", "rejected", "withdrawn"],
  joined: [],
  rejected: [],
  withdrawn: [],
};

export function isEmployerTerminalStatus(
  status: string,
): status is (typeof EMPLOYER_TERMINAL_STATUSES)[number] {
  return (EMPLOYER_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** True when status is Shortlisted or any later hiring-pipeline stage. */
export function isEmployerShortlistedOrLaterStatus(status: string): boolean {
  const shortlistedIndex = EMPLOYER_FORWARD_PIPELINE.indexOf("shortlisted");
  const statusIndex = (
    EMPLOYER_FORWARD_PIPELINE as readonly string[]
  ).indexOf(status);
  return statusIndex >= shortlistedIndex;
}

export function hasRequiredInterviewDetails(
  interview: ApplicationInterview | null | undefined,
): boolean {
  if (!interview) {
    return false;
  }
  return Boolean(
    interview.date?.trim() &&
      interview.time?.trim() &&
      interview.mode &&
      interview.interviewerName?.trim(),
  );
}

export function hasRequiredOfferDetails(
  offer: ApplicationOffer | null | undefined,
): boolean {
  if (!offer) {
    return false;
  }
  return Boolean(
    offer.offerDate?.trim() &&
      offer.joiningDate?.trim() &&
      offer.packageText?.trim(),
  );
}

export function getAllowedEmployerStatusTransitions(
  current: EmployerApplicationStatus,
): EmployerApplicationStatus[] {
  if (isEmployerTerminalStatus(current)) {
    return [];
  }
  return [...(EMPLOYER_ALLOWED_TRANSITIONS[current] ?? [])];
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

export type ApplicationShortlistNextAction =
  | "none"
  | "schedule_interview"
  | "send_message"
  | "call_candidate";

export type ApplicationShortlistDetails = {
  priority: "high" | "medium" | "low";
  tags: string[];
  notes: string;
  nextAction: ApplicationShortlistNextAction;
  shortlistedAt: string | null;
  shortlistedByName: string | null;
};

export type ApplicationSavedCandidatePrefill = {
  id: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  notes: string;
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
  employerNotesCreatedAt?: string | null;
  employerNotesUpdatedAt?: string | null;
  employerNotesUpdatedByName?: string | null;
  rejectReason: string;
  interview: ApplicationInterview;
  offer: ApplicationOffer;
  shortlist?: ApplicationShortlistDetails | null;
  savedCandidate?: ApplicationSavedCandidatePrefill | null;
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

export type ShortlistCandidatePayload = {
  priority: "high" | "medium" | "low";
  tags: string[];
  notes: string;
  nextAction: ApplicationShortlistNextAction;
  alsoSave: boolean;
};

export type ShortlistCandidateResult = {
  application: EmployerApplicationDetail;
  saved: boolean;
  nextAction: ApplicationShortlistNextAction;
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
