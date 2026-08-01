import {
  getCatalogField,
  type FieldAccessLevel,
} from "../team/field-access.catalog.js";
import type { TeamPermissionModule } from "../team/team-permissions.js";
import {
  canExportField,
  getFieldLevel,
  type ResolvedRbacContext,
} from "./rbac.engine.js";
import { maskByStrategy } from "./field-masking.js";

export type FieldPathBinding = {
  /** Catalog field key */
  field: string;
  /** DTO property path (dot notation supported for one level of nesting) */
  path: string;
};

function setPathValue(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const parts = path.split(".");
  if (parts.length === 1) {
    target[path] = value;
    return;
  }
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    if (next == null || typeof next !== "object" || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function deletePathValue(
  target: Record<string, unknown>,
  path: string,
): void {
  const parts = path.split(".");
  if (parts.length === 1) {
    delete target[path];
    return;
  }
  let cursor: Record<string, unknown> | null = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    if (next == null || typeof next !== "object" || Array.isArray(next)) {
      return;
    }
    cursor = next as Record<string, unknown>;
  }
  delete cursor[parts[parts.length - 1]!];
}

function getPathValue(target: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cursor: unknown = target;
  for (const part of parts) {
    if (cursor == null || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

/**
 * Sanitize a DTO in-place according to field access levels.
 * - hidden: remove property
 * - mask: replace with masked string (never raw)
 * - view/edit: leave as-is
 */
export function sanitizeDtoByFieldAccess<T extends Record<string, unknown>>(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  dto: T,
  bindings: FieldPathBinding[],
): T {
  if (!context || context.isSuperAdmin) {
    return dto;
  }

  for (const binding of bindings) {
    const level = getFieldLevel(context, moduleKey, binding.field);
    if (level === "hidden") {
      deletePathValue(dto, binding.path);
      continue;
    }
    if (level === "mask") {
      const current = getPathValue(dto, binding.path);
      if (current === undefined) {
        continue;
      }
      const strategy =
        getCatalogField(moduleKey, binding.field)?.maskStrategy ?? "generic";
      setPathValue(dto, binding.path, maskByStrategy(strategy, current));
    }
  }

  return dto;
}

export function filterExportFieldsByAccess<T extends string>(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  fields: T[],
  exportFieldToCatalogField: Partial<Record<T, string>>,
): T[] {
  if (!context || context.isSuperAdmin) {
    return fields;
  }

  return fields.filter((field) => {
    const catalogField = exportFieldToCatalogField[field];
    if (!catalogField) {
      return true;
    }
    return canExportField(context, moduleKey, catalogField);
  });
}

export function assertEditableFields(
  context: ResolvedRbacContext | undefined | null,
  moduleKey: TeamPermissionModule,
  fieldKeys: string[],
): void {
  if (!context || context.isSuperAdmin) {
    return;
  }

  for (const fieldKey of fieldKeys) {
    const level = getFieldLevel(context, moduleKey, fieldKey);
    if (level !== "edit") {
      const error = new Error(
        `You do not have permission to update field: ${fieldKey}`,
      ) as Error & { statusCode?: number };
      error.statusCode = 403;
      throw error;
    }
  }
}

export function levelAllowsPresence(level: FieldAccessLevel): boolean {
  return level === "view" || level === "mask" || level === "edit";
}

/** Candidate / application list + detail bindings */
export const CANDIDATE_LIST_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "phone", path: "candidatePhone" },
  { field: "location", path: "candidateLocation" },
];

export const CANDIDATE_DETAIL_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "phone", path: "candidate.phone" },
  { field: "location", path: "candidate.city" },
  { field: "location", path: "candidate.state" },
  { field: "location", path: "candidate.preferredJobLocation" },
  { field: "dob", path: "candidate.dateOfBirth" },
  { field: "expected_salary", path: "candidate.expectedSalary" },
  { field: "expected_salary", path: "candidate.expectedSalaryPeriod" },
  { field: "internal_notes", path: "employerNotes" },
  { field: "notes", path: "employerNotes" },
  { field: "resume", path: "resumeSnapshot" },
  { field: "offer_amount", path: "offer" },
];

export const INTERVIEW_LIST_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "phone", path: "candidatePhone" },
];

export const JOB_PUBLIC_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "salary", path: "fixedSalary" },
  { field: "salary", path: "minimumSalary" },
  { field: "salary", path: "maximumSalary" },
  { field: "salary", path: "salaryType" },
  { field: "salary", path: "salaryPeriod" },
  { field: "benefits", path: "perks" },
  { field: "job_description", path: "description" },
  { field: "hiring_manager", path: "contactPersonName" },
  { field: "hiring_manager", path: "contactEmail" },
  { field: "hiring_manager", path: "contactMobile" },
];

export const TEAM_MEMBER_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "phone", path: "phone" },
  { field: "email", path: "email" },
  { field: "department", path: "department" },
  { field: "role", path: "role" },
  { field: "designation", path: "designation" },
];

export const COMPANY_PROFILE_FIELD_BINDINGS: FieldPathBinding[] = [
  { field: "gst", path: "gstNumber" },
  { field: "pan", path: "panNumber" },
  { field: "registration_number", path: "registrationNumber" },
  { field: "bank_account", path: "bankAccountNumber" },
  { field: "billing_address", path: "billingAddress" },
];

export const EMPLOYER_EXPORT_CATALOG_MAP: Partial<
  Record<string, string>
> = {
  phone: "phone",
  location: "location",
  resume: "resume",
};
