import type {
  SavedCandidateExportField,
  SavedCandidateExportFormat,
  SavedCandidatePresetTag,
  SavedCandidatePriority,
  SavedCandidateSort,
} from "@/types/saved-candidates";

export const SAVED_CANDIDATES_PAGE_SIZE = 20;

export const SAVED_CANDIDATES_MAX_NOTES_LENGTH = 2000;

export const SAVED_CANDIDATES_MAX_TAGS = 12;

export const SAVED_CANDIDATES_MAX_TAG_LENGTH = 40;

export const SAVED_CANDIDATE_PRIORITIES: SavedCandidatePriority[] = [
  "high",
  "medium",
  "low",
];

export const SAVED_CANDIDATE_PRIORITY_LABELS: Record<
  SavedCandidatePriority,
  string
> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

export const DEFAULT_SAVED_CANDIDATE_PRIORITY: SavedCandidatePriority = "medium";

export const SAVED_CANDIDATE_PRESET_TAG_VALUES: SavedCandidatePresetTag[] = [
  "immediate_joiner",
  "good_fit",
  "future_opening",
  "strong_communication",
  "experienced",
  "skilled",
  "own_vehicle",
  "night_shift",
  "female_candidate",
  "salary_negotiable",
  "remote_ready",
  "interview_later",
  "urgent_requirement",
];

export const SAVED_CANDIDATE_PRESET_TAG_LABELS: Record<
  SavedCandidatePresetTag,
  string
> = {
  immediate_joiner: "Immediate Joiner",
  good_fit: "Good Fit",
  future_opening: "Future Opening",
  strong_communication: "Strong Communication",
  experienced: "Experienced",
  skilled: "Skilled",
  own_vehicle: "Own Vehicle",
  night_shift: "Night Shift",
  female_candidate: "Female Candidate",
  salary_negotiable: "Salary Negotiable",
  remote_ready: "Remote Ready",
  interview_later: "Interview Later",
  urgent_requirement: "Urgent Requirement",
};

/** Legacy slugs that may still appear on older saved records. */
const LEGACY_SAVED_CANDIDATE_TAG_LABELS: Record<string, string> = {
  high_priority: "High Priority",
  shift_ready: "Shift Ready",
  ex_army: "Ex-Army",
  dl_verified: "DL Verified",
};

export const SAVED_CANDIDATE_TAG_LABELS: Record<string, string> = {
  ...LEGACY_SAVED_CANDIDATE_TAG_LABELS,
  ...SAVED_CANDIDATE_PRESET_TAG_LABELS,
};

/** @deprecated Prefer SAVED_CANDIDATE_PRESET_TAG_VALUES */
export const SAVED_CANDIDATE_TAG_VALUES = SAVED_CANDIDATE_PRESET_TAG_VALUES;

export function getSavedCandidateTagLabel(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) {
    return tag;
  }
  const known = SAVED_CANDIDATE_TAG_LABELS[trimmed];
  if (known) {
    return known;
  }
  return trimmed
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getSavedCandidatePriorityLabel(
  priority: SavedCandidatePriority,
): string {
  return SAVED_CANDIDATE_PRIORITY_LABELS[priority];
}

export const SAVED_CANDIDATE_SORT_OPTIONS: {
  value: SavedCandidateSort;
  label: string;
}[] = [
  { value: "recently_saved", label: "Recently saved" },
  { value: "oldest_saved", label: "Oldest saved" },
  { value: "recently_updated", label: "Recently updated" },
  { value: "priority", label: "Priority" },
  { value: "experience", label: "Experience" },
  { value: "expected_salary", label: "Expected salary" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

export const SAVED_CANDIDATE_EXPORT_FORMATS: SavedCandidateExportFormat[] = [
  "xlsx",
  "pdf",
  "zip",
];

export const SAVED_CANDIDATE_EXPORT_FORMAT_LABELS: Record<
  SavedCandidateExportFormat,
  string
> = {
  xlsx: "Excel (.xlsx)",
  pdf: "Professional PDF Report",
  zip: "ZIP (PDF Report + Resumes)",
};

export const SAVED_CANDIDATE_EXPORT_FIELDS = [
  "candidateId",
  "candidateName",
  "phone",
  "email",
  "currentRole",
  "experience",
  "location",
  "expectedSalary",
  "availability",
  "appliedJob",
  "savedDate",
  "priority",
  "tags",
  "notes",
  "createdBy",
  "skills",
  "resumeAvailable",
  "resumeFileName",
  "resume",
] as const satisfies readonly SavedCandidateExportField[];

export const SAVED_CANDIDATE_EXPORT_FIELD_LABELS: Record<
  SavedCandidateExportField,
  string
> = {
  candidateId: "Candidate ID",
  candidateName: "Candidate Name",
  phone: "Phone",
  email: "Email",
  currentRole: "Current Role",
  experience: "Experience",
  location: "Location",
  expectedSalary: "Expected Salary",
  availability: "Availability",
  appliedJob: "Applied Job",
  savedDate: "Saved Date",
  priority: "Priority",
  tags: "Tags",
  notes: "Private Notes",
  createdBy: "Created By",
  skills: "Skills",
  resumeAvailable: "Resume Status",
  resumeFileName: "Resume File Name",
  resume: "Resume Link",
};

export const SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS: SavedCandidateExportField[] =
  [
    "candidateName",
    "phone",
    "experience",
    "location",
    "expectedSalary",
    "availability",
    "appliedJob",
    "savedDate",
    "priority",
    "tags",
    "notes",
    "resumeAvailable",
  ];

export const SAVED_CANDIDATE_EXPORT_FIELD_CATALOG: Partial<
  Record<SavedCandidateExportField, string>
> = {
  phone: "phone",
  email: "phone",
  location: "location",
  expectedSalary: "expected_salary",
  notes: "notes",
  resume: "resume",
  resumeAvailable: "resume",
  resumeFileName: "resume",
};

export const DEFAULT_SAVED_CANDIDATE_SORT: SavedCandidateSort =
  "recently_saved";
