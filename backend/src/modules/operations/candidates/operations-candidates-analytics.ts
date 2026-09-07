import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import type {
  OperationsCandidatesAnalyticsNamedCount,
  OperationsCandidatesAnalyticsQuery,
  OperationsCandidatesAnalyticsRange,
  OperationsCandidatesAnalyticsResult,
  OperationsCandidatesAnalyticsSeriesPoint,
  OperationsCandidatesOverviewKpis,
} from "./operations-candidates.types.js";

export const CANDIDATES_ANALYTICS_PRESETS = [
  "all",
  "last_7_days",
  "last_30_days",
  "last_3_months",
  "custom",
] as const;

export type CandidatesAnalyticsPreset =
  (typeof CANDIDATES_ANALYTICS_PRESETS)[number];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const LANGUAGE_LABELS: Record<string, string> = {
  telugu: "Telugu",
  english: "English",
  hindi: "Hindi",
  kannada: "Kannada",
  tamil: "Tamil",
  malayalam: "Malayalam",
};

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

function toKolkataIsoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfWeekKolkataIso(date: Date): string {
  const iso = toKolkataIsoDate(date);
  const [year, month, day] = iso.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = noonUtc.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(Date.UTC(year, month - 1, day + offset, 12, 0, 0));
  return [
    monday.getUTCFullYear(),
    String(monday.getUTCMonth() + 1).padStart(2, "0"),
    String(monday.getUTCDate()).padStart(2, "0"),
  ].join("-");
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

function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function seriesBucketLabel(
  isoDate: string,
  granularity: "day" | "week" | "month" = "day",
): string {
  const date = parseDateOnly(isoDate);
  if (!date) return isoDate;
  if (granularity === "month") {
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
  if (total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function periodCaption(preset: CandidatesAnalyticsPreset): string {
  switch (preset) {
    case "all":
      return "All time";
    case "last_7_days":
      return "In last 7 days";
    case "last_3_months":
      return "In last 3 months";
    case "custom":
      return "In selected range";
    default:
      return "In last 30 days";
  }
}

function createdAtRangeFilter(from: Date, to: Date): Record<string, unknown> {
  return { createdAt: { $gte: from, $lte: to } };
}

function humanizeRole(value: string): string {
  if (!value.trim()) return "Unspecified";
  return value
    .split(/[_,/-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function experienceYears(doc: {
  experienceType?: string | null;
  experiences?: Array<{
    duration?: string | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    currentlyWorking?: boolean | null;
  }> | null;
}): number | null {
  if (doc.experienceType === "fresher") return 0;
  const experiences = Array.isArray(doc.experiences) ? doc.experiences : [];
  if (experiences.length === 0) {
    return doc.experienceType === "experienced" ? null : 0;
  }

  let totalMonths = 0;
  for (const entry of experiences) {
    const duration = String(entry.duration ?? "").toLowerCase();
    const yearMatch = duration.match(/(\d+)\s*y/);
    const monthMatch = duration.match(/(\d+)\s*m/);
    if (yearMatch || monthMatch) {
      totalMonths +=
        (yearMatch ? Number(yearMatch[1]) * 12 : 0) +
        (monthMatch ? Number(monthMatch[1]) : 0);
      continue;
    }
    const start = entry.startDate ? new Date(entry.startDate) : null;
    const end = entry.currentlyWorking
      ? new Date()
      : entry.endDate
        ? new Date(entry.endDate)
        : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      if (months > 0) totalMonths += months;
    }
  }
  return Math.max(0, Math.round(totalMonths / 12));
}

function experienceBucket(years: number | null): string {
  if (years == null) return "unspecified";
  if (years <= 0) return "fresher";
  if (years <= 3) return "1_3";
  if (years <= 5) return "3_5";
  if (years <= 10) return "5_10";
  return "10_plus";
}

const EXPERIENCE_BUCKET_LABELS: Record<string, string> = {
  fresher: "Fresher",
  "1_3": "1–3 years",
  "3_5": "3–5 years",
  "5_10": "5–10 years",
  "10_plus": "10+ years",
  unspecified: "Unspecified",
};

export function resolveCandidatesAnalyticsDateRange(input: {
  preset: CandidatesAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): OperationsCandidatesAnalyticsRange {
  const now = input.now ?? new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date;
  let preset: CandidatesAnalyticsPreset = input.preset;

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
    granularity:
      preset === "all"
        ? "month"
        : durationMs > 62 * MS_PER_DAY
          ? "week"
          : "day",
  };
}

function dateBucketExpression(
  field: "createdAt" | "updatedAt",
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

function buildSeries(
  from: Date,
  to: Date,
  granularity: "day" | "week" | "month",
  registeredMap: Map<string, number>,
  completedMap: Map<string, number>,
): OperationsCandidatesAnalyticsSeriesPoint[] {
  const points: OperationsCandidatesAnalyticsSeriesPoint[] = [];
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
      profileCompleted: completedMap.get(cursorKey) ?? 0,
    });
    cursorKey =
      granularity === "month"
        ? addMonthsIso(cursorKey, 1)
        : addDaysIso(cursorKey, granularity === "week" ? 7 : 1);
  }

  return points;
}

/** Basic profile: name + phone + at least one location/DOB signal. */
const BASIC_PROFILE_FILTER = {
  fullName: { $exists: true, $nin: [null, ""] },
  whatsappNumber: { $exists: true, $nin: [null, ""] },
  $or: [
    { city: { $exists: true, $nin: [null, ""] } },
    { state: { $exists: true, $nin: [null, ""] } },
    { pincode: { $exists: true, $nin: [null, ""] } },
    { dateOfBirth: { $ne: null } },
  ],
};

const SKILLS_PREFERENCES_FILTER = {
  $or: [
    { jobRole: { $exists: true, $nin: [null, ""] } },
    { "skills.0": { $exists: true } },
    {
      $and: [
        { jobType: { $exists: true, $ne: null } },
        { workMode: { $exists: true, $ne: null } },
      ],
    },
  ],
};

const DOCUMENTS_FILTER = {
  "uploadedResume.url": { $exists: true, $nin: [null, ""] },
};

export async function getOperationsCandidatesAnalytics(
  query: OperationsCandidatesAnalyticsQuery,
): Promise<OperationsCandidatesAnalyticsResult> {
  const resolved = resolveCandidatesAnalyticsDateRange({
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
    const earliest = await JobSeekerModel.findOne()
      .sort({ createdAt: 1 })
      .select({ createdAt: 1 })
      .lean();
    from = earliest?.createdAt
      ? startOfLocalDay(new Date(earliest.createdAt))
      : startOfLocalDay(now);
    // Overall always uses monthly buckets so registration bars stay thick.
    granularity = "month";
  }

  const range: OperationsCandidatesAnalyticsRange = {
    ...resolved,
    from: from.toISOString(),
    to: to.toISOString(),
    granularity,
  };

  const cohortFilter = isOverall ? {} : createdAtRangeFilter(from, to);
  const previousCohortFilter = isOverall
    ? { _id: { $exists: false } }
    : createdAtRangeFilter(previousFrom, previousTo);
  const networkAsOfFilter = isOverall ? {} : { createdAt: { $lte: to } };

  const [
    totalJobseekers,
    newRegistrations,
    previousNewRegistrations,
    profileCompleted,
    previousProfileCompleted,
    verifiedJobseekers,
    activeJobseekerIds,
    previousActiveIds,
    basicProfileCount,
    skillsPreferencesCount,
    documentsUploadedCount,
    completedSeriesRows,
    registeredSeriesRows,
    languageRows,
    locationDocs,
    experienceDocs,
    roleDocs,
    tabAll,
    tabNew,
    tabIncomplete,
    tabVerificationPending,
  ] = await Promise.all([
    JobSeekerModel.countDocuments(networkAsOfFilter),
    JobSeekerModel.countDocuments(
      isOverall
        ? createdAtRangeFilter(last30Start, endOfLocalDay(now))
        : cohortFilter,
    ),
    JobSeekerModel.countDocuments(
      isOverall
        ? createdAtRangeFilter(
            addDaysLocal(last30Start, -30),
            endOfLocalDay(addDaysLocal(last30Start, -1)),
          )
        : previousCohortFilter,
    ),
    JobSeekerModel.countDocuments({
      ...cohortFilter,
      registrationStatus: "COMPLETED",
    }),
    JobSeekerModel.countDocuments({
      ...previousCohortFilter,
      registrationStatus: "COMPLETED",
    }),
    JobSeekerModel.countDocuments({
      ...cohortFilter,
      isWhatsappVerified: true,
    }),
    ApplicationModel.distinct("jobSeekerId", {
      appliedAt: {
        $gte: isOverall ? last30Start : from,
        $lte: endOfLocalDay(now),
      },
    }),
    ApplicationModel.distinct("jobSeekerId", {
      appliedAt: isOverall
        ? {
            $gte: addDaysLocal(last30Start, -30),
            $lte: endOfLocalDay(addDaysLocal(last30Start, -1)),
          }
        : { $gte: previousFrom, $lte: previousTo },
    }),
    JobSeekerModel.countDocuments({
      ...cohortFilter,
      ...BASIC_PROFILE_FILTER,
    }),
    JobSeekerModel.countDocuments({
      ...cohortFilter,
      ...SKILLS_PREFERENCES_FILTER,
    }),
    JobSeekerModel.countDocuments({
      ...cohortFilter,
      ...DOCUMENTS_FILTER,
    }),
    JobSeekerModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...cohortFilter,
          registrationStatus: "COMPLETED",
        },
      },
      {
        $group: {
          _id: dateBucketExpression("createdAt", granularity),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    JobSeekerModel.aggregate<{ _id: string; count: number }>([
      { $match: cohortFilter },
      {
        $group: {
          _id: dateBucketExpression("createdAt", granularity),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    JobSeekerModel.aggregate<{ _id: string; count: number }>([
      { $match: cohortFilter },
      { $unwind: { path: "$languages", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: { $toLower: "$languages" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    JobSeekerModel.find(cohortFilter).select({ state: 1, city: 1 }).lean(),
    JobSeekerModel.find(cohortFilter)
      .select({ experienceType: 1, experiences: 1 })
      .lean(),
    JobSeekerModel.find(cohortFilter).select({ jobRole: 1 }).lean(),
    JobSeekerModel.countDocuments({}),
    JobSeekerModel.countDocuments({
      createdAt: { $gte: last30Start, $lte: endOfLocalDay(now) },
    }),
    JobSeekerModel.countDocuments({ registrationStatus: { $ne: "COMPLETED" } }),
    JobSeekerModel.countDocuments({
      $or: [
        { isWhatsappVerified: false },
        { isWhatsappVerified: { $exists: false } },
      ],
    }),
  ]);

  const activeJobseekers = activeJobseekerIds.filter(Boolean).length;
  const previousActive = previousActiveIds.filter(Boolean).length;
  const funnelBaseCount = await JobSeekerModel.countDocuments(cohortFilter);
  const funnelBase = Math.max(funnelBaseCount, 1);
  const profileCompletedPercent = percentOf(
    profileCompleted,
    funnelBaseCount || totalJobseekers,
  );
  const verifiedPercent = percentOf(
    verifiedJobseekers,
    funnelBaseCount || totalJobseekers,
  );

  const kpis: OperationsCandidatesOverviewKpis = {
    totalJobseekers,
    totalJobseekersTrendPercent: null,
    totalJobseekersCaption: isOverall
      ? "Across all jobseekers"
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
    profileCompleted,
    profileCompletedTrendPercent: isOverall
      ? null
      : percentChange(profileCompleted, previousProfileCompleted),
    profileCompletedPercent,
    profileCompletedCaption:
      profileCompletedPercent == null
        ? "Completed registration"
        : `${profileCompletedPercent}% completion rate`,
    verifiedJobseekers,
    verifiedJobseekersTrendPercent: null,
    verifiedJobseekersPercent: verifiedPercent,
    verifiedJobseekersCaption:
      verifiedPercent == null
        ? "WhatsApp verified"
        : `${verifiedPercent}% verification rate`,
    activeJobseekers,
    activeJobseekersTrendPercent: percentChange(activeJobseekers, previousActive),
    activeJobseekersCaption: "Applied in last 30 days",
  };

  const registeredMap = new Map<string, number>();
  for (const row of registeredSeriesRows) {
    if (!row._id) continue;
    registeredMap.set(String(row._id), (registeredMap.get(String(row._id)) ?? 0) + row.count);
  }
  const completedMap = new Map<string, number>();
  for (const row of completedSeriesRows) {
    if (!row._id) continue;
    completedMap.set(String(row._id), (completedMap.get(String(row._id)) ?? 0) + row.count);
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
    completedMap,
  );

  const onboardingFunnel = [
    {
      id: "registered",
      label: "Registered",
      count: funnelBaseCount,
      percent: funnelBaseCount > 0 ? 100 : 0,
    },
    {
      id: "basic_profile",
      label: "Basic Profile",
      count: basicProfileCount,
      percent: percentOf(basicProfileCount, funnelBase) ?? 0,
    },
    {
      id: "skills_preferences",
      label: "Skills & Preferences",
      count: skillsPreferencesCount,
      percent: percentOf(skillsPreferencesCount, funnelBase) ?? 0,
    },
    {
      id: "documents_uploaded",
      label: "Documents Uploaded",
      count: documentsUploadedCount,
      percent: percentOf(documentsUploadedCount, funnelBase) ?? 0,
    },
    {
      id: "verified",
      label: "Verified",
      count: verifiedJobseekers,
      percent: percentOf(verifiedJobseekers, funnelBase) ?? 0,
    },
  ];

  const locationCounts = new Map<string, number>();
  for (const doc of locationDocs) {
    const label = resolveIndiaStateLabel(doc.state, doc.city);
    locationCounts.set(label, (locationCounts.get(label) ?? 0) + 1);
  }
  const byLocation: OperationsCandidatesAnalyticsNamedCount[] = Array.from(
    locationCounts.entries(),
  )
    .map(([label, count]) => ({
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
      percent: percentOf(count, Math.max(funnelBaseCount, 1)),
    }))
    .sort((a, b) => {
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count;
    });

  const languageTotal = languageRows.reduce((sum, row) => sum + row.count, 0);
  const byLanguage: OperationsCandidatesAnalyticsNamedCount[] = languageRows.map(
    (row) => {
      const key = String(row._id || "other");
      return {
        id: key,
        label: LANGUAGE_LABELS[key] ?? humanizeRole(key),
        count: row.count,
        percent: percentOf(row.count, Math.max(languageTotal, 1)),
      };
    },
  );

  const experienceCounts = new Map<string, number>([
    ["fresher", 0],
    ["1_3", 0],
    ["3_5", 0],
    ["5_10", 0],
    ["10_plus", 0],
    ["unspecified", 0],
  ]);
  for (const doc of experienceDocs) {
    const bucket = experienceBucket(experienceYears(doc));
    experienceCounts.set(bucket, (experienceCounts.get(bucket) ?? 0) + 1);
  }
  const byExperience: OperationsCandidatesAnalyticsNamedCount[] = [
    "fresher",
    "1_3",
    "3_5",
    "5_10",
    "10_plus",
  ].map((id) => {
    const count = experienceCounts.get(id) ?? 0;
    return {
      id,
      label: EXPERIENCE_BUCKET_LABELS[id] ?? id,
      count,
      percent: percentOf(count, Math.max(funnelBaseCount, 1)),
    };
  });

  const roleCounts = new Map<string, number>();
  for (const doc of roleDocs) {
    const raw = String(doc.jobRole ?? "")
      .split(/[,|/]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (raw.length === 0) {
      roleCounts.set("unspecified", (roleCounts.get("unspecified") ?? 0) + 1);
      continue;
    }
    for (const role of raw) {
      const key = role.toLowerCase();
      roleCounts.set(key, (roleCounts.get(key) ?? 0) + 1);
    }
  }
  const topJobCategories: OperationsCandidatesAnalyticsNamedCount[] = Array.from(
    roleCounts.entries(),
  )
    .filter(([id]) => id !== "unspecified")
    .map(([id, count]) => ({
      id,
      label: humanizeRole(id),
      count,
      percent: percentOf(count, Math.max(funnelBaseCount, 1)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    range,
    kpis,
    registrationTrend,
    onboardingFunnel,
    byLocation,
    byLanguage,
    languageTotal: languageTotal || funnelBaseCount,
    byExperience,
    topJobCategories,
    tabs: {
      all: tabAll,
      new: tabNew,
      profileIncomplete: tabIncomplete,
      verificationPending: tabVerificationPending,
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
