import { ApplicationModel } from "../../applications/application.model.js";
import { PLACEMENT_APPLICATION_STATUSES } from "../../applications/application.constants.js";
import {
  resolveCityLabelFromLocationFields,
  resolveIndiaStateFromLocationFields,
} from "../employers/india-state-normalize.js";
import { resolveEmployerIndustryLabel } from "../verifications/operations-verifications-industry.js";
import {
  PLACEMENT_STATUS_MATCH,
  daysBetweenOfferAndJoin,
  findStatusHistoryAt,
  parseOfferDate,
  placementStatusLabel,
  resolvePlacementCohortDate,
  resolvePlacementJoiningStatus,
} from "./operations-placements-domain.js";
import type {
  OperationsPlacementsAnalyticsQuery,
  OperationsPlacementsAnalyticsRange,
  OperationsPlacementsAnalyticsResult,
  OperationsPlacementsFunnelStage,
  OperationsPlacementsInsight,
  OperationsPlacementsJoiningStatusSegment,
  OperationsPlacementsNamedCount,
  OperationsPlacementsOverviewKpis,
  OperationsPlacementsTabCounts,
  OperationsPlacementsTimeToJoinPoint,
  OperationsPlacementsTrendPoint,
  PlacementsAnalyticsPreset,
} from "./operations-placements.types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOP_CATEGORY_LIMIT = 8;
const TOP_STATES_LIMIT = 12;
const TOP_CITIES_LIMIT = 12;

/**
 * Funnel stage semantics (Application statuses — confirmed ATS mapping):
 * - Applications  = appliedAt in range (all statuses)
 * - Shortlisted   = current status in shortlisted…did_not_join (reached shortlist+)
 * - Interviews    = current status in interview_scheduled…did_not_join
 * - Offers Made   = current status in offer_sent…did_not_join
 * - Placements    = selected + joined + did_not_join (cohort date in range)
 * - Joined        = joined subset of placements in range
 *
 * Note: shortlisted/interview/offer stages use *current* status counts for apps
 * applied in-range (same pattern as other Operations analytics funnels). They are
 * not historical “ever reached” event counts.
 */
const SHORTLISTED_OR_LATER = [
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "did_not_join",
] as const;

const INTERVIEW_OR_LATER = [
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "did_not_join",
] as const;

