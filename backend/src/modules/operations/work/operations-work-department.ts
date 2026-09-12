import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { slugifyOperationsName } from "../rbac/operations-slug.js";
import type { WorkItemType } from "./operations-work.constants.js";

/**
 * Deterministic department mapping for system-generated WorkItems.
 *
 * Team Queue visibility requires departmentId for department-scoped Ops users.
 * Departments are resolved by slug among active Operations departments.
 * Canonical departments are ensured at startup (idempotent).
 */
export const WORK_TYPE_DEPARTMENT_DEFINITIONS: ReadonlyArray<{
  type: WorkItemType;
  name: string;
  slug: string;
  description: string;
  /** Additional slug aliases that may already exist in production. */
  aliases: readonly string[];
}> = [
  {
    type: "verification",
    name: "Verification",
    slug: "verification",
    description: "Employer document verification queue.",
    aliases: ["verifications", "employer-verification"],
  },
  {
    type: "job_operations",
    name: "Job Operations",
    slug: "job-operations",
    description: "Job moderation and listing review queue.",
    aliases: ["jobs", "job-ops", "operations"],
  },
  {
    type: "placements",
    name: "Placements",
    slug: "placements",
    description: "Joining follow-up and placement operations.",
    aliases: ["placement", "hiring", "hiring-operations"],
  },
  {
    type: "support",
    name: "Support",
    slug: "support",
    description: "Support operational work.",
    aliases: [],
  },
  {
    type: "jobseeker",
    name: "Jobseeker",
    slug: "jobseeker",
    description: "Jobseeker operational work.",
    aliases: ["jobseekers", "candidates"],
  },
  {
    type: "hiring_operations",
    name: "Hiring Operations",
    slug: "hiring-operations",
    description: "Hiring operations work.",
    aliases: ["hiring"],
  },
  {
    type: "employer",
    name: "Employer",
    slug: "employer",
    description: "Employer operational work.",
    aliases: ["employers"],
  },
];

const OPEN_WORK_STATUSES = [
  "queued",
  "assigned",
  "in_progress",
  "waiting",
] as const;

let departmentCache: Map<WorkItemType, string> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

export function clearWorkDepartmentCache(): void {
  departmentCache = null;
  cacheLoadedAt = 0;
}

/**
 * Idempotent: ensure canonical departments exist for work-type routing.
 * Does not archive or rename existing departments.
 */
export async function ensureOperationsWorkDepartments(): Promise<void> {
  for (const def of WORK_TYPE_DEPARTMENT_DEFINITIONS) {
    const existing = await OperationsDepartmentModel.findOne({
      $or: [
        { slug: def.slug },
        { slug: { $in: [...def.aliases] } },
        { name: new RegExp(`^${def.name}$`, "i") },
      ],
      status: "active",
    })
      .select("_id")
      .lean();

    if (existing) {
      continue;
    }

    try {
      await OperationsDepartmentModel.create({
        name: def.name,
        slug: def.slug,
        description: def.description,
        status: "active",
      });
    } catch (error: unknown) {
      const code =
        error && typeof error === "object" && "code" in error
          ? Number((error as { code?: number }).code)
          : null;
      if (code !== 11000) {
        throw error;
      }
    }
  }
  clearWorkDepartmentCache();
}

async function loadDepartmentCache(): Promise<Map<WorkItemType, string>> {
  const now = Date.now();
  if (departmentCache && now - cacheLoadedAt < CACHE_TTL_MS) {
    return departmentCache;
  }

  const departments = await OperationsDepartmentModel.find({ status: "active" })
    .select("_id slug name")
    .lean();

  const bySlug = new Map(
    departments.map((d) => [String(d.slug).toLowerCase(), String(d._id)]),
  );
  const byNameSlug = new Map(
    departments.map((d) => [
      slugifyOperationsName(String(d.name ?? "")),
      String(d._id),
    ]),
  );

  const next = new Map<WorkItemType, string>();
  for (const def of WORK_TYPE_DEPARTMENT_DEFINITIONS) {
    const candidates = [def.slug, ...def.aliases];
    let resolved: string | undefined;
    for (const slug of candidates) {
      resolved = bySlug.get(slug) ?? byNameSlug.get(slug);
      if (resolved) break;
    }
    if (resolved) {
      next.set(def.type, resolved);
    }
  }

  departmentCache = next;
  cacheLoadedAt = now;
  return next;
}

/** Resolve Operations department ObjectId string for a work type. */
export async function resolveWorkDepartmentId(
  type: WorkItemType,
): Promise<string | null> {
  const cache = await loadDepartmentCache();
  return cache.get(type) ?? null;
}

/**
 * Work types whose team-queue items a department-scoped actor may see
 * when departmentId is null (legacy) or matches their department.
 */
export function workTypesForDepartmentSlug(
  departmentSlug: string | null | undefined,
): WorkItemType[] {
  if (!departmentSlug) return [];
  const slug = departmentSlug.toLowerCase();
  const types: WorkItemType[] = [];
  for (const def of WORK_TYPE_DEPARTMENT_DEFINITIONS) {
    if (def.slug === slug || def.aliases.includes(slug)) {
      types.push(def.type);
    }
  }
  return types;
}

export { OPEN_WORK_STATUSES };
