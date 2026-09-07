import mongoose from "mongoose";
import {
  JOB_LISTING_PAYMENT_STATUSES,
  JOB_STATUSES,
  JOB_TYPES,
  type JobListingPaymentStatus,
  type JobStatus,
} from "../../../constants/job.constants.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import type {
  OperationsJobsAnalyticsChartPoint,
  OperationsJobsAnalyticsInsight,
  OperationsJobsAnalyticsNamedCount,
  OperationsJobsAnalyticsQuery,
  OperationsJobsAnalyticsRange,
  OperationsJobsAnalyticsResult,
  OperationsJobsAnalyticsSeriesPoint,
  OperationsJobsKpis,
  OperationsJobsLocationAnalytics,
  OperationsJobsPostingsTrendPoint,
} from "./operations-jobs.types.js";

export const JOBS_ANALYTICS_PRESETS = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "custom",
] as const;

export type JobsAnalyticsPreset = (typeof JOBS_ANALYTICS_PRESETS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STATUS_ORDER: JobStatus[] = [
  "active",
  "pending_approval",
  "paused",
  "draft",
  "expired",
  "closed",
  "rejected",
];
const PAYMENT_ORDER: JobListingPaymentStatus[] = [
  "paid",
  "pending",
  "unpaid",
  "not_applicable",
];

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfLocalDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const parsed = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + offset);
  return start;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

type JobsAnalyticsGranularity = "day" | "week" | "month";

function resolveGranularity(
  preset: JobsAnalyticsPreset,
  durationMs: number,
): JobsAnalyticsGranularity {
  // Overall spans years — monthly buckets keep trend bars readable.
  if (preset === "all") {
    return "month";
  }
  if (durationMs > 180 * MS_PER_DAY) {
    return "month";
  }
  if (durationMs > 62 * MS_PER_DAY) {
    return "week";
  }
  return "day";
}

function humanizeToken(value: string): string {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function jobStatusAnalyticsLabel(status: string): string {
  switch (status) {
    case "active":
      return "Live";
    case "pending_approval":
      return "Pending Approval";
    case "paused":
      return "Paused";
    case "draft":
      return "Draft";
    case "expired":
      return "Expired";
    case "closed":
      return "Closed";
    case "rejected":
      return "Rejected";
    default:
      return humanizeToken(status);
  }
}

export function paymentStatusAnalyticsLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "unpaid":
      return "Unpaid";
    case "not_applicable":
      return "N/A";
    default:
      return humanizeToken(status);
  }
}

export function jobTypeAnalyticsLabel(jobType: string): string {
  switch (jobType) {
    case "full-time":
      return "Full Time";
    case "part-time":
      return "Part Time";
    case "contract":
      return "Contract";
    default:
      return jobType ? humanizeToken(jobType) : "Unspecified";
  }
}

