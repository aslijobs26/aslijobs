import {
  TEAM_PERMISSION_MODULES,
  type RoleFieldAccessMap,
  type TeamPermissionModule,
} from "./team-permissions.js";

export const FIELD_ACCESS_LEVELS = [
  "hidden",
  "view",
  "mask",
  "edit",
] as const;

export type FieldAccessLevel = (typeof FIELD_ACCESS_LEVELS)[number];

export const FIELD_SENSITIVITY_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type FieldSensitivity = (typeof FIELD_SENSITIVITY_LEVELS)[number];

export const FIELD_MASK_STRATEGIES = [
  "none",
  "phone",
  "email",
  "salary",
  "pan",
  "aadhaar",
  "bank",
  "generic",
] as const;

export type FieldMaskStrategy = (typeof FIELD_MASK_STRATEGIES)[number];

export type FieldAccessCatalogField = {
  key: string;
  label: string;
  sensitivity: FieldSensitivity;
  maskStrategy: FieldMaskStrategy;
};

export type FieldAccessCatalogCategory = {
  key: string;
  label: string;
  fields: FieldAccessCatalogField[];
};

export type FieldAccessCatalogModule = {
  module: TeamPermissionModule;
  label: string;
  categories: FieldAccessCatalogCategory[];
};

export const FIELD_ACCESS_CATALOG: FieldAccessCatalogModule[] = [
  {
    module: "candidates",
    label: "Candidates",
    categories: [
      {
        key: "contact",
        label: "Contact",
        fields: [
          {
            key: "phone",
            label: "Phone",
            sensitivity: "high",
            maskStrategy: "phone",
          },
          {
            key: "email",
            label: "Email",
            sensitivity: "high",
            maskStrategy: "email",
          },
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
          {
            key: "dob",
            label: "DOB",
            sensitivity: "high",
            maskStrategy: "generic",
          },
          {
            key: "gender",
            label: "Gender",
            sensitivity: "medium",
            maskStrategy: "none",
          },
          {
            key: "address",
            label: "Address",
            sensitivity: "high",
            maskStrategy: "generic",
          },
          {
            key: "location",
            label: "Location",
            sensitivity: "medium",
            maskStrategy: "none",
          },
        ],
      },
      {
        key: "documents",
        label: "Documents",
        fields: [
          {
            key: "resume",
            label: "Resume",
            sensitivity: "critical",
            maskStrategy: "none",
          },
          {
            key: "pan",
            label: "PAN",
            sensitivity: "critical",
            maskStrategy: "pan",
          },
          {
            key: "aadhaar",
            label: "Aadhaar",
            sensitivity: "critical",
            maskStrategy: "aadhaar",
          },
          {
            key: "passport",
            label: "Passport",
            sensitivity: "critical",
            maskStrategy: "generic",
          },
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
          {
            key: "ratings",
            label: "Ratings",
            sensitivity: "medium",
            maskStrategy: "none",
          },
          {
            key: "tags",
            label: "Tags",
            sensitivity: "low",
            maskStrategy: "none",
          },
          {
            key: "notes",
            label: "Notes",
            sensitivity: "high",
            maskStrategy: "none",
          },
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
          {
            key: "salary",
            label: "Salary",
            sensitivity: "high",
            maskStrategy: "salary",
          },
          {
            key: "budget",
            label: "Budget",
            sensitivity: "high",
            maskStrategy: "salary",
          },
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
          {
            key: "benefits",
            label: "Benefits",
            sensitivity: "medium",
            maskStrategy: "none",
          },
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
          {
            key: "notes",
            label: "Notes",
            sensitivity: "high",
            maskStrategy: "none",
          },
        ],
      },
      {
        key: "contact",
        label: "Contact",
        fields: [
          {
            key: "phone",
            label: "Phone",
            sensitivity: "high",
            maskStrategy: "phone",
          },
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
          {
            key: "gst",
            label: "GST",
            sensitivity: "critical",
            maskStrategy: "generic",
          },
          {
            key: "pan",
            label: "PAN",
            sensitivity: "critical",
            maskStrategy: "pan",
          },
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
          {
            key: "invoices",
            label: "Invoices",
            sensitivity: "high",
            maskStrategy: "none",
          },
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
          {
            key: "revenue",
            label: "Revenue",
            sensitivity: "critical",
            maskStrategy: "salary",
          },
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
          {
            key: "analytics",
            label: "Analytics",
            sensitivity: "medium",
            maskStrategy: "none",
          },
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
          {
            key: "phone",
            label: "Phone",
            sensitivity: "high",
            maskStrategy: "phone",
          },
          {
            key: "email",
            label: "Email",
            sensitivity: "high",
            maskStrategy: "email",
          },
        ],
      },
      {
        key: "assignment",
        label: "Assignment",
        fields: [
          {
            key: "department",
            label: "Department",
            sensitivity: "low",
            maskStrategy: "none",
          },
          {
            key: "role",
            label: "Role",
            sensitivity: "medium",
            maskStrategy: "none",
          },
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
          {
            key: "billing",
            label: "Billing",
            sensitivity: "critical",
            maskStrategy: "none",
          },
          {
            key: "api_keys",
            label: "API Keys",
            sensitivity: "critical",
            maskStrategy: "generic",
          },
          {
            key: "webhooks",
            label: "Webhooks",
            sensitivity: "critical",
            maskStrategy: "generic",
          },
          {
            key: "security",
            label: "Security",
            sensitivity: "critical",
            maskStrategy: "none",
          },
        ],
      },
    ],
  },
];

