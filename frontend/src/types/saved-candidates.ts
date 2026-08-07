export type SavedCandidatePriority = "high" | "medium" | "low";

export type SavedCandidatePresetTag =
  | "immediate_joiner"
  | "good_fit"
  | "future_opening"
  | "strong_communication"
  | "experienced"
  | "skilled"
  | "own_vehicle"
  | "night_shift"
  | "female_candidate"
  | "salary_negotiable"
  | "remote_ready"
  | "interview_later"
  | "urgent_requirement";

export type SavedCandidateSort =
  | "recently_saved"
  | "oldest_saved"
  | "recently_updated"
  | "experience"
  | "expected_salary"
  | "name_asc"
  | "name_desc"
  | "priority";

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
  candidateEmail?: string;
  candidateSkills?: string[];
  hasResume?: boolean;
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

export type SavedCandidatesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

export type SavedCandidateExportFormat = "xlsx" | "pdf" | "zip";

export type SavedCandidateExportField =
  | "candidateId"
  | "candidateName"
  | "phone"
  | "email"
  | "currentRole"
  | "experience"
  | "location"
  | "expectedSalary"
  | "availability"
  | "appliedJob"
  | "savedDate"
  | "priority"
  | "tags"
  | "notes"
  | "createdBy"
  | "skills"
  | "resumeAvailable"
  | "resumeFileName"
  | "resume";

export type SavedCandidatesViewMode = "table" | "grid";

export type SavedCandidateApplicationSummary = {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  experience?: string;
  location?: string;
};

export type SaveCandidateBody = {
  applicationId: string;
  priority: SavedCandidatePriority;
  tags: string[];
  notes: string;
};

export type SavedCandidateIdsPayload = {
  applicationIds: string[];
  savedByApplicationId: Record<string, string>;
};
