export const SAVED_CANDIDATE_PRIORITIES = [
  "high",
  "medium",
  "low",
] as const;

export const SAVED_CANDIDATE_PRIORITY_LABELS: Record<
  (typeof SAVED_CANDIDATE_PRIORITIES)[number],
  string
> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

/** Preset tag slugs shown in the Save Candidate modal. */
export const SAVED_CANDIDATE_PRESET_TAG_VALUES = [
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
] as const;

export const SAVED_CANDIDATE_PRESET_TAG_LABELS: Record<
  (typeof SAVED_CANDIDATE_PRESET_TAG_VALUES)[number],
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

/** @deprecated Use SAVED_CANDIDATE_PRESET_TAG_VALUES — kept for older records. */
export const SAVED_CANDIDATE_TAG_VALUES = [
  "high_priority",
  ...SAVED_CANDIDATE_PRESET_TAG_VALUES,
  "ex_army",
  "dl_verified",
  "shift_ready",
] as const;

export const SAVED_CANDIDATE_TAG_LABELS: Record<string, string> = {
  high_priority: "High Priority",
  shift_ready: "Shift Ready",
  ex_army: "Ex-Army",
  dl_verified: "DL Verified",
  ...SAVED_CANDIDATE_PRESET_TAG_LABELS,
};

export const SAVED_CANDIDATE_SORTS = [
  "recently_saved",
  "oldest_saved",
  "recently_updated",
  "experience",
  "expected_salary",
  "name_asc",
  "name_desc",
  "priority",
] as const;

export const SAVED_CANDIDATE_EXPORT_FORMATS = ["xlsx", "pdf", "zip"] as const;

export const SAVED_CANDIDATES_DEFAULT_PAGE_SIZE = 20;
export const SAVED_CANDIDATES_MAX_PAGE_SIZE = 50;
export const SAVED_CANDIDATES_MAX_TAGS = 12;
export const SAVED_CANDIDATES_MAX_NOTES_LENGTH = 2000;
export const SAVED_CANDIDATES_MAX_TAG_LENGTH = 40;
