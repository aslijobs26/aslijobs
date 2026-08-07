import type {
  APPLICATION_HISTORY_ACTORS,
  APPLICATION_INTERVIEW_MODES,
  APPLICATION_STATUSES,
} from "./application.constants.js";
import type { ResumeJson, ResumeStatus } from "../resumes/resume.types.js";
import type { EmployerAvailabilityFilter } from "./employer-availability-filter.js";

export type { EmployerAvailabilityFilter };

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ApplicationHistoryActor =
  (typeof APPLICATION_HISTORY_ACTORS)[number];

export type ApplicationInterviewMode =
  (typeof APPLICATION_INTERVIEW_MODES)[number];

export type ApplicationStatusHistoryEntry = {
  status: ApplicationStatus;
  at: string;
  actorType: ApplicationHistoryActor;
  remark: string;
};

export type ApplicationInterview = {
  date: string;
  time: string;
  mode: ApplicationInterviewMode | "";
  meetingLink: string;
  venue: string;
  instructions: string;
  interviewerName: string;
  interviewerDesignation: string;
  interviewerEmail: string;
  interviewerPhone: string;
  /** ISO timestamp when cancelled; null/empty when active. */
  cancelledAt: string | null;
  cancellationReason: string;
  cancelledByName: string;
};

export type ApplicationOffer = {
  offerDate: string;
  joiningDate: string;
  packageText: string;
  notes: string;
};

export type ApplicationResumeSnapshot = {
  resumeJson: ResumeJson;
  templateId: string;
  templateVersion: string;
  versionNumber: number;
  profileCompletionPercent: number;
  generatedAt: string | null;
  status: ResumeStatus;
};

export type ApplyToJobInput = {
  jobSeekerId: string;
  publicJobId: string;
};

export type PublicApplicationSummary = {
  id: string;
  publicJobId: string;
  resumeVersion: number;
  appliedAt: string;
  status: ApplicationStatus;
};

export type EmployerApplicationListItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidatePhone: string;
  candidateExperienceLabel: string;
  candidateSkills: string[];
  candidateAvailability: string;
  candidateAvailabilityStatus: string | null;
  status: ApplicationStatus;
  resumeVersion: number;
  resumeStatus: ResumeStatus | string;
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

export type EmployerInterviewListItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  jobLocation: string;
  status: ApplicationStatus;
  wasRescheduled: boolean;
  isCancelled: boolean;
  cancellationReason: string;
  cancelledAt: string | null;
  candidateName: string;
  candidatePhone: string;
  interviewDate: string;
  interviewTime: string;
  interviewMode: ApplicationInterviewMode | "";
  interviewerName: string;
  interviewerDesignation: string;
  meetingLink: string;
  venue: string;
  appliedAt: string;
  updatedAt: string | null;
};

export type EmployerInterviewStats = {
  total: number;
  today: number;
  thisWeek: number;
  scheduled: number;
  completed: number;
  rescheduled: number;
  byMode: {
    online: number;
    offline: number;
    phone: number;
  };
};

export type EmployerInterviewStatusOverviewKey =
  | "scheduled"
  | "completed"
  | "rescheduled"
  | "cancelled";

export type EmployerInterviewStatusOverviewItem = {
  key: EmployerInterviewStatusOverviewKey;
  label: string;
  count: number;
  percentage: number;
};

export type EmployerInterviewStatusOverview = {
  total: number;
  period: string;
  statuses: EmployerInterviewStatusOverviewItem[];
};

export type EmployerInterviewJobTab = {
  publicJobId: string;
  jobTitle: string;
  count: number;
};

export type ApplicationShortlistNextAction =
  | "none"
  | "schedule_interview"
  | "send_message"
  | "call_candidate";

export type ApplicationShortlistDetails = {
  priority: "high" | "medium" | "low" | null;
  tags: string[];
  notes: string;
  nextAction: ApplicationShortlistNextAction;
  shortlistedAt: string | null;
  shortlistedByName: string | null;
};

export type ApplicationSavedCandidatePrefill = {
  id: string;
  priority: "high" | "medium" | "low" | null;
  tags: string[];
  notes: string;
};

export type EmployerApplicationDetail = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  resumeVersion: number;
  resumeStatus: ResumeStatus | string;
  resumeSnapshot: ApplicationResumeSnapshot;
  employerNotes: string;
  employerNotesVisibleToSeeker: boolean;
  employerNotesCreatedAt: string | null;
  employerNotesUpdatedAt: string | null;
  employerNotesUpdatedByName: string | null;
  rejectReason: string;
  interview: ApplicationInterview;
  offer: ApplicationOffer;
  shortlist: ApplicationShortlistDetails | null;
  savedCandidate: ApplicationSavedCandidatePrefill | null;
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
    experienceLabel: string;
    availability: string;
    availabilityStatus: string | null;
    /** Preferred job location from Job Seeker registration (not resume). */
    preferredJobLocation: string | null;
    languages: string[];
    expectedSalary: number | null;
    expectedSalaryPeriod: string | null;
    dateOfBirth: string | null;
  };
};

export type SeekerApplicationListItem = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  location: string;
  salaryLabel: string;
  /** Midpoint / fixed salary for client sorting; null when undisclosed. */
  salarySortValue: number | null;
  workMode: string;
  jobType: string;
  /** Part-time schedule label when available (e.g. fixed timings). */
  shiftLabel: string;
  interviewDate: string;
  interviewTime: string;
  canWithdraw: boolean;
  status: ApplicationStatus;
  resumeVersion: number;
  appliedAt: string;
  lastStatusUpdatedAt: string | null;
};

export type SeekerApplicationStats = {
  applied: number;
  underReview: number;
  shortlisted: number;
  interview: number;
  offer: number;
  selected: number;
  rejected: number;
  joined: number;
  withdrawn: number;
};

export type SeekerApplicationDetail = {
  id: string;
  publicJobId: string;
  jobTitle: string;
  companyName: string;
  companyLogoUrl: string;
  location: string;
  salaryLabel: string;
  workMode: string;
  jobType: string;
  status: ApplicationStatus;
  resumeVersion: number;
  resumeSnapshot: ApplicationResumeSnapshot;
  statusHistory: ApplicationStatusHistoryEntry[];
  interview: ApplicationInterview | null;
  offer: ApplicationOffer | null;
  rejectReason: string;
  employerNotes: string | null;
  appliedAt: string;
  canWithdraw: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
