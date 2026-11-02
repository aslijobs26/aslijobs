import { Types, type PipelineStage } from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { AnalyticsEventModel } from "../../analytics/analytics-event.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";
import { jobJoinStages, resolveAnalyticsScope, type AnalyticsScope } from "./operations-analytics-scope.js";
import { spreadsheetSafe } from "./operations-analytics-export.js";

const METRICS = [
  "applications",
  "interviews-completed",
  "selected",
  "joined",
  "employers",
  "visitors",
] as const;

export type AnalyticsDrilldownMetric = (typeof METRICS)[number];

const DEFINITIONS: Record<AnalyticsDrilldownMetric, { definition: string; source: string; dateField: string; limitation: string }> = {
  applications: {
    definition: "Applications submitted in the selected period.",
    source: "applications",
    dateField: "appliedAt",
    limitation: "Candidate phone numbers and message text are not included.",
  },
  "interviews-completed": {
    definition: "Applications with an interview_completed history event in the period.",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    limitation: "Offer or joined status is not treated as a completed interview.",
  },
  selected: {
    definition: "Applications with a selected history event in the period.",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    limitation: "Selected is not a joining event.",
  },
  joined: {
    definition: "Applications with a joined history event in the period.",
    source: "applications.statusHistory",
    dateField: "statusHistory.at",
    limitation: "No join date is invented when history has no joined event.",
  },
  employers: {
    definition: "Employer accounts created in the period.",
    source: "employers",
    dateField: "createdAt",
    limitation: "This is not every employer who hired in the period.",
  },
  visitors: {
    definition: "Opaque visitors with a page view in the period.",
    source: "analytics_events",
    dateField: "occurredAt",
    limitation: "Location filters do not apply. Visitor ids are not people names.",
  },
};

export function parseDrilldownQuery(query: OperationsAnalyticsOverviewQuery & {
  metric?: string;
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  dir?: string;
}, options?: { maxLimit?: number }) {
  const metric = query.metric as AnalyticsDrilldownMetric;
  if (!METRICS.includes(metric)) {
    throw new AppError("Choose a supported analytics breakdown.", HTTP_STATUS.BAD_REQUEST);
  }
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(options?.maxLimit ?? 50, Math.max(1, query.limit ?? 25));
  const sort = query.sort === "name" ? "name" : "date";
  const dir = query.dir === "asc" ? 1 : -1;
  return { metric, page, limit, q: (query.q ?? "").trim().slice(0, 80), sort, dir };
}

export async function loadAnalyticsDrilldown(input: {
  query: OperationsAnalyticsOverviewQuery & { metric?: string; page?: number; limit?: number; q?: string; sort?: string; dir?: string };
  from: Date;
  to: Date;
  maxLimit?: number;
}) {
  if (/^[a-f0-9]{24}$/i.test(input.query.employer ?? "")) {
    assertObjectId(input.query.employer ?? "");
  }
  const scope = await resolveAnalyticsScope(input.query);
  if (scope.outOfScopeCountry || (scope.employerIds && scope.employerIds.length === 0)) {
    const parsed = parseDrilldownQuery(input.query);
    return shape(parsed, [], 0);
  }
  const parsed = parseDrilldownQuery(input.query, { maxLimit: input.maxLimit });
  const skip = (parsed.page - 1) * parsed.limit;
  if (parsed.metric === "visitors") {
    const result = await loadVisitors(input.from, input.to, parsed, skip);
    if (scope.ignoredByWebsiteEvents.length > 0) {
      result.limitation = `${result.limitation} Not applied to visitors: ${scope.ignoredByWebsiteEvents.join(", ")}.`;
    }
    return result;
  }
  if (parsed.metric === "employers") return loadEmployers(input.from, input.to, parsed, skip, scope);
  return loadApplications(input.from, input.to, parsed, skip, scope);
}

