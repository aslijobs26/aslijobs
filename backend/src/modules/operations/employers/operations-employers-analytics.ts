import { EmployerModel } from "../../employers/employer.model.js";
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
  "all",
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

/** Format a Date as YYYY-MM-DD in Asia/Kolkata (matches Mongo `$dateToString` timezone). */
function toKolkataIsoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Monday-based week start in Asia/Kolkata, returned as YYYY-MM-DD. */
function startOfWeekKolkataIso(date: Date): string {
  const iso = toKolkataIsoDate(date);
  const [year, month, day] = iso.split("-").map(Number);
  // Noon UTC avoids DST edge cases when deriving weekday for the IST calendar day.
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = noonUtc.getUTCDay(); // 0=Sun … 6=Sat for that calendar date
  const offset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
  return [
    monday.getUTCFullYear(),
    String(monday.getUTCMonth() + 1).padStart(2, "0"),
    String(monday.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function seriesBucketLabel(
  isoDate: string,
  granularity: "day" | "week" | "month" = "day",
): string {
  const date = parseDateOnly(isoDate);
  if (!date) {
    return isoDate;
  }
  if (granularity === "month") {
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }
  // Keep axis labels short (e.g. "20 May") for daily and weekly buckets.
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function addDaysIso(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function startOfMonthKolkataIso(date: Date): string {
  const iso = toKolkataIsoDate(date);
  return `${iso.slice(0, 7)}-01`;
}

function addMonthsIso(isoDate: string, months: number): string {
  const [year, month] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + months, 1, 12, 0, 0));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");
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

function periodCaption(preset: EmployersAnalyticsPreset): string {
  switch (preset) {
    case "all":
      return "All time";
    case "last_7_days":
      return "In last 7 days";
    case "last_90_days":
      return "In last 90 days";
    case "this_year":
      return "This year";
    case "custom":
      return "In selected range";
    default:
      return "In last 30 days";
  }
}

function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function createdAtRangeFilter(from: Date, to: Date): Record<string, unknown> {
  return { createdAt: { $gte: from, $lte: to } };
}

const VERIFIED_EMPLOYER_FILTER: Record<string, unknown> = {
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

const ACTIVE_STATUS_FILTER: Record<string, unknown> = {
  $or: [
    { status: "active" },
    { status: { $exists: false } },
    { status: null },
  ],
};

const PENDING_VERIFICATION_FILTER: Record<string, unknown> = {
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
};

const INACTIVE_STATUS_FILTER: Record<string, unknown> = {
  $or: [{ status: "inactive" }, { registrationStatus: "pending_otp" }],
};

function jobLocationExpression() {
  return {
    $cond: [
      {
        $and: [{ $ne: ["$city", null] }, { $ne: ["$city", ""] }],
      },
      "$city",
      {
        $cond: [
          {
            $and: [{ $ne: ["$cityName", null] }, { $ne: ["$cityName", ""] }],
          },
          "$cityName",
          "Unspecified",
        ],
      },
    ],
  };
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
    case "all": {
      // Placeholder from; refined to earliest employer when loading analytics.
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
    granularity:
      preset === "all"
        ? "month"
        : durationMs > 62 * MS_PER_DAY
          ? "week"
          : "day",
  };
}

function buildSeries(
  from: Date,
  to: Date,
  granularity: "day" | "week" | "month",
  registeredMap: Map<string, number>,
  verifiedMap: Map<string, number>,
): OperationsEmployersAnalyticsSeriesPoint[] {
  const points: OperationsEmployersAnalyticsSeriesPoint[] = [];
  let cursorKey =
    granularity === "month"
      ? startOfMonthKolkataIso(from)
      : granularity === "week"
        ? startOfWeekKolkataIso(from)
        : toKolkataIsoDate(from);
  const endKey = toKolkataIsoDate(to);

  while (cursorKey <= endKey) {
    points.push({
      date: cursorKey,
      label: seriesBucketLabel(cursorKey, granularity),
      newRegistrations: registeredMap.get(cursorKey) ?? 0,
      verifiedEmployers: verifiedMap.get(cursorKey) ?? 0,
    });
    cursorKey =
      granularity === "month"
        ? addMonthsIso(cursorKey, 1)
        : addDaysIso(cursorKey, granularity === "week" ? 7 : 1);
  }

  return points;
}

function dateBucketExpression(
  field: "createdAt" | "verifiedAt",
  granularity: "day" | "week" | "month",
) {
  const truncated =
    granularity === "month"
      ? {
          $dateTrunc: {
            date: `$${field}`,
            unit: "month" as const,
            binSize: 1,
            timezone: "Asia/Kolkata",
          },
        }
      : granularity === "week"
        ? {
            $dateTrunc: {
              date: `$${field}`,
              unit: "week" as const,
              binSize: 1,
              startOfWeek: "Monday" as const,
              timezone: "Asia/Kolkata",
            },
          }
        : {
            $dateTrunc: {
              date: `$${field}`,
              unit: "day" as const,
              binSize: 1,
              timezone: "Asia/Kolkata",
            },
          };

  return {
    $dateToString: {
      format: "%Y-%m-%d",
      date: truncated,
      timezone: "Asia/Kolkata",
    },
  };
}

export async function getOperationsEmployersAnalytics(
  query: OperationsEmployersAnalyticsQuery,
): Promise<OperationsEmployersAnalyticsResult> {
  const resolved = resolveEmployersAnalyticsDateRange({
    preset: query.preset,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });

  const isOverall = resolved.preset === "all";
  let from = new Date(resolved.from);
  let to = new Date(resolved.to);
  let granularity = resolved.granularity;
  const previousFrom = new Date(resolved.previousFrom);
  const previousTo = new Date(resolved.previousTo);
  const now = new Date();
  const last30Start = startOfLocalDay(now);
  last30Start.setDate(last30Start.getDate() - 29);
  const caption = periodCaption(resolved.preset);

  if (isOverall) {
    const earliest = await EmployerModel.findOne()
      .sort({ createdAt: 1 })
      .select({ createdAt: 1 })
      .lean();
    from = earliest?.createdAt
      ? startOfLocalDay(new Date(earliest.createdAt))
      : startOfLocalDay(now);
    // Overall always uses monthly buckets so registration bars stay thick.
    granularity = "month";
  }

  const range: OperationsEmployersAnalyticsRange = {
    ...resolved,
    from: from.toISOString(),
    to: to.toISOString(),
    granularity,
  };

  const cohortFilter = isOverall ? {} : createdAtRangeFilter(from, to);
  const previousCohortFilter = isOverall
    ? { _id: { $exists: false } }
    : createdAtRangeFilter(previousFrom, previousTo);
  /** Employers that existed by the end of the selected / previous period. */
  const networkAsOfFilter = isOverall ? {} : { createdAt: { $lte: to } };
  const previousNetworkAsOfFilter = isOverall
    ? { _id: { $exists: false } }
    : { createdAt: { $lte: previousTo } };

  const [
    // Network size KPIs (as-of end of period)
    totalEmployers,
    previousTotalEmployers,
    // Period cohort / activity KPIs
    newRegistrations,
    previousNewRegistrations,
    verifiedEmployers,
    previousVerifiedEmployers,
    employersWithJobsInRange,
    previousEmployersWithJobs,
    hiringEmployerIds,
    previousHiringIds,
    registrationBuckets,
    employersWithDocuments,
    accountTypeRows,
    locationDocs,
    sizeDocs,
    hiringLocationRows,
    jobsInRangeCount,
    // Operational tab badges stay all-time (table filters are independent of analytics range)
    tabAllCount,
    tabNewCount,
    tabPendingCount,
    tabActiveCount,
    tabInactiveCount,
  ] = await Promise.all([
    EmployerModel.countDocuments(networkAsOfFilter),
    EmployerModel.countDocuments(previousNetworkAsOfFilter),
    EmployerModel.countDocuments(
      isOverall
        ? createdAtRangeFilter(last30Start, endOfLocalDay(now))
        : cohortFilter,
    ),
    EmployerModel.countDocuments(
      isOverall
        ? createdAtRangeFilter(
            addDaysLocal(last30Start, -30),
            endOfLocalDay(addDaysLocal(last30Start, -1)),
          )
        : previousCohortFilter,
    ),
    EmployerModel.countDocuments({
      ...cohortFilter,
      ...VERIFIED_EMPLOYER_FILTER,
    }),
    EmployerModel.countDocuments({
      ...previousCohortFilter,
      ...VERIFIED_EMPLOYER_FILTER,
    }),
    JobModel.distinct(
      "employerId",
      isOverall
        ? createdAtRangeFilter(last30Start, endOfLocalDay(now))
        : createdAtRangeFilter(from, to),
    ),
    JobModel.distinct(
      "employerId",
      isOverall
        ? { _id: { $exists: false } }
        : createdAtRangeFilter(previousFrom, previousTo),
    ),
    JobModel.distinct(
      "employerId",
      isOverall
        ? { status: "active" }
        : {
            status: "active",
            ...createdAtRangeFilter(from, to),
          },
    ),
    JobModel.distinct(
      "employerId",
      isOverall
        ? { _id: { $exists: false } }
        : {
            status: "active",
            ...createdAtRangeFilter(previousFrom, previousTo),
          },
    ),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      { $match: cohortFilter },
      { $group: { _id: "$registrationStatus", count: { $sum: 1 } } },
    ]),
    EmployerModel.aggregate<{ count: number }>([
      { $match: cohortFilter },
      {
        $lookup: {
          from: "employer_documents",
          localField: "_id",
          foreignField: "employerId",
          as: "documents",
        },
      },
      {
        $match: {
          $or: [
            { "documents.0": { $exists: true } },
            {
              registrationStatus: {
                $in: ["document_uploaded", "completed"],
              },
            },
          ],
        },
      },
      { $count: "count" },
    ]),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      { $match: cohortFilter },
      {
        $group: {
          _id: {
            $let: {
              vars: {
                raw: {
                  $toLower: {
                    $trim: { input: { $ifNull: ["$accountType", ""] } },
                  },
                },
              },
              in: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$$raw", "consultancy"] },
                      then: "consultancy",
                    },
                    {
                      case: { $eq: ["$$raw", "individual"] },
                      then: "individual",
                    },
                    {
                      case: { $eq: ["$$raw", "company"] },
                      then: "company",
                    },
                  ],
                  default: "unspecified",
                },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    EmployerModel.find(cohortFilter).select({ state: 1, city: 1 }).lean(),
    EmployerModel.find(cohortFilter)
      .select({ minimumEmployees: 1, maximumEmployees: 1 })
      .lean(),
    JobModel.aggregate<{ _id: string; count: number }>([
      {
        $match: isOverall
          ? { status: "active" }
          : createdAtRangeFilter(from, to),
      },
      {
        $group: {
          _id: jobLocationExpression(),
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    JobModel.countDocuments(
      isOverall ? { status: "active" } : createdAtRangeFilter(from, to),
    ),
    EmployerModel.countDocuments({}),
    EmployerModel.countDocuments({
      createdAt: { $gte: last30Start, $lte: endOfLocalDay(now) },
    }),
    EmployerModel.countDocuments(PENDING_VERIFICATION_FILTER),
    EmployerModel.countDocuments(ACTIVE_STATUS_FILTER),
    EmployerModel.countDocuments(INACTIVE_STATUS_FILTER),
  ]);
  const activeEmployers = employersWithJobsInRange.filter(Boolean).length;
  const previousActiveEmployers = previousEmployersWithJobs.filter(Boolean).length;
  const employersHiring = hiringEmployerIds.filter(Boolean).length;
  const previousHiring = previousHiringIds.filter(Boolean).length;
  const documentsUploaded = employersWithDocuments[0]?.count ?? 0;
  // Funnel / account type / location use the full cohort (all employers when Overall).
  const periodCohortSize = isOverall ? totalEmployers : newRegistrations;
  const verifiedPercent = percentOf(verifiedEmployers, periodCohortSize);

  const kpis: OperationsEmployersOverviewKpis = {
    totalEmployers,
    totalEmployersTrendPercent: isOverall
      ? null
      : percentChange(totalEmployers, previousTotalEmployers),
    totalEmployersCaption: isOverall
      ? "Across the network"
      : newRegistrations > 0
        ? `+${newRegistrations.toLocaleString("en-IN")} ${caption.toLowerCase()}`
        : caption,
    newRegistrations,
    newRegistrationsTrendPercent: percentChange(
      newRegistrations,
      previousNewRegistrations,
    ),
    newRegistrationsCaption: isOverall
      ? previousNewRegistrations > 0
        ? `${previousNewRegistrations.toLocaleString("en-IN")} in prior 30 days`
        : "In last 30 days"
      : previousNewRegistrations > 0
        ? `${previousNewRegistrations.toLocaleString("en-IN")} in prior period`
        : caption,
    verifiedEmployers,
    verifiedEmployersTrendPercent: isOverall
      ? null
      : percentChange(verifiedEmployers, previousVerifiedEmployers),
    verifiedEmployersPercent: verifiedPercent,
    verifiedEmployersCaption:
      verifiedPercent == null
        ? caption
        : isOverall
          ? `${verifiedPercent}% of total`
          : `${verifiedPercent}% of new registrations`,
    activeEmployers,
    activeEmployersTrendPercent: isOverall
      ? null
      : percentChange(activeEmployers, previousActiveEmployers),
    activeEmployersCaption: isOverall
      ? "Posted jobs in last 30 days"
      : "Posted jobs in period",
    employersHiring,
    employersHiringTrendPercent: isOverall
      ? null
      : percentChange(employersHiring, previousHiring),
    employersHiringCaption: isOverall
      ? "Have active job postings"
      : "Active jobs posted in period",
  };

  const registeredDateBucket = dateBucketExpression("createdAt", granularity);
  const verifiedDateBucket = dateBucketExpression("verifiedAt", granularity);

  const [registeredSeriesRows, verifiedSeriesRows, pendingInCohort] =
    await Promise.all([
      EmployerModel.aggregate<{ _id: string; count: number }>([
        { $match: cohortFilter },
        { $group: { _id: registeredDateBucket, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      EmployerModel.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            verificationStatus: "verified",
            verifiedAt: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: verifiedDateBucket, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      EmployerModel.countDocuments({
        $and: [cohortFilter, PENDING_VERIFICATION_FILTER],
      }),
    ]);

  const registeredMap = new Map<string, number>();
  for (const row of registeredSeriesRows) {
    if (!row._id) continue;
    registeredMap.set(String(row._id), (registeredMap.get(String(row._id)) ?? 0) + row.count);
  }

  const verifiedMap = new Map<string, number>();
  for (const row of verifiedSeriesRows) {
    if (!row._id) continue;
    verifiedMap.set(String(row._id), (verifiedMap.get(String(row._id)) ?? 0) + row.count);
  }

  // Overall KPIs stay all-time; trend chart uses the last 12 months for readable bars.
  let trendFrom = from;
  if (isOverall) {
    const twelveMonthsAgo = new Date(to);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    trendFrom =
      twelveMonthsAgo.getTime() > from.getTime()
        ? startOfLocalDay(twelveMonthsAgo)
        : from;
  }

  const registrationTrend = buildSeries(
    trendFrom,
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

  const funnelBase = Math.max(periodCohortSize, 1);
  const profileCompletedCount = Math.min(
    profileCompleted || periodCohortSize,
    periodCohortSize,
  );
  const documentsUploadedCount = Math.min(documentsUploaded, periodCohortSize);

  const onboardingFunnel = [
    {
      id: "registered",
      label: "Registered",
      count: periodCohortSize,
      percent: periodCohortSize > 0 ? 100 : 0,
    },
    {
      id: "profile_completed",
      label: "Profile Completed",
      count: profileCompletedCount,
      percent: percentOf(profileCompletedCount, funnelBase) ?? 0,
    },
    {
      id: "documents_submitted",
      label: "Documents Uploaded",
      count: documentsUploadedCount,
      percent: percentOf(documentsUploadedCount, funnelBase) ?? 0,
    },
    {
      id: "verification_in_progress",
      label: "Verification in Progress",
      count: pendingInCohort,
      percent: percentOf(pendingInCohort, funnelBase) ?? 0,
    },
    {
      id: "verified",
      label: "Verified",
      count: verifiedEmployers,
      percent: percentOf(verifiedEmployers, funnelBase) ?? 0,
    },
  ];

  const ACCOUNT_TYPE_BUCKETS = [
    { id: "company", label: "Company Accounts" },
    { id: "consultancy", label: "Consultancy Accounts" },
    { id: "individual", label: "Individual Accounts" },
  ] as const;

  const accountTypeCountMap = new Map<string, number>();
  for (const row of accountTypeRows) {
    if (!row._id) continue;
    accountTypeCountMap.set(String(row._id), row.count);
  }

  const byAccountType: OperationsEmployersAnalyticsNamedCount[] =
    ACCOUNT_TYPE_BUCKETS.map((bucket) => {
      const count = accountTypeCountMap.get(bucket.id) ?? 0;
      return {
        id: bucket.id,
        label: bucket.label,
        count,
        percent: percentOf(count, periodCohortSize),
      };
    });

  const unspecifiedAccountTypeCount =
    accountTypeCountMap.get("unspecified") ?? 0;
  if (unspecifiedAccountTypeCount > 0) {
    byAccountType.push({
      id: "unspecified",
      label: "Unspecified",
      count: unspecifiedAccountTypeCount,
      percent: percentOf(unspecifiedAccountTypeCount, periodCohortSize),
    });
  }

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
      percent: percentOf(count, periodCohortSize),
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
        item.max == null
          ? size >= item.min
          : size >= item.min && size <= item.max,
      ) ?? SIZE_BUCKETS[0];
    sizeCounts.set(bucket.id, (sizeCounts.get(bucket.id) ?? 0) + 1);
  }

  const employerType = SIZE_BUCKETS.map((bucket) => {
    const count = sizeCounts.get(bucket.id) ?? 0;
    return {
      id: bucket.id,
      label: bucket.label,
      count,
      percent: percentOf(count, sizedTotal || periodCohortSize),
    };
  });

  const hiringPercentBase = Math.max(jobsInRangeCount, employersHiring, 1);
  const topHiringLocations: OperationsEmployersAnalyticsNamedCount[] =
    hiringLocationRows.map((row) => ({
      id: String(row._id || "Unspecified"),
      label: String(row._id || "Unspecified"),
      count: row.count,
      percent: percentOf(row.count, hiringPercentBase),
    }));

  return {
    range,
    kpis,
    registrationTrend,
    onboardingFunnel,
    byAccountType,
    byLocation,
    employerType,
    employerTypeTotal: sizedTotal || periodCohortSize,
    topHiringLocations,
    tabs: {
      all: tabAllCount,
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
