import { EmployerModel } from "../../employers/employer.model.js";
import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { resolveIndiaStateLabel } from "./india-state-normalize.js";
import type {
  OperationsEmployersAnalyticsNamedCount,
  OperationsEmployersAnalyticsQuery,
  OperationsEmployersAnalyticsRange,
  OperationsEmployersAnalyticsResult,
  OperationsEmployersAnalyticsSeriesPoint,
  OperationsEmployersOverviewKpis,
} from "./operations-employers.types.js";

export const EMPLOYERS_ANALYTICS_PRESETS = [
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_year",
  "custom",
] as const;

export type EmployersAnalyticsPreset =
  (typeof EMPLOYERS_ANALYTICS_PRESETS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SIZE_BUCKETS = [
  { id: "sme", label: "SME (1–50)", min: 1, max: 50 },
  { id: "mid", label: "Mid-size (51–200)", min: 51, max: 200 },
  { id: "large", label: "Large (201–1,000)", min: 201, max: 1000 },
  { id: "enterprise", label: "Enterprise (1,000+)", min: 1001, max: null },
] as const;

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

function percentOf(part: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return Math.round((part / total) * 1000) / 10;
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

function humanizeIndustry(value: string): string {
  if (!value) {
    return "Others";
  }
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function employeeSize(doc: {
  minimumEmployees?: number | null;
  maximumEmployees?: number | null;
}): number | null {
  const max =
    typeof doc.maximumEmployees === "number" ? doc.maximumEmployees : null;
  const min =
    typeof doc.minimumEmployees === "number" ? doc.minimumEmployees : null;
  if (max != null && min != null) {
    return Math.round((max + min) / 2);
  }
  return max ?? min;
}

export function resolveEmployersAnalyticsDateRange(input: {
  preset: EmployersAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): OperationsEmployersAnalyticsRange {
  const now = input.now ?? new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date;
  let preset: EmployersAnalyticsPreset = input.preset;

  switch (input.preset) {
    case "last_7_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 6);
      to = todayEnd;
      break;
    }
    case "last_90_days": {
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 89);
      to = todayEnd;
      break;
    }
    case "this_year": {
      from = new Date(now.getFullYear(), 0, 1);
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
    default: {
      preset = "last_30_days";
      from = startOfLocalDay(now);
      from.setDate(from.getDate() - 29);
      to = todayEnd;
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
    granularity: durationMs > 62 * MS_PER_DAY ? "week" : "day",
  };
}

function buildSeries(
  from: Date,
  to: Date,
  granularity: "day" | "week",
  registeredMap: Map<string, number>,
  verifiedMap: Map<string, number>,
): OperationsEmployersAnalyticsSeriesPoint[] {
  const points: OperationsEmployersAnalyticsSeriesPoint[] = [];
  let cursor = startOfLocalDay(from);
  const end = startOfLocalDay(to);

  while (cursor.getTime() <= end.getTime()) {
    const key = toIsoDate(cursor);
    points.push({
      date: key,
      label:
        granularity === "week"
          ? `W/c ${cursor.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
          : cursor.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            }),
      newRegistrations: registeredMap.get(key) ?? 0,
      verifiedEmployers: verifiedMap.get(key) ?? 0,
    });
    cursor = addDays(cursor, granularity === "week" ? 7 : 1);
  }

  return points;
}

async function countInRange(
  field: "createdAt" | "verifiedAt",
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {},
): Promise<number> {
  return EmployerModel.countDocuments({
    ...extra,
    [field]: { $gte: from, $lte: to },
  });
}

export async function getOperationsEmployersAnalytics(
  query: OperationsEmployersAnalyticsQuery,
): Promise<OperationsEmployersAnalyticsResult> {
  const range = resolveEmployersAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });

  const from = new Date(range.from);
  const to = new Date(range.to);
  const previousFrom = new Date(range.previousFrom);
  const previousTo = new Date(range.previousTo);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);
  const weekStart = startOfLocalDay(now);
  weekStart.setDate(weekStart.getDate() - 6);
  const prevWeekStart = addDays(weekStart, -7);
  const prevWeekEnd = addDays(weekStart, -1);
  const last30Start = startOfLocalDay(now);
  last30Start.setDate(last30Start.getDate() - 29);

  const verifiedFilter = {
    $or: [
      { verificationStatus: "verified" },
      {
        $and: [
          { verificationStatus: { $in: [null, ""] } },
          { isWhatsappVerified: true },
          { registrationStatus: "completed" },
        ],
      },
    ],
  };

  const activeStatusFilter = {
    $or: [
      { status: "active" },
      { status: { $exists: false } },
      { status: null },
    ],
  };

  const [
    totalEmployers,
    newThisMonth,
    newPrevMonth,
    newRegistrations,
    previousNewRegistrations,
    newThisWeek,
    previousNewThisWeek,
    verifiedEmployers,
    employersWithJobsLast30,
    hiringEmployerIds,
    previousHiringCount,
    registrationBuckets,
    documentPendingCount,
    industryRows,
    locationDocs,
    sizeDocs,
    hiringLocationRows,
    tabNewCount,
    tabPendingCount,
    tabActiveCount,
    tabInactiveCount,
  ] = await Promise.all([
    EmployerModel.countDocuments({}),
    countInRange("createdAt", monthStart, endOfLocalDay(now)),
    countInRange("createdAt", prevMonthStart, endOfLocalDay(prevMonthEnd)),
    countInRange("createdAt", from, to),
    countInRange("createdAt", previousFrom, previousTo),
    countInRange("createdAt", weekStart, endOfLocalDay(now)),
    countInRange("createdAt", prevWeekStart, endOfLocalDay(prevWeekEnd)),
    EmployerModel.countDocuments(verifiedFilter),
    JobModel.distinct("employerId", {
      createdAt: { $gte: last30Start, $lte: endOfLocalDay(now) },
    }),
    JobModel.distinct("employerId", { status: "active" }),
    JobModel.distinct("employerId", {
      status: "active",
      updatedAt: { $gte: previousFrom, $lte: previousTo },
    }),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$registrationStatus", count: { $sum: 1 } } },
    ]),
    EmployerDocumentModel.countDocuments({ verificationStatus: "pending" }),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      {
        $group: {
          _id: {
            $cond: [
              {
                $or: [
                  { $eq: ["$industry", null] },
                  { $eq: ["$industry", ""] },
                ],
              },
              "others",
              { $toLower: "$industry" },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    EmployerModel.find({})
      .select({ state: 1, city: 1 })
      .lean(),
    EmployerModel.find({})
      .select({ minimumEmployees: 1, maximumEmployees: 1 })
      .lean(),
    JobModel.aggregate<{ _id: string; count: number }>([
      { $match: { status: "active" } },
      {
        $group: {
          _id: {
            $cond: [
              {
                $and: [
                  { $ne: ["$city", null] },
                  { $ne: ["$city", ""] },
                ],
              },
              "$city",
              {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$cityName", null] },
                      { $ne: ["$cityName", ""] },
                    ],
                  },
                  "$cityName",
                  "Unspecified",
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    EmployerModel.countDocuments({
      createdAt: { $gte: last30Start, $lte: endOfLocalDay(now) },
    }),
    EmployerModel.countDocuments({
      $or: [
        { verificationStatus: "pending" },
        {
          $and: [
            { verificationStatus: { $in: [null, ""] } },
            {
              $or: [
                { isWhatsappVerified: false },
                { registrationStatus: { $ne: "completed" } },
              ],
            },
          ],
        },
      ],
    }),
    EmployerModel.countDocuments(activeStatusFilter),
    EmployerModel.countDocuments({
      $or: [{ status: "inactive" }, { registrationStatus: "pending_otp" }],
    }),
  ]);

  // Fix verified prev month - simpler recount
  const verifiedThisMonth = await EmployerModel.countDocuments({
    verificationStatus: "verified",
    verifiedAt: { $gte: monthStart, $lte: endOfLocalDay(now) },
  });
  const verifiedLastMonth = await EmployerModel.countDocuments({
    verificationStatus: "verified",
    verifiedAt: { $gte: prevMonthStart, $lte: endOfLocalDay(prevMonthEnd) },
  });

  const activeEmployers = employersWithJobsLast30.filter(Boolean).length;
  const employersHiring = hiringEmployerIds.filter(Boolean).length;
  const previousHiring = previousHiringCount.filter(Boolean).length;

  const kpis: OperationsEmployersOverviewKpis = {
    totalEmployers,
    totalEmployersTrendPercent: percentChange(newThisMonth, newPrevMonth),
    totalEmployersCaption: `+${newThisMonth.toLocaleString("en-IN")} this month`,
    newRegistrations,
    newRegistrationsTrendPercent: percentChange(
      newThisWeek,
      previousNewThisWeek,
    ),
    newRegistrationsCaption: `+${newThisWeek.toLocaleString("en-IN")} this week`,
    verifiedEmployers,
    verifiedEmployersTrendPercent: percentChange(
      verifiedThisMonth,
      verifiedLastMonth,
    ),
    verifiedEmployersPercent: percentOf(verifiedEmployers, totalEmployers),
    verifiedEmployersCaption:
      percentOf(verifiedEmployers, totalEmployers) == null
        ? "Verified"
        : `${percentOf(verifiedEmployers, totalEmployers)}% of total`,
    activeEmployers,
    activeEmployersTrendPercent: null,
    activeEmployersCaption: "Posted jobs in last 30 days",
    employersHiring,
    employersHiringTrendPercent: percentChange(employersHiring, previousHiring),
    employersHiringCaption: "Have active job postings",
  };

  // Active employers trend: compare current 30d job-posting employers vs prior 30d
  const prior30Start = addDays(last30Start, -30);
  const prior30End = addDays(last30Start, -1);
  const priorActiveIds = await JobModel.distinct("employerId", {
    createdAt: { $gte: prior30Start, $lte: endOfLocalDay(prior30End) },
  });
  kpis.activeEmployersTrendPercent = percentChange(
    activeEmployers,
    priorActiveIds.filter(Boolean).length,
  );

  const dateFormat =
    range.granularity === "week"
      ? {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateTrunc: { date: "$createdAt", unit: "week", binSize: 1 },
            },
          },
        }
      : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };

  const verifiedDateFormat =
    range.granularity === "week"
      ? {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateTrunc: { date: "$verifiedAt", unit: "week", binSize: 1 },
            },
          },
        }
      : { $dateToString: { format: "%Y-%m-%d", date: "$verifiedAt" } };

  const [registeredSeriesRows, verifiedSeriesRows] = await Promise.all([
    EmployerModel.aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: dateFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          verificationStatus: "verified",
          verifiedAt: { $gte: from, $lte: to },
        },
      },
      { $group: { _id: verifiedDateFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const registeredMap = new Map(
    registeredSeriesRows
      .filter((row) => row._id)
      .map((row) => [row._id, row.count]),
  );
  const verifiedMap = new Map(
    verifiedSeriesRows
      .filter((row) => row._id)
      .map((row) => [row._id, row.count]),
  );

  const registrationTrend = buildSeries(
    from,
    to,
    range.granularity,
    registeredMap,
    verifiedMap,
  );

  const registrationStatusMap = new Map(
    registrationBuckets.map((row) => [String(row._id ?? ""), row.count]),
  );

  const profileCompleted =
    (registrationStatusMap.get("completed") ?? 0) +
    (registrationStatusMap.get("profile_incomplete") ?? 0) +
    (registrationStatusMap.get("document_uploaded") ?? 0) +
    (registrationStatusMap.get("otp_verified") ?? 0);

  const documentsSubmitted =
    (registrationStatusMap.get("document_uploaded") ?? 0) +
    (registrationStatusMap.get("completed") ?? 0) +
    documentPendingCount;

  const funnelBase = Math.max(totalEmployers, 1);
  const onboardingFunnel = [
    {
      id: "registered",
      label: "Registered",
      count: totalEmployers,
      percent: 100,
    },
    {
      id: "profile_completed",
      label: "Profile Completed",
      count: Math.min(profileCompleted || totalEmployers, totalEmployers),
      percent:
        percentOf(
          Math.min(profileCompleted || totalEmployers, totalEmployers),
          funnelBase,
        ) ?? 0,
    },
    {
      id: "documents_submitted",
      label: "Documents Uploaded",
      count: Math.min(documentsSubmitted, totalEmployers),
      percent:
        percentOf(Math.min(documentsSubmitted, totalEmployers), funnelBase) ??
        0,
    },
    {
      id: "verification_in_progress",
      label: "Verification in Progress",
      count: tabPendingCount,
      percent: percentOf(tabPendingCount, funnelBase) ?? 0,
    },
    {
      id: "verified",
      label: "Verified",
      count: verifiedEmployers,
      percent: percentOf(verifiedEmployers, funnelBase) ?? 0,
    },
  ];

  const byIndustry: OperationsEmployersAnalyticsNamedCount[] = industryRows.map(
    (row) => ({
      id: String(row._id),
      label: humanizeIndustry(String(row._id)),
      count: row.count,
      percent: percentOf(row.count, totalEmployers),
    }),
  );

  const locationCounts = new Map<string, number>();
  for (const doc of locationDocs) {
    const label = resolveIndiaStateLabel(doc.state, doc.city);
    locationCounts.set(label, (locationCounts.get(label) ?? 0) + 1);
  }
  const byLocation: OperationsEmployersAnalyticsNamedCount[] = Array.from(
    locationCounts.entries(),
  )
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
      percent: percentOf(count, totalEmployers),
    }))
    .sort((a, b) => {
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count;
    });

  const sizeCounts = new Map<string, number>(
    SIZE_BUCKETS.map((bucket) => [bucket.id, 0]),
  );
  let sizedTotal = 0;
  for (const doc of sizeDocs) {
    const size = employeeSize(doc);
    if (size == null || size <= 0) {
      continue;
    }
    sizedTotal += 1;
    const bucket =
      SIZE_BUCKETS.find((item) =>
        item.max == null ? size >= item.min : size >= item.min && size <= item.max,
      ) ?? SIZE_BUCKETS[0];
    sizeCounts.set(bucket.id, (sizeCounts.get(bucket.id) ?? 0) + 1);
  }

  const employerType = SIZE_BUCKETS.map((bucket) => {
    const count = sizeCounts.get(bucket.id) ?? 0;
    return {
      id: bucket.id,
      label: bucket.label,
      count,
      percent: percentOf(count, sizedTotal || totalEmployers),
    };
  });

  const topHiringLocations: OperationsEmployersAnalyticsNamedCount[] =
    hiringLocationRows.map((row) => ({
      id: String(row._id || "Unspecified"),
      label: String(row._id || "Unspecified"),
      count: row.count,
      percent: percentOf(row.count, Math.max(employersHiring, 1)),
    }));

  return {
    range,
    kpis,
    registrationTrend,
    onboardingFunnel,
    byIndustry,
    byLocation,
    employerType,
    employerTypeTotal: sizedTotal || totalEmployers,
    topHiringLocations,
    tabs: {
      all: totalEmployers,
      new: tabNewCount,
      verificationPending: tabPendingCount,
      active: tabActiveCount,
      inactive: tabInactiveCount,
    },
    comparisons: {
      newRegistrationsPrevious: previousNewRegistrations,
      newRegistrationsChangePercent: percentChange(
        newRegistrations,
        previousNewRegistrations,
      ),
    },
  };
}