async function loadApplications(
  from: Date,
  to: Date,
  parsed: ReturnType<typeof parseDrilldownQuery>,
  skip: number,
  scope: AnalyticsScope,
) {
  const match: Record<string, unknown> =
    parsed.metric === "applications"
      ? { appliedAt: { $gte: from, $lte: to } }
      : {
          statusHistory: {
            $elemMatch: {
              status:
                parsed.metric === "interviews-completed"
                  ? "interview_completed"
                  : parsed.metric === "selected"
                    ? "selected"
                    : "joined",
              at: { $gte: from, $lte: to },
            },
          },
        };
  if (parsed.q) {
    match.publicJobId = new RegExp(parsed.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }
  Object.assign(match, scope.applicationMatch);
  const pipeline: PipelineStage[] = [
    { $match: match },
    ...jobJoinStages(scope),
    {
      $lookup: {
        from: "employers",
        localField: "employerId",
        foreignField: "_id",
        pipeline: [{ $project: { companyName: 1, establishmentName: 1, firstName: 1, lastName: 1 } }],
        as: "employer",
      },
    },
    {
      $project: {
        publicJobId: 1,
        status: 1,
        appliedAt: 1,
        employerName: {
          $let: {
            vars: { employer: { $arrayElemAt: ["$employer", 0] } },
            in: {
              $ifNull: [
                "$$employer.companyName",
                { $ifNull: ["$$employer.establishmentName", "Employer"] },
              ],
            },
          },
        },
      },
    },
    { $sort: (parsed.sort === "name" ? { employerName: parsed.dir } : { appliedAt: parsed.dir }) as Record<string, 1 | -1> },
    {
      $facet: {
        rows: [{ $skip: skip }, { $limit: parsed.limit }],
        total: [{ $count: "n" }],
      },
    },
  ];
  const [result] = await ApplicationModel.aggregate(pipeline).option({ maxTimeMS: 20_000 });
  return shape(parsed, result?.rows ?? [], result?.total?.[0]?.n ?? 0);
}

async function loadEmployers(
  from: Date,
  to: Date,
  parsed: ReturnType<typeof parseDrilldownQuery>,
  skip: number,
  scope: AnalyticsScope,
) {
  const match: Record<string, unknown> = { createdAt: { $gte: from, $lte: to }, ...scope.employerMatch };
  if (parsed.q) {
    const pattern = new RegExp(parsed.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    match.$or = [{ companyName: pattern }, { establishmentName: pattern }];
  }
  const [rows, total] = await Promise.all([
    EmployerModel.find(match)
      .select("companyName establishmentName city verificationStatus createdAt")
      .sort(
        (parsed.sort === "name"
          ? { companyName: parsed.dir }
          : { createdAt: parsed.dir }) as Record<string, 1 | -1>,
      )
      .skip(skip)
      .limit(parsed.limit)
      .lean(),
    EmployerModel.countDocuments(match),
  ]);
  return shape(
    parsed,
    rows.map((row) => ({
      employerName: String(row.companyName || row.establishmentName || "Employer"),
      city: row.city || "",
      verificationStatus: row.verificationStatus || "",
      createdAt: row.createdAt,
    })),
    total,
  );
}

async function loadVisitors(
  from: Date,
  to: Date,
  parsed: ReturnType<typeof parseDrilldownQuery>,
  skip: number,
) {
  const [result] = await AnalyticsEventModel.aggregate([
    { $match: { eventName: "page_view", occurredAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: "$visitorId",
        sessions: { $addToSet: "$sessionId" },
        pageViews: { $sum: 1 },
        path: { $first: "$path" },
      },
    },
    { $sort: { pageViews: parsed.dir } as Record<string, 1 | -1> },
    { $facet: { rows: [{ $skip: skip }, { $limit: parsed.limit }], total: [{ $count: "n" }] } },
  ]).option({ maxTimeMS: 20_000 });
  return shape(
    parsed,
    (result?.rows ?? []).map((row: { _id: string; sessions: string[]; pageViews: number; path: string }) => ({
      visitorId: row._id,
      sessions: row.sessions?.length ?? 0,
      pageViews: row.pageViews,
      path: row.path,
    })),
    result?.total?.[0]?.n ?? 0,
  );
}

function shape(
  parsed: ReturnType<typeof parseDrilldownQuery>,
  rows: unknown[],
  total: number,
) {
  return {
    metric: parsed.metric,
    page: parsed.page,
    limit: parsed.limit,
    total,
    rows,
    ...DEFINITIONS[parsed.metric],
  };
}

export async function exportAnalyticsDrilldownCsv(input: {
  query: OperationsAnalyticsOverviewQuery & { metric?: string; page?: number; limit?: number; q?: string; sort?: string; dir?: string };
  from: Date;
  to: Date;
}): Promise<{ filename: string; contentType: string; body: string; truncated: boolean; exported: number; total: number }> {
  const pageSize = 200;
  const cap = 5_000;
  const rows: Array<Record<string, unknown>> = [];
  let total = 0;
  let page = 1;
  while (rows.length < cap) {
    const batch = await loadAnalyticsDrilldown({
      query: { ...input.query, page, limit: pageSize },
      from: input.from,
      to: input.to,
      maxLimit: pageSize,
    });
    total = batch.total;
    rows.push(...(batch.rows as Array<Record<string, unknown>>));
    if (batch.rows.length < pageSize || rows.length >= total) break;
    page += 1;
  }
  const exported = rows.slice(0, cap);
  const columns = exported.length > 0 ? Object.keys(exported[0] ?? {}) : ["metric"];
  const cell = (value: unknown) => {
    const text = value instanceof Date ? value.toISOString() : value == null ? "" : String(value);
    const safe = spreadsheetSafe(text);
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const body = [
    columns.map((column) => cell(column)).join(","),
    ...exported.map((row) => columns.map((column) => cell(row[column])).join(",")),
  ].join("\n");
  return {
    filename: `aslijobs-analytics-${input.query.metric ?? "breakdown"}-filtered.csv`,
    contentType: "text/csv; charset=utf-8",
    body,
    truncated: total > exported.length,
    exported: exported.length,
    total,
  };
}

export function assertObjectId(value: string): void {
  if (value && !Types.ObjectId.isValid(value)) {
    throw new AppError("Employer id is not valid.", HTTP_STATUS.BAD_REQUEST);
  }
}