const OFFER_OR_LATER = [
  "offer_sent",
  "selected",
  "joined",
  "did_not_join",
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

function startOfMonthKolkataIso(date: Date): string {
  const iso = toKolkataIsoDate(date);
  return `${iso.slice(0, 7)}-01`;
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

function addMonthsIso(isoDate: string, months: number): string {
  const [year, month] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + months, 1, 12, 0, 0));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    "01",
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
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function percentOf(part: number, total: number): number | null {
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

function periodCaption(preset: PlacementsAnalyticsPreset): string {
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

function rangeLabel(
  preset: PlacementsAnalyticsPreset,
  from: Date,
  to: Date,
): string {
  if (preset !== "custom" && preset !== "all") {
    return periodCaption(preset);
  }
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  if (preset === "all") {
    return "All time";
  }
  return `${fmt(from)} – ${fmt(to)}`;
}

export function resolvePlacementsAnalyticsDateRange(input: {
  preset: PlacementsAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): OperationsPlacementsAnalyticsRange {
  const now = input.now ?? new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date;
  let preset: PlacementsAnalyticsPreset = input.preset;

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
  const granularity: "day" | "week" | "month" =
    preset === "all"
      ? "month"
      : durationMs > 62 * MS_PER_DAY
        ? "week"
        : "day";

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    previousFrom: startOfLocalDay(previousFrom).toISOString(),
    previousTo: endOfLocalDay(previousTo).toISOString(),
    label: rangeLabel(preset, from, to),
    granularity,
  };
}

type PlacementLeanRow = {
  _id: { toString(): string };
  status?: string | null;
  statusHistory?: Array<{ status?: string | null; at?: Date | string | null }>;
  updatedAt?: Date | string | null;
  appliedAt?: Date | string | null;
  offer?: {
    offerDate?: string | null;
    joiningDate?: string | null;
  } | null;
  job?: Array<{
    industry?: string | null;
    city?: string | null;
    cityName?: string | null;
    state?: string | null;
    stateName?: string | null;
  }>;
  seeker?: Array<{
    city?: string | null;
    state?: string | null;
    preferredJobLocation?: string | null;
  }>;
};

function inRange(date: Date | null, from: Date, to: Date): boolean {
  if (!date) {
    return false;
  }
  const ms = date.getTime();
  return ms >= from.getTime() && ms <= to.getTime();
}

function bucketKey(
  date: Date,
  granularity: "day" | "week" | "month",
): string {
  if (granularity === "month") {
    return startOfMonthKolkataIso(date);
  }
  if (granularity === "week") {
    return startOfWeekKolkataIso(date);
  }
  return toKolkataIsoDate(date);
}

function buildTrendBuckets(
  from: Date,
  to: Date,
  granularity: "day" | "week" | "month",
): string[] {
  const keys: string[] = [];
  if (granularity === "month") {
    let cursor = startOfMonthKolkataIso(from);
    const end = startOfMonthKolkataIso(to);
    while (cursor <= end) {
      keys.push(cursor);
      cursor = addMonthsIso(cursor, 1);
    }
    return keys;
  }
  if (granularity === "week") {
    let cursor = startOfWeekKolkataIso(from);
    const end = startOfWeekKolkataIso(to);
    while (cursor <= end) {
      keys.push(cursor);
      cursor = addDaysIso(cursor, 7);
    }
    return keys;
  }
  let cursor = toKolkataIsoDate(from);
  const end = toKolkataIsoDate(to);
  while (cursor <= end) {
    keys.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return keys;
}

function buildInsights(input: {
  totalPlacements: number;
  joined: number;
  joiningPending: number;
  didNotJoin: number;
  avgTimeToJoinDays: number | null;
  topCategory: OperationsPlacementsNamedCount | null;
  topState: OperationsPlacementsNamedCount | null;
  caption: string;
}): OperationsPlacementsInsight[] {
  const insights: OperationsPlacementsInsight[] = [];
  const joinRate = percentOf(input.joined, input.totalPlacements);

  if (input.totalPlacements === 0) {
    insights.push({
      id: "no_placements",
      tone: "neutral",
      text: `No placements recorded ${input.caption.toLowerCase()}.`,
    });
    return insights;
  }

  if (joinRate != null) {
    insights.push({
      id: "join_rate",
      tone: joinRate >= 60 ? "positive" : joinRate < 40 ? "warning" : "neutral",
      text: `${input.joined.toLocaleString("en-IN")} of ${input.totalPlacements.toLocaleString("en-IN")} placements joined (${joinRate}%).`,
    });
  }

  if (input.joiningPending > 0) {
    insights.push({
      id: "joining_pending",
      tone: "warning",
      text: `${input.joiningPending.toLocaleString("en-IN")} placement${input.joiningPending === 1 ? "" : "s"} still joining pending.`,
    });
  }

  if (input.didNotJoin > 0) {
    const noShowRate = percentOf(input.didNotJoin, input.totalPlacements);
    insights.push({
      id: "did_not_join",
      tone: "negative",
      text:
        noShowRate == null
          ? `${input.didNotJoin.toLocaleString("en-IN")} did not join.`
          : `${input.didNotJoin.toLocaleString("en-IN")} did not join (${noShowRate}% of placements).`,
    });
  }

  if (input.avgTimeToJoinDays != null) {
    insights.push({
      id: "avg_time_to_join",
      tone: "neutral",
      text: `Average time to join is ${input.avgTimeToJoinDays} day${input.avgTimeToJoinDays === 1 ? "" : "s"}.`,
    });
  }

  if (input.topCategory && input.topCategory.count > 0) {
    insights.push({
      id: "top_category",
      tone: "neutral",
      text: `Top category: ${input.topCategory.label} (${input.topCategory.count.toLocaleString("en-IN")}).`,
    });
  }

  if (input.topState && input.topState.label !== "Unspecified") {
    insights.push({
      id: "top_state",
      tone: "neutral",
      text: `Most placements in ${input.topState.label} (${input.topState.count.toLocaleString("en-IN")}).`,
    });
  }

  return insights.slice(0, 6);
}

async function loadPlacementRows(): Promise<PlacementLeanRow[]> {
  /**
   * Loads the placement-status subset only (selected | joined | did_not_join),
   * not the full applications collection. Cohort KPIs require statusHistory, so
   * rows are projected narrowly and summarized in-process for the active range.
   */
  return ApplicationModel.aggregate<PlacementLeanRow>([
    { $match: PLACEMENT_STATUS_MATCH },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    {
      $lookup: {
        from: "jobseekers",
        localField: "jobSeekerId",
        foreignField: "_id",
        as: "seeker",
      },
    },
    {
      $project: {
        status: 1,
        statusHistory: 1,
        updatedAt: 1,
        appliedAt: 1,
        offer: 1,
        job: {
          industry: 1,
          city: 1,
          cityName: 1,
          state: 1,
          stateName: 1,
        },
        seeker: {
          city: 1,
          state: 1,
          preferredJobLocation: 1,
        },
      },
    },
  ]);
}

function summarizeCohort(
  rows: PlacementLeanRow[],
  from: Date,
  to: Date,
): {
  total: number;
  joined: number;
  joiningPending: number;
  didNotJoin: number;
  avgTimeToJoinDays: number | null;
  joinDays: number[];
} {
  let total = 0;
  let joined = 0;
  let joiningPending = 0;
  let didNotJoin = 0;
  const joinDays: number[] = [];

  for (const row of rows) {
    const cohortDate = resolvePlacementCohortDate({
      statusHistory: row.statusHistory,
      updatedAt: row.updatedAt,
    });
    if (!inRange(cohortDate, from, to)) {
      continue;
    }
    total += 1;
    const joining = resolvePlacementJoiningStatus(row.status);
    if (joining === "joined") {
      joined += 1;
      const joinedAt =
        parseOfferDate(row.offer?.joiningDate) ??
        findStatusHistoryAt(row.statusHistory, "joined");
      const days = daysBetweenOfferAndJoin(row.offer?.offerDate, joinedAt);
      if (days != null) {
        joinDays.push(days);
      }
    } else if (joining === "joining_pending") {
      joiningPending += 1;
    } else if (joining === "did_not_join") {
      didNotJoin += 1;
    }
  }

  const avgTimeToJoinDays =
    joinDays.length > 0
      ? Math.round(
          (joinDays.reduce((sum, value) => sum + value, 0) / joinDays.length) *
            10,
        ) / 10
      : null;

  return {
    total,
    joined,
    joiningPending,
    didNotJoin,
    avgTimeToJoinDays,
    joinDays,
  };
}

export async function getPlacementsAnalytics(
  query: OperationsPlacementsAnalyticsQuery,
): Promise<OperationsPlacementsAnalyticsResult> {
  const range = resolvePlacementsAnalyticsDateRange(query);
  const from = new Date(range.from);
  const to = new Date(range.to);
  const previousFrom = new Date(range.previousFrom);
  const previousTo = new Date(range.previousTo);
  const caption = periodCaption(range.preset);
  const isOverall = range.preset === "all";

  const [rows, applicationsInRange, shortlistedInRange, interviewsInRange, offersInRange] =
    await Promise.all([
      loadPlacementRows(),
      ApplicationModel.countDocuments({
        appliedAt: { $gte: from, $lte: to },
      }),
      ApplicationModel.countDocuments({
        appliedAt: { $gte: from, $lte: to },
        status: { $in: [...SHORTLISTED_OR_LATER] },
      }),
      ApplicationModel.countDocuments({
        appliedAt: { $gte: from, $lte: to },
        status: { $in: [...INTERVIEW_OR_LATER] },
      }),
      ApplicationModel.countDocuments({
        appliedAt: { $gte: from, $lte: to },
        status: { $in: [...OFFER_OR_LATER] },
      }),
    ]);

  const current = summarizeCohort(rows, from, to);
  const previous = isOverall
    ? {
        total: 0,
        joined: 0,
        joiningPending: 0,
        didNotJoin: 0,
        avgTimeToJoinDays: null as number | null,
        joinDays: [] as number[],
      }
    : summarizeCohort(rows, previousFrom, previousTo);

  const placementsInRange = rows.filter((row) =>
    inRange(
      resolvePlacementCohortDate({
        statusHistory: row.statusHistory,
        updatedAt: row.updatedAt,
      }),
      from,
      to,
    ),
  );

  const funnelPlacements = placementsInRange.length;
  const funnelJoined = placementsInRange.filter(
    (row) => resolvePlacementJoiningStatus(row.status) === "joined",
  ).length;

  const funnelBase = Math.max(applicationsInRange, 1);
  const funnel: OperationsPlacementsFunnelStage[] = [
    {
      key: "applications",
      label: "Applications",
      count: applicationsInRange,
      percent: applicationsInRange > 0 ? 100 : 0,
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      count: shortlistedInRange,
      percent: percentOf(shortlistedInRange, funnelBase) ?? 0,
    },
    {
      key: "interviews",
      label: "Interviews",
      count: interviewsInRange,
      percent: percentOf(interviewsInRange, funnelBase) ?? 0,
    },
    {
      key: "offers",
      label: "Offers Made",
      count: offersInRange,
      percent: percentOf(offersInRange, funnelBase) ?? 0,
    },
    {
      key: "placements",
      label: "Placements",
      count: funnelPlacements,
      percent: percentOf(funnelPlacements, funnelBase) ?? 0,
    },
    {
      key: "joined",
      label: "Joined",
      count: funnelJoined,
      percent: percentOf(funnelJoined, funnelBase) ?? 0,
    },
  ];

  const trendFrom =
    isOverall
      ? (() => {
          const twelveMonthsAgo = new Date(to);
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
          twelveMonthsAgo.setDate(1);
          return startOfLocalDay(twelveMonthsAgo);
        })()
      : from;

  const trendGranularity = isOverall ? "month" : range.granularity;
  const bucketKeys = buildTrendBuckets(trendFrom, to, trendGranularity);
  const placementsByBucket = new Map<string, number>();
  const joinedByBucket = new Map<string, number>();

  for (const row of rows) {
    const cohortDate = resolvePlacementCohortDate({
      statusHistory: row.statusHistory,
      updatedAt: row.updatedAt,
    });
    if (!inRange(cohortDate, trendFrom, to) || !cohortDate) {
      continue;
    }
    const key = bucketKey(cohortDate, trendGranularity);
    placementsByBucket.set(key, (placementsByBucket.get(key) ?? 0) + 1);
    if (resolvePlacementJoiningStatus(row.status) === "joined") {
      joinedByBucket.set(key, (joinedByBucket.get(key) ?? 0) + 1);
    }
  }

  const trend: OperationsPlacementsTrendPoint[] = bucketKeys.map((date) => ({
    date,
    label: seriesBucketLabel(date, trendGranularity),
    placements: placementsByBucket.get(date) ?? 0,
    joined: joinedByBucket.get(date) ?? 0,
  }));

  const categoryCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();

  for (const row of placementsInRange) {
    const job = row.job?.[0];
    const seeker = row.seeker?.[0];
    const industryRaw = String(job?.industry ?? "").trim();
    const categoryLabel = resolveEmployerIndustryLabel(industryRaw || "Unspecified");
    categoryCounts.set(
      categoryLabel,
      (categoryCounts.get(categoryLabel) ?? 0) + 1,
    );

    const stateLabel = resolveIndiaStateFromLocationFields({
      state: job?.stateName || job?.state || seeker?.state,
      city: job?.cityName || job?.city || seeker?.city,
      preferredJobLocation: seeker?.preferredJobLocation,
    });
    stateCounts.set(stateLabel, (stateCounts.get(stateLabel) ?? 0) + 1);

    const cityRaw = resolveCityLabelFromLocationFields({
      city: job?.cityName || job?.city || seeker?.city,
      preferredJobLocation: seeker?.preferredJobLocation,
    });
    if (cityRaw) {
      const cityKey = cityRaw.toLowerCase().replace(/\s+/g, " ");
      cityCounts.set(cityKey, (cityCounts.get(cityKey) ?? 0) + 1);
    }
  }

  const byCategory: OperationsPlacementsNamedCount[] = Array.from(
    categoryCounts.entries(),
  )
    .map(([label, count]) => ({
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
      percent: percentOf(count, Math.max(current.total, 1)),
    }))
    .sort((a, b) => {
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count || a.label.localeCompare(b.label);
    })
    .slice(0, TOP_CATEGORY_LIMIT);

  const states: OperationsPlacementsNamedCount[] = Array.from(
    stateCounts.entries(),
  )
    .map(([label, count]) => ({
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
      percent: percentOf(count, Math.max(current.total, 1)),
    }))
    .sort((a, b) => {
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count || a.label.localeCompare(b.label);
    })
    .slice(0, TOP_STATES_LIMIT);

  const cities: OperationsPlacementsNamedCount[] = Array.from(
    cityCounts.entries(),
  )
    .map(([key, count]) => {
      const label = key
        .split(" ")
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1) : part,
        )
        .join(" ");
      return {
        key: key.replace(/\s+/g, "-"),
        label,
        count,
        percent: percentOf(count, Math.max(current.total, 1)),
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, TOP_CITIES_LIMIT);

  const joiningStatusSegments: OperationsPlacementsJoiningStatusSegment[] = [
    {
      key: "joining_pending",
      label: placementStatusLabel("joining_pending"),
      count: current.joiningPending,
      percent: percentOf(current.joiningPending, current.total),
    },
    {
      key: "joined",
      label: placementStatusLabel("joined"),
      count: current.joined,
      percent: percentOf(current.joined, current.total),
    },
    {
      key: "did_not_join",
      label: placementStatusLabel("did_not_join"),
      count: current.didNotJoin,
      percent: percentOf(current.didNotJoin, current.total),
    },
  ];

  const monthlyBuckets = buildTrendBuckets(
    isOverall ? trendFrom : from,
    to,
    "month",
  );
  const joinDaysByMonth = new Map<string, number[]>();
  for (const row of rows) {
    if (resolvePlacementJoiningStatus(row.status) !== "joined") {
      continue;
    }
    const joinedAt =
      parseOfferDate(row.offer?.joiningDate) ??
      findStatusHistoryAt(row.statusHistory, "joined") ??
      resolvePlacementCohortDate({
        statusHistory: row.statusHistory,
        updatedAt: row.updatedAt,
      });
    if (!joinedAt || !inRange(joinedAt, isOverall ? trendFrom : from, to)) {
      continue;
    }
    const days = daysBetweenOfferAndJoin(row.offer?.offerDate, joinedAt);
    if (days == null) {
      continue;
    }
    const key = startOfMonthKolkataIso(joinedAt);
    const list = joinDaysByMonth.get(key) ?? [];
    list.push(days);
    joinDaysByMonth.set(key, list);
  }

  const timeToJoinSeries: OperationsPlacementsTimeToJoinPoint[] =
    monthlyBuckets.map((date) => {
      const values = joinDaysByMonth.get(date) ?? [];
      return {
        date,
        label: seriesBucketLabel(date, "month"),
        avgDays:
          values.length > 0
            ? Math.round(
                (values.reduce((sum, value) => sum + value, 0) /
                  values.length) *
                  10,
              ) / 10
            : null,
      };
    });

  const avgTimeToJoinTrendPercent =
    isOverall ||
    current.avgTimeToJoinDays == null ||
    previous.avgTimeToJoinDays == null ||
    previous.avgTimeToJoinDays <= 0
      ? null
      : percentChange(current.avgTimeToJoinDays, previous.avgTimeToJoinDays);

  // Tab badges must match the selected analytics period (same cohort as KPIs).
  const tabs: OperationsPlacementsTabCounts = {
    all: current.total,
    joined: current.joined,
    joiningPending: current.joiningPending,
    didNotJoin: current.didNotJoin,
  };

  const kpis: OperationsPlacementsOverviewKpis = {
    totalPlacements: current.total,
    totalPlacementsTrendPercent: isOverall
      ? null
      : percentChange(current.total, previous.total),
    totalPlacementsCaption: caption,
    joined: current.joined,
    joinedTrendPercent: isOverall
      ? null
      : percentChange(current.joined, previous.joined),
    joinedCaption: caption,
    joinedPercentOfTotal: percentOf(current.joined, current.total),
    joiningPending: current.joiningPending,
    joiningPendingTrendPercent: isOverall
      ? null
      : percentChange(current.joiningPending, previous.joiningPending),
    joiningPendingCaption: caption,
    joiningPendingPercentOfTotal: percentOf(
      current.joiningPending,
      current.total,
    ),
    didNotJoin: current.didNotJoin,
    didNotJoinTrendPercent: isOverall
      ? null
      : percentChange(current.didNotJoin, previous.didNotJoin),
    didNotJoinCaption: caption,
    didNotJoinPercentOfTotal: percentOf(current.didNotJoin, current.total),
    avgTimeToJoinDays: current.avgTimeToJoinDays,
    avgTimeToJoinTrendPercent,
    avgTimeToJoinCaption:
      current.avgTimeToJoinDays == null
        ? "No joined placements with offer dates"
        : "Offer to join (days)",
  };

  void PLACEMENT_APPLICATION_STATUSES;

  return {
    range,
    kpis,
    tabs,
    trend,
    funnel,
    byCategory,
    byLocation: { states, cities },
    joiningStatus: {
      total: current.total,
      segments: joiningStatusSegments,
    },
    timeToJoin: {
      avgDays: current.avgTimeToJoinDays,
      trendPercent: avgTimeToJoinTrendPercent,
      series: timeToJoinSeries,
    },
    insights: buildInsights({
      totalPlacements: current.total,
      joined: current.joined,
      joiningPending: current.joiningPending,
      didNotJoin: current.didNotJoin,
      avgTimeToJoinDays: current.avgTimeToJoinDays,
      topCategory: byCategory[0] ?? null,
      topState: states.find((item) => item.label !== "Unspecified") ?? null,
      caption,
    }),
  };
}
