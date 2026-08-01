export const FIELD_ACCESS_LEVELS = [
  "hidden",
  "view",
  "mask",
  "edit",
] as const;

export type FieldAccessLevel = (typeof FIELD_ACCESS_LEVELS)[number];

export const FIELD_ACCESS_LEVEL_LABELS: Record<FieldAccessLevel, string> = {
  hidden: "Hidden",
  view: "View",
  mask: "Mask",
  edit: "Edit",
};

export type FieldSensitivity = "low" | "medium" | "high" | "critical";

export type FieldMaskStrategy =
  | "none"
  | "phone"
  | "email"
  | "salary"
  | "pan"
  | "aadhaar"
  | "bank"
  | "generic";

export type EmployerFieldAccessField = {
  key: string;
  label: string;
  sensitivity: FieldSensitivity;
  maskStrategy: FieldMaskStrategy;
};

export type EmployerFieldAccessCategory = {
  key: string;
  label: string;
  fields: EmployerFieldAccessField[];
};

export type EmployerFieldAccessModule = {
  module:
    | "candidates"
    | "jobs"
    | "interviews"
    | "company_profile"
    | "subscription"
    | "reports"
    | "team_management"
    | "settings";
  label: string;
  categories: EmployerFieldAccessCategory[];
};

export type RoleFieldAccessMap = Partial<
  Record<
    EmployerFieldAccessModule["module"],
    Partial<Record<string, FieldAccessLevel>>
  >
>;

