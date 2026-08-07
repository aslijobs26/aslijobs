import type { ListPagination } from "../../utils/pagination.js";
import type {
  SAVED_CANDIDATE_EXPORT_FORMATS,
  SAVED_CANDIDATE_PRIORITIES,
  SAVED_CANDIDATE_SORTS,
} from "./saved-candidate.constants.js";

export type SavedCandidatePriority =
  (typeof SAVED_CANDIDATE_PRIORITIES)[number];

export type SavedCandidateSort = (typeof SAVED_CANDIDATE_SORTS)[number];

export type SavedCandidateExportFormat =
  (typeof SAVED_CANDIDATE_EXPORT_FORMATS)[number];

export type SavedCandidateListItem = {
  id: string;
  applicationId: string;
  jobSeekerId: string;
  publicJobId: string;
  jobTitle: string;
  jobLocation: string;
  candidateName: string;
  candidateHeadline: string;
  candidateLocation: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateSkills: string[];
  hasResume: boolean;
  candidateExperienceLabel: string;
  candidateAvailability: string;
  candidateAvailabilityStatus: string | null;
  isWhatsappVerified: boolean;
  applicationStatus: string;
  /** True when application has an active (non-cancelled) interview date. */
  hasActiveInterview: boolean;
  interviewDate: string | null;
  expectedSalary: number | null;
  expectedSalaryPeriod: string | null;
  priority: SavedCandidatePriority | null;
  tags: string[];
  notes: string;
  savedAt: string;
  updatedAt: string | null;
  createdByName: string;
  updatedByName: string;
};

export type SavedCandidateStats = {
  totalSaved: number;
  newThisWeek: number;
  newThisWeekChangePercent: number | null;
  contacted: number;
  contactedChangePercent: number | null;
  interviewed: number;
  interviewedChangePercent: number | null;
  hired: number;
  hiredChangePercent: number | null;
};

export type SavedCandidatesPagination = ListPagination;

export type SavedCandidateActor = {
  teamMemberId?: string;
  displayName: string;
};