const FIELD_INDEX = new Map<string, FieldAccessCatalogField>();
const MODULE_FIELD_KEYS = new Map<TeamPermissionModule, Set<string>>();

for (const moduleEntry of FIELD_ACCESS_CATALOG) {
  const keys = new Set<string>();
  for (const category of moduleEntry.categories) {
    for (const field of category.fields) {
      keys.add(field.key);
      FIELD_INDEX.set(`${moduleEntry.module}:${field.key}`, field);
    }
  }
  MODULE_FIELD_KEYS.set(moduleEntry.module, keys);
}

export function isFieldAccessLevel(value: unknown): value is FieldAccessLevel {
  return (
    typeof value === "string" &&
    (FIELD_ACCESS_LEVELS as readonly string[]).includes(value)
  );
}

export function coerceFieldAccessLevel(value: unknown): FieldAccessLevel | null {
  if (isFieldAccessLevel(value)) {
    return value;
  }
  if (value === true) {
    return "edit";
  }
  if (value === false) {
    return "hidden";
  }
  return null;
}

export function isKnownField(
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): boolean {
  return MODULE_FIELD_KEYS.get(moduleKey)?.has(fieldKey) ?? false;
}

export function getCatalogField(
  moduleKey: TeamPermissionModule,
  fieldKey: string,
): FieldAccessCatalogField | undefined {
  return FIELD_INDEX.get(`${moduleKey}:${fieldKey}`);
}

export function listCatalogFields(
  moduleKey?: TeamPermissionModule,
): Array<{ module: TeamPermissionModule; field: FieldAccessCatalogField }> {
  const result: Array<{
    module: TeamPermissionModule;
    field: FieldAccessCatalogField;
  }> = [];

  for (const moduleEntry of FIELD_ACCESS_CATALOG) {
    if (moduleKey && moduleEntry.module !== moduleKey) {
      continue;
    }
    for (const category of moduleEntry.categories) {
      for (const field of category.fields) {
        result.push({ module: moduleEntry.module, field });
      }
    }
  }

  return result;
}

export function getFieldAccessCatalogMeta() {
  return {
    levels: FIELD_ACCESS_LEVELS.map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
    })),
    catalog: FIELD_ACCESS_CATALOG,
  };
}

/**
 * Normalize persisted/API fieldAccess maps.
 * - Drops unknown modules/fields
 * - Coerces legacy booleans to levels
 * - Returns null when empty
 */
export function normalizeFieldAccessMap(
  input: unknown,
): RoleFieldAccessMap | null {
  if (input == null) {
    return null;
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const result: RoleFieldAccessMap = {};
  const source = input as Record<string, unknown>;

  for (const moduleKey of TEAM_PERMISSION_MODULES) {
    const moduleValue = source[moduleKey];
    if (moduleValue == null || typeof moduleValue !== "object") {
      continue;
    }

    const knownKeys = MODULE_FIELD_KEYS.get(moduleKey);
    if (!knownKeys || knownKeys.size === 0) {
      continue;
    }

    const moduleMap: Record<string, FieldAccessLevel> = {};
    for (const [fieldKey, rawLevel] of Object.entries(
      moduleValue as Record<string, unknown>,
    )) {
      if (!knownKeys.has(fieldKey)) {
        continue;
      }
      const level = coerceFieldAccessLevel(rawLevel);
      if (level) {
        moduleMap[fieldKey] = level;
      }
    }

    if (Object.keys(moduleMap).length > 0) {
      result[moduleKey] = moduleMap;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

export function assertValidFieldAccessMap(input: unknown): RoleFieldAccessMap | null {
  if (input === null || input === undefined) {
    return null;
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("fieldAccess must be an object or null");
  }

  const source = input as Record<string, unknown>;
  for (const moduleKey of Object.keys(source)) {
    if (
      !(TEAM_PERMISSION_MODULES as readonly string[]).includes(moduleKey)
    ) {
      throw new Error(`Unknown fieldAccess module: ${moduleKey}`);
    }
    const moduleValue = source[moduleKey];
    if (moduleValue == null) {
      continue;
    }
    if (typeof moduleValue !== "object" || Array.isArray(moduleValue)) {
      throw new Error(`fieldAccess.${moduleKey} must be an object`);
    }
    for (const [fieldKey, rawLevel] of Object.entries(
      moduleValue as Record<string, unknown>,
    )) {
      if (!isKnownField(moduleKey as TeamPermissionModule, fieldKey)) {
        throw new Error(
          `Unknown fieldAccess field: ${moduleKey}.${fieldKey}`,
        );
      }
      if (!isFieldAccessLevel(rawLevel) && typeof rawLevel !== "boolean") {
        throw new Error(
          `Invalid fieldAccess level for ${moduleKey}.${fieldKey}`,
        );
      }
    }
  }

  return normalizeFieldAccessMap(input);
}
