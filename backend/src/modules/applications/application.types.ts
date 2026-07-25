import type {
  APPLICATION_HISTORY_ACTORS,
  APPLICATION_INTERVIEW_MODES,
  APPLICATION_STATUSES,
} from "./application.constants.js";
import type { ResumeJson, ResumeStatus } from "../resumes/resume.types.js";

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
  status: ApplicationStatus;
  resumeVersion: number;
  resumeStatus: ResumeStatus | string;
  appliedAt: string;
  updatedAt: string | null;
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
