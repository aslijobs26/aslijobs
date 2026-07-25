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
  status: EmployerApplicationStatus;
  resumeVersion: number;
  resumeStatus: string;
  appliedAt: string;
  updatedAt: string | null;
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
  };
};

export type EmployerHiringUpdatePayload = {
  status?: EmployerApplicationStatus;
  interview?: Partial<ApplicationInterview>;
  offer?: Partial<ApplicationOffer>;
  rejectReason?: string;
  employerNotesVisibleToSeeker?: boolean;
};
