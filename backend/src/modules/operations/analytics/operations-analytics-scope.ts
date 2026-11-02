import { Types, type PipelineStage } from "mongoose";
import { EmployerModel } from "../../employers/employer.model.js";
import { EMPLOYER_INDUSTRY_LABELS } from "../verifications/operations-verifications-industry.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type AnalyticsScope = {
  outOfScopeCountry: boolean;
  employerIds: Types.ObjectId[] | null;
  employerMatch: Record<string, unknown>;
  jobMatch: Record<string, unknown>;
  applicationMatch: Record<string, unknown>;
  needsJobJoin: boolean;
  ignoredByWebsiteEvents: string[];
};

export async function resolveAnalyticsScope(
  query: OperationsAnalyticsOverviewQuery,
): Promise<AnalyticsScope> {
  const country = query.country.trim().toLowerCase();
  const outOfScopeCountry = Boolean(country) && !["india", "in", "bharat"].includes(country);
  const employerIds = await employerIdsForFilter(query.employer);
  const employerMatch: Record<string, unknown> = {};
  const jobMatch: Record<string, unknown> = {};
  const applicationMatch: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (query.state.trim()) {
    const pattern = new RegExp(escapeRegex(query.state.trim()), "i");
    employerMatch.state = pattern;
    and.push({ $or: [{ stateName: pattern }, { state: pattern }] });
  }
  if (query.city.trim()) {
    const pattern = new RegExp(escapeRegex(query.city.trim()), "i");
    employerMatch.city = pattern;
    and.push({ $or: [{ cityName: pattern }, { city: pattern }] });
  }
  if (query.jobType) jobMatch.jobType = query.jobType;
  const categoryClause = categoryMatchClause(query.category);
  if (categoryClause) and.push(categoryClause);
  if (and.length > 0) jobMatch.$and = and;
  if (employerIds) {
    employerMatch._id = { $in: employerIds };
    jobMatch.employerId = { $in: employerIds };
    applicationMatch.employerId = { $in: employerIds };
  }
  if (query.applicationStatus) {
    applicationMatch["statusHistory.status"] = query.applicationStatus;
  }

  const ignoredByWebsiteEvents = [
    outOfScopeCountry ? "country" : "",
    query.state.trim() ? "state" : "",
    query.city.trim() ? "city" : "",
    query.category.trim() ? "category" : "",
    query.employer.trim() ? "employer" : "",
    query.jobType ? "job type" : "",
    query.applicationStatus ? "application status" : "",
  ].filter(Boolean);

  return {
    outOfScopeCountry,
    employerIds,
    employerMatch,
    jobMatch,
    applicationMatch,
    needsJobJoin: and.length > 0 || Boolean(query.jobType),
    ignoredByWebsiteEvents,
  };
}

/** Exact slug or display label, so a category dropdown matches either stored form. */
export function categoryMatchClause(category: string): Record<string, unknown> | null {
  const trimmed = category.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const values = new Set<string>([trimmed]);
  const label = EMPLOYER_INDUSTRY_LABELS[lower];
  if (label) values.add(label);
  for (const [slug, display] of Object.entries(EMPLOYER_INDUSTRY_LABELS)) {
    if (display.toLowerCase() === lower) values.add(slug);
  }
  const ors = [...values].flatMap((value) => {
    const pattern = new RegExp(`^${escapeRegex(value)}$`, "i");
    return [{ businessCategory: pattern }, { industry: pattern }];
  });
  return { $or: ors };
}

async function employerIdsForFilter(employer: string): Promise<Types.ObjectId[] | null> {
  const trimmed = employer.trim();
  if (!trimmed) return null;
  if (/^[a-f0-9]{24}$/i.test(trimmed) && Types.ObjectId.isValid(trimmed)) {
    return [new Types.ObjectId(trimmed)];
  }
  const pattern = new RegExp(escapeRegex(trimmed), "i");
  const rows = await EmployerModel.find({
    $or: [
      { companyName: pattern },
      { establishmentName: pattern },
      { firstName: pattern },
      { lastName: pattern },
    ],
  })
    .select("_id")
    .limit(50)
    .lean();
  return rows.map((row) => row._id as Types.ObjectId);
}

/** Job lookup used when an application or view has no location of its own. */
export function jobJoinStages(scope: AnalyticsScope, jobIdField = "$jobId"): PipelineStage[] {
  if (!scope.needsJobJoin) return [];
  return [
    {
      $lookup: {
        from: "jobs",
        let: { jobId: jobIdField },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$jobId"] } } },
          { $match: scope.jobMatch },
          { $project: { _id: 1 } },
        ],
        as: "scopedJob",
      },
    },
    { $match: { "scopedJob.0": { $exists: true } } },
  ];
}