export const FIELD_SENSITIVITY_LABELS: Record<FieldSensitivity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const EMPLOYER_FIELD_ACCESS_CATALOG: EmployerFieldAccessModule[] = [
  {
    module: "candidates",
    label: "Candidates",
    categories: [
      {
        key: "contact",
        label: "Contact",
        fields: [
          { key: "phone", label: "Phone", sensitivity: "high", maskStrategy: "phone" },
          { key: "email", label: "Email", sensitivity: "high", maskStrategy: "email" },
          {
            key: "alternate_phone",
            label: "Alternate Phone",
            sensitivity: "high",
            maskStrategy: "phone",
          },
        ],
      },
      {
        key: "personal",
        label: "Personal",
        fields: [
          { key: "dob", label: "DOB", sensitivity: "high", maskStrategy: "generic" },
          { key: "gender", label: "Gender", sensitivity: "medium", maskStrategy: "none" },
          { key: "address", label: "Address", sensitivity: "high", maskStrategy: "generic" },
          { key: "location", label: "Location", sensitivity: "medium", maskStrategy: "none" },
        ],
      },
      {
        key: "documents",
        label: "Documents",
        fields: [
          { key: "resume", label: "Resume", sensitivity: "critical", maskStrategy: "none" },
          { key: "pan", label: "PAN", sensitivity: "critical", maskStrategy: "pan" },
          { key: "aadhaar", label: "Aadhaar", sensitivity: "critical", maskStrategy: "aadhaar" },
          { key: "passport", label: "Passport", sensitivity: "critical", maskStrategy: "generic" },
          {
            key: "driving_license",
            label: "Driving License",
            sensitivity: "critical",
            maskStrategy: "generic",
          },
        ],
      },
      {
        key: "financial",
        label: "Financial",
        fields: [
          {
            key: "current_salary",
            label: "Current Salary",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
          {
            key: "expected_salary",
            label: "Expected Salary",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
          {
            key: "offer_amount",
            label: "Offer Amount",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
          {
            key: "current_ctc",
            label: "Current CTC",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
          {
            key: "expected_ctc",
            label: "Expected CTC",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
        ],
      },
      {
        key: "internal",
        label: "Internal",
        fields: [
          {
            key: "internal_notes",
            label: "Internal Notes",
            sensitivity: "high",
            maskStrategy: "none",
          },
          {
            key: "interview_feedback",
            label: "Interview Feedback",
            sensitivity: "high",
            maskStrategy: "none",
          },
          { key: "ratings", label: "Ratings", sensitivity: "medium", maskStrategy: "none" },
          { key: "tags", label: "Tags", sensitivity: "low", maskStrategy: "none" },
          { key: "notes", label: "Notes", sensitivity: "high", maskStrategy: "none" },
          {
            key: "attachments",
            label: "Attachments",
            sensitivity: "high",
            maskStrategy: "none",
          },
        ],
      },
    ],
  },
  {
    module: "jobs",
    label: "Jobs",
    categories: [
      {
        key: "compensation",
        label: "Compensation",
        fields: [
          { key: "salary", label: "Salary", sensitivity: "high", maskStrategy: "salary" },
          { key: "budget", label: "Budget", sensitivity: "high", maskStrategy: "salary" },
        ],
      },
      {
        key: "staffing",
        label: "Staffing",
        fields: [
          {
            key: "hiring_manager",
            label: "Hiring Manager",
            sensitivity: "medium",
            maskStrategy: "none",
          },
        ],
      },
      {
        key: "notes",
        label: "Notes",
        fields: [
          {
            key: "internal_notes",
            label: "Internal Notes",
            sensitivity: "high",
            maskStrategy: "none",
          },
          {
            key: "recruiter_notes",
            label: "Recruiter Notes",
            sensitivity: "high",
            maskStrategy: "none",
          },
        ],
      },
      {
        key: "content",
        label: "Content",
        fields: [
          {
            key: "job_description",
            label: "Job Description",
            sensitivity: "low",
            maskStrategy: "none",
          },
          { key: "benefits", label: "Benefits", sensitivity: "medium", maskStrategy: "none" },
        ],
      },
    ],
  },
  {
    module: "interviews",
    label: "Interviews",
    categories: [
      {
        key: "feedback",
        label: "Feedback",
        fields: [
          {
            key: "interview_feedback",
            label: "Interview Feedback",
            sensitivity: "high",
            maskStrategy: "none",
          },
          { key: "notes", label: "Notes", sensitivity: "high", maskStrategy: "none" },
        ],
      },
      {
        key: "contact",
        label: "Contact",
        fields: [
          { key: "phone", label: "Phone", sensitivity: "high", maskStrategy: "phone" },
        ],
      },
    ],
  },
  {
    module: "company_profile",
    label: "Company Profile",
    categories: [
      {
        key: "identity",
        label: "Identity",
        fields: [
          { key: "gst", label: "GST", sensitivity: "critical", maskStrategy: "generic" },
          { key: "pan", label: "PAN", sensitivity: "critical", maskStrategy: "pan" },
          {
            key: "registration_number",
            label: "Registration Number",
            sensitivity: "high",
            maskStrategy: "generic",
          },
        ],
      },
      {
        key: "banking",
        label: "Banking",
        fields: [
          {
            key: "bank_account",
            label: "Bank Account",
            sensitivity: "critical",
            maskStrategy: "bank",
          },
          {
            key: "billing_address",
            label: "Billing Address",
            sensitivity: "high",
            maskStrategy: "generic",
          },
        ],
      },
    ],
  },
  {
    module: "subscription",
    label: "Subscription",
    categories: [
      {
        key: "billing",
        label: "Billing",
        fields: [
          { key: "invoices", label: "Invoices", sensitivity: "high", maskStrategy: "none" },
          {
            key: "payment_method",
            label: "Payment Method",
            sensitivity: "critical",
            maskStrategy: "bank",
          },
          {
            key: "billing_email",
            label: "Billing Email",
            sensitivity: "high",
            maskStrategy: "email",
          },
        ],
      },
    ],
  },
  {
    module: "reports",
    label: "Reports",
    categories: [
      {
        key: "financial",
        label: "Financial",
        fields: [
          { key: "revenue", label: "Revenue", sensitivity: "critical", maskStrategy: "salary" },
          {
            key: "export_pii",
            label: "Export PII",
            sensitivity: "critical",
            maskStrategy: "none",
          },
        ],
      },
      {
        key: "analytics",
        label: "Analytics",
        fields: [
          { key: "analytics", label: "Analytics", sensitivity: "medium", maskStrategy: "none" },
        ],
      },
    ],
  },
  {
    module: "team_management",
    label: "Team Members",
    categories: [
      {
        key: "contact",
        label: "Contact",
        fields: [
          { key: "phone", label: "Phone", sensitivity: "high", maskStrategy: "phone" },
          { key: "email", label: "Email", sensitivity: "high", maskStrategy: "email" },
        ],
      },
      {
        key: "assignment",
        label: "Assignment",
        fields: [
          { key: "department", label: "Department", sensitivity: "low", maskStrategy: "none" },
          { key: "role", label: "Role", sensitivity: "medium", maskStrategy: "none" },
          {
            key: "designation",
            label: "Designation",
            sensitivity: "low",
            maskStrategy: "none",
          },
        ],
      },
    ],
  },
  {
    module: "settings",
    label: "Settings",
    categories: [
      {
        key: "security",
        label: "Security",
        fields: [
          { key: "billing", label: "Billing", sensitivity: "critical", maskStrategy: "none" },
          { key: "api_keys", label: "API Keys", sensitivity: "critical", maskStrategy: "generic" },
          { key: "webhooks", label: "Webhooks", sensitivity: "critical", maskStrategy: "generic" },
          { key: "security", label: "Security", sensitivity: "critical", maskStrategy: "none" },
        ],
      },
    ],
  },
];

export function coerceFieldAccessLevel(value: unknown): FieldAccessLevel {
  if (value === "hidden" || value === "view" || value === "mask" || value === "edit") {
    return value;
  }
  if (value === false) return "hidden";
  if (value === true) return "edit";
  return "edit";
}

export function createEmptyFieldAccessDraft(): RoleFieldAccessMap {
  const draft: RoleFieldAccessMap = {};
  for (const moduleEntry of EMPLOYER_FIELD_ACCESS_CATALOG) {
    const moduleMap: Partial<Record<string, FieldAccessLevel>> = {};
    for (const category of moduleEntry.categories) {
      for (const field of category.fields) {
        moduleMap[field.key] = "edit";
      }
    }
    draft[moduleEntry.module] = moduleMap;
  }
  return draft;
}

export function hydrateFieldAccessDraft(
  saved: RoleFieldAccessMap | null | undefined,
): RoleFieldAccessMap {
  const draft = createEmptyFieldAccessDraft();
  if (!saved) return draft;
  for (const moduleEntry of EMPLOYER_FIELD_ACCESS_CATALOG) {
    const savedModule = saved[moduleEntry.module];
    if (!savedModule) continue;
    const moduleMap = { ...draft[moduleEntry.module] };
    for (const category of moduleEntry.categories) {
      for (const field of category.fields) {
        if (savedModule[field.key] !== undefined) {
          moduleMap[field.key] = coerceFieldAccessLevel(savedModule[field.key]);
        }
      }
    }
    draft[moduleEntry.module] = moduleMap;
  }
  return draft;
}

export function fieldAccessMapsEqual(
  a: RoleFieldAccessMap | null | undefined,
  b: RoleFieldAccessMap | null | undefined,
): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
