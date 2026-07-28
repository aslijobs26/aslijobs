import type { ResumeJson, ResumeStatus } from "@/types/job-seeker-resume";

export const APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Applied",
  viewed: "Viewed",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Completed",
  offer_sent: "Offer Sent",
  selected: "Selected",
  joined: "Joined",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export type ApplicationHistoryActor = "job_seeker" | "employer" | "system";

export type ApplicationStatusHistoryEntry = {
  status: ApplicationStatus;
  at: string;
  actorType: ApplicationHistoryActor;
  remark: string;
};

export type ApplicationInterviewMode = "online" | "offline" | "phone" | "";

export type ApplicationInterview = {
  date: string;
  time: string;
  mode: ApplicationInterviewMode;
  meetingLink: string;
  venue: string;
  instructions: string;
  interviewerName: string;
  interviewerDesignation: string;
  interviewerEmail: string;
  interviewerPhone: string;
  cancelledAt?: string | null;
  cancellationReason?: string;
  cancelledByName?: string;
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
  status: ResumeStatus | string;
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

export type SeekerApplicationsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