export function resolveJobsAnalyticsDateRange(input: {
  preset: JobsAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): OperationsJobsAnalyticsRange {
  const now = input.now ?? new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date;
  let preset: JobsAnalyticsPreset = input.preset;

  switch (input.preset) {
    case "all": {
      from = new Date(2020, 0, 1);
      to = todayEnd;
      break;
    }
    case "last_7_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      to = todayEnd;
      break;
    }
    case "last_3_months": {
      from = startOfLocalDay(now);
      from.setMonth(from.getMonth() - 3);
      to = todayEnd;
      break;
    }
    case "custom": {
      const fromRaw = parseDateOnly(input.dateFrom);
      const toRaw = parseDateOnly(input.dateTo);
      from = fromRaw ? startOfLocalDay(fromRaw) : startOfLocalDay(now);
      to = toRaw
        ? endOfLocalDay(toRaw)
        : fromRaw
          ? endOfLocalDay(fromRaw)
          : todayEnd;
      if (from.getTime() > to.getTime()) {
        const swappedFrom = startOfLocalDay(to);
        to = endOfLocalDay(from);
        from = swappedFrom;
      }
      break;
    }
    case "last_30_days":
    default: {
      preset = "last_30_days";
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      to = todayEnd;
      break;
    }
  }

  const durationMs = Math.max(to.getTime() - from.getTime(), 0);
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    previousFrom: startOfLocalDay(previousFrom).toISOString(),
    previousTo: endOfLocalDay(previousTo).toISOString(),
    granularity: resolveGranularity(preset, durationMs),
  };
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) {
    return null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

function sharePercent(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((count / total) * 100);
}

function formatPeriodLabel(preset: JobsAnalyticsPreset): string {
  switch (preset) {
    case "all":
      return "all time";
    case "last_7_days":
      return "the last 7 days";
    case "last_3_months":
      return "the last 3 months";
    case "custom":
      return "the selected period";
    default:
      return "the last 30 days";
  }
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

export function buildJobsAnalyticsInsight(input: {
  preset: JobsAnalyticsPreset;
  jobsCreated: number;
  previousJobsCreated: number;
  applications: number;
  previousApplications: number;
  pendingApprovalJobs: number;
  expiringSoonJobs: number;
}): OperationsJobsAnalyticsInsight {
  const periodLabel = formatPeriodLabel(input.preset);
  const jobsChange = percentChange(input.jobsCreated, input.previousJobsCreated);
  const applicationsChange = percentChange(
    input.applications,
    input.previousApplications,
  );
  const statements: string[] = [];

  if (jobsChange !== null) {
    if (jobsChange > 0) {
      statements.push(
        `Job postings are up by ${jobsChange}% compared to the previous period.`,
      );
    } else if (jobsChange < 0) {
      statements.push(
        `Job postings are down by ${Math.abs(jobsChange)}% compared to the previous period.`,
      );
    } else {
      statements.push("Job postings are unchanged compared to the previous period.");
    }
  } else if (input.previousJobsCreated === 0 && input.jobsCreated > 0) {
    statements.push(
      `${input.jobsCreated} ${pluralize(input.jobsCreated, "job was", "jobs were")} created in ${periodLabel}. There were no job postings in the previous period, so a percentage change cannot be calculated.`,
    );
  } else if (input.jobsCreated === 0 && input.previousJobsCreated === 0) {
    statements.push(`No jobs were created in ${periodLabel} or the previous period.`);
  }

  if (applicationsChange !== null) {
    if (applicationsChange > 0) {
      statements.push(
        `Applications are up by ${applicationsChange}% compared to the previous period.`,
      );
    } else if (applicationsChange < 0) {
      statements.push(
        `Applications are down by ${Math.abs(applicationsChange)}% compared to the previous period.`,
      );
    }
  } else if (input.previousApplications === 0 && input.applications > 0) {
    statements.push(
      `${input.applications.toLocaleString("en-IN")} ${pluralize(input.applications, "application")} ${input.applications === 1 ? "was" : "were"} received in ${periodLabel}.`,
    );
  }

  if (input.pendingApprovalJobs > 0) {
    statements.push(
      `${input.pendingApprovalJobs.toLocaleString("en-IN")} ${pluralize(input.pendingApprovalJobs, "job")} ${input.pendingApprovalJobs === 1 ? "is" : "are"} pending approval.`,
    );
  }

  if (input.expiringSoonJobs > 0) {
    statements.push(
      `${input.expiringSoonJobs.toLocaleString("en-IN")} ${pluralize(input.expiringSoonJobs, "job")} expire within 7 days.`,
    );
  }

  return {
    headline:
      statements[0] ??
      `No calculated insight is available for ${periodLabel}.`,
    detail: statements.slice(1).join(" "),
    jobsCreatedChangePercent: jobsChange,
    applicationsChangePercent: applicationsChange,
    trendDirection:
      jobsChange === null ? null : jobsChange > 0 ? "up" : jobsChange < 0 ? "down" : "flat",
  };
}

function seriesKey(date: Date, granularity: JobsAnalyticsGranularity): string {
  if (granularity === "month") {
    return toIsoDate(startOfMonth(date));
  }
  if (granularity === "week") {
    return toIsoDate(startOfWeek(date));
  }
  return toIsoDate(startOfLocalDay(date));
}

function formatSeriesLabel(
  isoDate: string,
  granularity: JobsAnalyticsGranularity,
): string {
  const date = parseDateOnly(isoDate);
  if (!date) {
    return isoDate;
  }
  if (granularity === "month") {
    // e.g. "May 22" — short and readable for Overall monthly trends.
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function seriesCursorStart(
  from: Date,
  granularity: JobsAnalyticsGranularity,
): Date {
  if (granularity === "month") {
    return startOfMonth(from);
  }
  if (granularity === "week") {
    return startOfWeek(from);
  }
  return startOfLocalDay(from);
}

function advanceSeriesCursor(
  cursor: Date,
  granularity: JobsAnalyticsGranularity,
): Date {
  if (granularity === "month") {
    return addMonths(cursor, 1);
  }
  if (granularity === "week") {
    return addDays(cursor, 7);
  }
  return addDays(cursor, 1);
}

/**
 * Overall KPIs stay all-time, but the trend chart only plots the last 12 months
 * so bars stay thick and readable.
 */
function trendFillFrom(
  range: OperationsJobsAnalyticsRange,
): Date {
  const from = new Date(range.from);
  const to = new Date(range.to);
  if (range.preset !== "all") {
    return from;
  }
  const twelveMonthsAgo = startOfMonth(to);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  return twelveMonthsAgo.getTime() > from.getTime() ? twelveMonthsAgo : from;
}

export function fillTimeSeries(
  rows: Array<{ key: string; count: number }>,
  range: OperationsJobsAnalyticsRange,
): OperationsJobsAnalyticsSeriesPoint[] {
  const counts = new Map(rows.map((row) => [row.key, row.count]));
  const points: OperationsJobsAnalyticsSeriesPoint[] = [];
  const from = trendFillFrom(range);
  const to = new Date(range.to);
  let cursor = seriesCursorStart(from, range.granularity);
  const end = startOfLocalDay(to);

  while (cursor.getTime() <= end.getTime()) {
    const key = seriesKey(cursor, range.granularity);
    points.push({
      date: key,
      label: formatSeriesLabel(key, range.granularity),
      count: counts.get(key) ?? 0,
    });
    cursor = advanceSeriesCursor(cursor, range.granularity);
  }

  return points;
}

export function fillPostingsTrend(
  createdRows: Array<{ key: string; count: number }>,
  approvedRows: Array<{ key: string; count: number }>,
  range: OperationsJobsAnalyticsRange,
): OperationsJobsPostingsTrendPoint[] {
  const createdCounts = new Map(createdRows.map((row) => [row.key, row.count]));
  const approvedCounts = new Map(
    approvedRows.map((row) => [row.key, row.count]),
  );
  const points: OperationsJobsPostingsTrendPoint[] = [];
  const from = trendFillFrom(range);
  const to = new Date(range.to);
  let cursor = seriesCursorStart(from, range.granularity);
  const end = startOfLocalDay(to);

  while (cursor.getTime() <= end.getTime()) {
    const key = seriesKey(cursor, range.granularity);
    points.push({
      date: key,
      label: formatSeriesLabel(key, range.granularity),
      jobsPosted: createdCounts.get(key) ?? 0,
      jobsApproved: approvedCounts.get(key) ?? 0,
    });
    cursor = advanceSeriesCursor(cursor, range.granularity);
  }

  return points;
}

function namedCountsFromMap(
  counts: Map<string, number>,
  order: string[],
  labelFor: (key: string) => string,
  includeZero: boolean,
  totalForPercent?: number,
): OperationsJobsAnalyticsNamedCount[] {
  const keys = [
    ...order,
    ...[...counts.keys()].filter((key) => !order.includes(key)),
  ];
  return keys
    .map((key) => {
      const count = counts.get(key) ?? 0;
      const item: OperationsJobsAnalyticsNamedCount = {
        key,
        label: labelFor(key),
        count,
      };
      if (totalForPercent !== undefined) {
        item.percent = sharePercent(count, totalForPercent);
      }
      return item;
    })
    .filter((item) => includeZero || item.count > 0);
}

async function loadDailyCounts(
  model: Pick<mongoose.Model<unknown>, "aggregate">,
  dateField: string,
  from: Date,
  to: Date,
  granularity: JobsAnalyticsGranularity,
): Promise<Array<{ key: string; count: number }>> {
  const dateExpression =
    granularity === "month"
      ? {
          $dateTrunc: {
            date: `$${dateField}`,
            unit: "month",
          },
        }
      : granularity === "week"
        ? {
            $dateTrunc: {
              date: `$${dateField}`,
              unit: "week",
              startOfWeek: "Monday",
            },
          }
        : {
            $dateTrunc: {
              date: `$${dateField}`,
              unit: "day",
            },
          };

  const rows = await model.aggregate<{ _id: Date; count: number }>([
    {
      $match: {
        [dateField]: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: dateExpression,
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows
    .filter((row) => row._id)
    .map((row) => ({
      key: seriesKey(new Date(row._id), granularity),
      count: row.count,
    }));
}

/**
 * Prefer publishedAt; when missing, count reviewedAt for active / approved jobs.
 */
async function loadApprovedDailyCounts(
  from: Date,
  to: Date,
  granularity: JobsAnalyticsGranularity,
): Promise<Array<{ key: string; count: number }>> {
  const dateExpression =
    granularity === "month"
      ? {
          $dateTrunc: {
            date: "$approvedAt",
            unit: "month",
          },
        }
      : granularity === "week"
        ? {
            $dateTrunc: {
              date: "$approvedAt",
              unit: "week",
              startOfWeek: "Monday",
            },
          }
        : {
            $dateTrunc: {
              date: "$approvedAt",
              unit: "day",
            },
          };

  const rows = await JobModel.aggregate<{ _id: Date; count: number }>([
    {
      $addFields: {
        approvedAt: {
          $cond: [
            { $ne: ["$publishedAt", null] },
            "$publishedAt",
            {
              $cond: [
                {
                  $and: [
                    { $ne: ["$reviewedAt", null] },
                    {
                      $or: [
                        { $eq: ["$status", "active"] },
                        { $eq: ["$reviewDecision", "approved"] },
                      ],
                    },
                  ],
                },
                "$reviewedAt",
                null,
              ],
            },
          ],
        },
      },
    },
    {
      $match: {
        approvedAt: { $gte: from, $lte: to },
      },
    },
    {
      $group: {
        _id: dateExpression,
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows
    .filter((row) => row._id)
    .map((row) => ({
      key: seriesKey(new Date(row._id), granularity),
      count: row.count,
    }));
}

export async function loadJobsAnalyticsCharts(
  query: OperationsJobsAnalyticsQuery,
  kpis: OperationsJobsKpis,
): Promise<Omit<OperationsJobsAnalyticsResult, "kpis">> {
  const range = resolveJobsAnalyticsDateRange(query);
  const from = new Date(range.from);
  const to = new Date(range.to);
  const previousFrom = new Date(range.previousFrom);
  const previousTo = new Date(range.previousTo);
  const now = new Date();
  const recentlyClosedFrom = new Date(now.getTime() - 30 * MS_PER_DAY);

  const [
    statusRows,
    paymentRows,
    locationStateRows,
    locationCityRows,
    locationTopRows,
    jobTypeRows,
    createdRows,
    previousCreatedRows,
    approvedRows,
    applicationRows,
    previousApplicationRows,
    topJobRows,
    expiringBuckets,
    totalApplications,
    industryRows,
    jobRoleRows,
    recentlyClosedCount,
  ] = await Promise.all([
    JobModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$listingPaymentStatus", count: { $sum: 1 } } },
    ]),
    JobModel.aggregate<{
      _id: { state: string; city: string };
      count: number;
    }>([
      {
        $project: {
          state: {
            $trim: { input: { $ifNull: ["$stateName", ""] } },
          },
          city: {
            $trim: { input: { $ifNull: ["$cityName", ""] } },
          },
        },
      },
      {
        $match: {
          $or: [{ state: { $ne: "" } }, { city: { $ne: "" } }],
        },
      },
      {
        $group: {
          _id: { state: "$state", city: "$city" },
          count: { $sum: 1 },
        },
      },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $project: {
          cityName: {
            $trim: { input: { $ifNull: ["$cityName", ""] } },
          },
        },
      },
      { $match: { cityName: { $ne: "" } } },
      { $group: { _id: "$cityName", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 12 },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $project: {
          location: {
            $let: {
              vars: {
                city: { $trim: { input: { $ifNull: ["$cityName", ""] } } },
                state: { $trim: { input: { $ifNull: ["$stateName", ""] } } },
              },
              in: {
                $cond: [
                  {
                    $and: [{ $ne: ["$$city", ""] }, { $ne: ["$$state", ""] }],
                  },
                  { $concat: ["$$city", ", ", "$$state"] },
                  {
                    $cond: [
                      { $ne: ["$$city", ""] },
                      "$$city",
                      {
                        $cond: [{ $ne: ["$$state", ""] }, "$$state", ""],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $match: { location: { $ne: "" } } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $project: {
          jobType: {
            $trim: { input: { $ifNull: ["$jobType", ""] } },
          },
        },
      },
      { $group: { _id: "$jobType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    loadDailyCounts(JobModel, "createdAt", from, to, range.granularity),
    loadDailyCounts(
      JobModel,
      "createdAt",
      previousFrom,
      previousTo,
      range.granularity,
    ),
    loadApprovedDailyCounts(from, to, range.granularity),
    loadDailyCounts(
      ApplicationModel,
      "appliedAt",
      from,
      to,
      range.granularity,
    ),
    loadDailyCounts(
      ApplicationModel,
      "appliedAt",
      previousFrom,
      previousTo,
      range.granularity,
    ),
    ApplicationModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
      jobTitle?: string;
      publicJobId?: string;
    }>([
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          count: 1,
          jobTitle: "$job.jobTitle",
          publicJobId: "$job.jobId",
        },
      },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          listingValidUntil: { $ne: null, $gt: now },
        },
      },
      {
        $addFields: {
          daysUntilExpiry: {
            $divide: [
              { $subtract: ["$listingValidUntil", now] },
              MS_PER_DAY,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lte: ["$daysUntilExpiry", 3] }, then: "d1_3" },
                { case: { $lte: ["$daysUntilExpiry", 7] }, then: "d4_7" },
                { case: { $lte: ["$daysUntilExpiry", 14] }, then: "d8_14" },
              ],
              default: "gt_14",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    ApplicationModel.countDocuments({}),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $project: {
          industryKey: {
            $let: {
              vars: {
                category: {
                  $trim: { input: { $ifNull: ["$businessCategory", ""] } },
                },
                industry: {
                  $trim: { input: { $ifNull: ["$industry", ""] } },
                },
              },
              in: {
                $cond: [
                  { $ne: ["$$category", ""] },
                  "$$category",
                  "$$industry",
                ],
              },
            },
          },
        },
      },
      { $match: { industryKey: { $ne: "" } } },
      { $group: { _id: "$industryKey", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $project: {
          role: {
            $trim: { input: { $ifNull: ["$jobTitle", ""] } },
          },
        },
      },
      { $match: { role: { $ne: "" } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
    ]),
    JobModel.countDocuments({
      status: "closed",
      $or: [
        { closedAt: { $gte: recentlyClosedFrom, $lte: now } },
        { updatedAt: { $gte: recentlyClosedFrom, $lte: now } },
      ],
    }),
  ]);

  const statusCounts = new Map(
    statusRows.map((row) => [String(row._id), row.count]),
  );
  const paymentCounts = new Map(
    paymentRows.map((row) => [String(row._id), row.count]),
  );
  const jobTypeCounts = new Map(
    jobTypeRows.map((row) => [String(row._id ?? ""), row.count]),
  );

  const jobsCreated = createdRows.reduce((sum, row) => sum + row.count, 0);
  const previousJobsCreated = previousCreatedRows.reduce(
    (sum, row) => sum + row.count,
    0,
  );
  const applications = applicationRows.reduce((sum, row) => sum + row.count, 0);
  const previousApplications = previousApplicationRows.reduce(
    (sum, row) => sum + row.count,
    0,
  );

  const expiringMap = new Map(
    expiringBuckets.map((row) => [String(row._id), row.count]),
  );

  const expiringSoon: OperationsJobsAnalyticsNamedCount[] = [
    { key: "d1_3", label: "1–3 days", count: expiringMap.get("d1_3") ?? 0 },
    { key: "d4_7", label: "4–7 days", count: expiringMap.get("d4_7") ?? 0 },
    { key: "d8_14", label: "8–14 days", count: expiringMap.get("d8_14") ?? 0 },
    { key: "gt_14", label: ">14 days", count: expiringMap.get("gt_14") ?? 0 },
  ];

  const maxApplications = topJobRows.reduce(
    (max, row) => Math.max(max, row.count),
    0,
  );

  const topPerformingJobs: OperationsJobsAnalyticsChartPoint[] = topJobRows
    .filter((row) => row.count > 0)
    .map((row) => ({
      key: row.publicJobId || String(row._id),
      label: row.jobTitle?.trim() || row.publicJobId || "Untitled job",
      count: row.count,
      percentage:
        maxApplications > 0 ? Math.round((row.count / maxApplications) * 100) : 0,
    }));

  const stateCounts = new Map<string, number>();
  for (const row of locationStateRows) {
    const label = resolveIndiaStateLabel(row._id.state, row._id.city);
    if (label === "Unspecified") {
      continue;
    }
    stateCounts.set(label, (stateCounts.get(label) ?? 0) + row.count);
  }
  const jobsByLocationStates: OperationsJobsAnalyticsNamedCount[] = Array.from(
    stateCounts.entries(),
  )
    .map(([label, count]) => ({
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const jobsByLocationCities: OperationsJobsAnalyticsNamedCount[] =
    locationCityRows.map((row) => ({
      key: row._id.toLowerCase().replace(/\s+/g, "-"),
      label: row._id,
      count: row.count,
    }));

  const jobsByLocationTop: OperationsJobsAnalyticsNamedCount[] =
    locationTopRows.map((row) => ({
      key: row._id.toLowerCase().replace(/\s+/g, "-"),
      label: row._id,
      count: row.count,
    }));

  const jobsByLocation: OperationsJobsLocationAnalytics = {
    states: jobsByLocationStates,
    cities: jobsByLocationCities,
    topLocations: jobsByLocationTop,
  };

  const percentBase = Math.max(kpis.totalJobs, 1);
  const jobsByIndustry: OperationsJobsAnalyticsNamedCount[] = industryRows.map(
    (row) => ({
      key: row._id,
      label: row._id,
      count: row.count,
      percent: sharePercent(row.count, percentBase),
    }),
  );

  const topJobRoles: OperationsJobsAnalyticsNamedCount[] = jobRoleRows.map(
    (row) => ({
      key: row._id,
      label: row._id,
      count: row.count,
      percent: sharePercent(row.count, percentBase),
    }),
  );

  const averageApplicationsPerJob =
    kpis.totalJobs > 0
      ? Math.round((totalApplications / kpis.totalJobs) * 10) / 10
      : 0;

  const statusTotal = [...statusCounts.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const employmentTypeTotal = [...jobTypeCounts.values()].reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    range,
    status: namedCountsFromMap(
      statusCounts,
      STATUS_ORDER,
      jobStatusAnalyticsLabel,
      true,
      statusTotal,
    ).filter((item) => JOB_STATUSES.includes(item.key as JobStatus)),
    payment: namedCountsFromMap(
      paymentCounts,
      PAYMENT_ORDER,
      paymentStatusAnalyticsLabel,
      true,
    ).filter((item) =>
      JOB_LISTING_PAYMENT_STATUSES.includes(item.key as JobListingPaymentStatus),
    ),
    jobsCreated: fillTimeSeries(createdRows, range),
    applicationsTrend: fillTimeSeries(applicationRows, range),
    applicationSummary: {
      totalApplications: applications,
      previousTotalApplications: previousApplications,
      averageApplicationsPerJob,
      changePercent: percentChange(applications, previousApplications),
    },
    jobsByLocation,
    jobsByEmploymentType: namedCountsFromMap(
      jobTypeCounts,
      [...JOB_TYPES, ""],
      jobTypeAnalyticsLabel,
      false,
      employmentTypeTotal,
    ),
    topPerformingJobs,
    jobsExpiringSoon: expiringSoon,
    insight: buildJobsAnalyticsInsight({
      preset: range.preset,
      jobsCreated,
      previousJobsCreated,
      applications,
      previousApplications,
      pendingApprovalJobs: kpis.pendingApprovalJobs,
      expiringSoonJobs: expiringSoon
        .filter((item) => item.key === "d1_3" || item.key === "d4_7")
        .reduce((sum, item) => sum + item.count, 0),
    }),
    totals: {
      jobsCreated,
      previousJobsCreated,
      applications,
      previousApplications,
    },
    postingsTrend: fillPostingsTrend(createdRows, approvedRows, range),
    jobsByIndustry,
    topJobRoles,
    overviewTabs: {
      all: kpis.totalJobs,
      pending_approval: kpis.pendingApprovalJobs,
      at_risk: kpis.atRiskJobs,
      recently_closed: recentlyClosedCount,
    },
  };
}
