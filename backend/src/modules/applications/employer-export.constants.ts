/**
 * Exportable column keys for employer candidates.
 */

export const EMPLOYER_EXPORT_FORMATS = ["xlsx", "csv", "pdf"] as const;

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

export const EMPLOYER_EXPORT_FIELD_LABELS: Record<
  (typeof EMPLOYER_EXPORT_FIELDS)[number],
  string
> = {
  candidateName: "Candidate Name",
  phone: "Phone Number",
  appliedJob: "Applied Job",
  appliedDate: "Applied Date",
  status: "Current Status",
  location: "Location",
  experience: "Experience",
  resume: "Resume",
};

export const EMPLOYER_EXPORT_DEFAULT_FIELDS: Array<
  (typeof EMPLOYER_EXPORT_FIELDS)[number]
> = [
  "candidateName",
  "phone",
  "appliedJob",
  "appliedDate",
  "status",
  "location",
  "experience",
  "resume",
];

export const EMPLOYER_EXPORT_MAX_ROWS = 5000;

export const EMPLOYER_EXPORT_RESUME_DISPLAY_TEXT = "View Resume";

/** Excel column width caps by field. */
export const EMPLOYER_EXPORT_COLUMN_WIDTH: Record<
  (typeof EMPLOYER_EXPORT_FIELDS)[number],
  { min: number; max: number }
> = {
  candidateName: { min: 16, max: 28 },
  phone: { min: 14, max: 18 },
  appliedJob: { min: 18, max: 32 },
  appliedDate: { min: 12, max: 14 },
  status: { min: 14, max: 20 },
  location: { min: 14, max: 24 },
  experience: { min: 12, max: 18 },
  resume: { min: 14, max: 18 },
};

/** Relative PDF column weights (normalized at render time). */
export const EMPLOYER_EXPORT_PDF_COLUMN_WEIGHT: Record<
  (typeof EMPLOYER_EXPORT_FIELDS)[number],
  number
> = {
  candidateName: 1.4,
  phone: 1.1,
  appliedJob: 1.4,
  appliedDate: 1,
  status: 1.2,
  location: 1.2,
  experience: 1,
  resume: 1,
};
