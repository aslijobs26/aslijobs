export const SAVED_CANDIDATE_EXPORT_FORMATS = ["xlsx", "pdf", "zip"] as const;

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
] as const;

export const SAVED_CANDIDATE_EXPORT_FIELD_LABELS: Record<
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number],
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

export const SAVED_CANDIDATE_EXPORT_DEFAULT_FIELDS: Array<
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number]
> = [
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
  "resume",
];

export const SAVED_CANDIDATE_EXPORT_MAX_ROWS = 10000;

export const SAVED_CANDIDATE_EXPORT_RESUME_DISPLAY_TEXT = "Open Resume";

/** Fixed professional column widths (Excel characters). */
export const SAVED_CANDIDATE_EXPORT_COLUMN_WIDTH: Record<
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number],
  number
> = {
  candidateId: 28,
  candidateName: 25,
  phone: 18,
  email: 35,
  currentRole: 28,
  experience: 18,
  location: 30,
  expectedSalary: 20,
  availability: 22,
  appliedJob: 35,
  savedDate: 22,
  priority: 16,
  tags: 40,
  notes: 50,
  createdBy: 22,
  skills: 36,
  resumeAvailable: 16,
  resumeFileName: 32,
  resume: 18,
};

/** Fields that must stay text in Excel (no scientific notation). */
export const SAVED_CANDIDATE_EXPORT_TEXT_FIELDS = new Set<
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number]
>(["candidateId", "phone", "email"]);

/** Fields that wrap in Excel. */
export const SAVED_CANDIDATE_EXPORT_WRAP_FIELDS = new Set<
  (typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number]
>(["notes", "tags", "skills", "appliedJob", "location", "currentRole", "resume"]);

/** Maps export field keys to RBAC catalog field keys. */
export const SAVED_CANDIDATE_EXPORT_CATALOG_MAP: Partial<
  Record<(typeof SAVED_CANDIDATE_EXPORT_FIELDS)[number], string>
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

export const SAVED_CANDIDATE_EXPORT_HEADER_FILL = "14532D";
export const SAVED_CANDIDATE_EXPORT_TITLE_FILL = "166534";
export const SAVED_CANDIDATE_EXPORT_ZEBRA_FILL = "F0FDF4";
export const SAVED_CANDIDATE_EXPORT_BORDER_COLOR = "CBD5E1";
export const SAVED_CANDIDATE_EXPORT_META_LABEL_FILL = "ECFDF5";
export const SAVED_CANDIDATE_EXPORT_META_VALUE_FILL = "FFFFFF";
export const SAVED_CANDIDATE_EXPORT_FONT = "Calibri";

/** Max candidate detail pages in PDF (summary table always includes all rows). */
export const SAVED_CANDIDATE_EXPORT_PDF_DETAIL_PAGE_LIMIT = 200;

export const SAVED_CANDIDATE_EXPORT_PDF_COLORS = {
  header: "#14532D",
  title: "#166534",
  zebra: "#F0FDF4",
  border: "#CBD5E1",
  text: "#1E293B",
  muted: "#64748B",
  white: "#FFFFFF",
  link: "#0563C1",
  cardBg: "#ECFDF5",
} as const;
