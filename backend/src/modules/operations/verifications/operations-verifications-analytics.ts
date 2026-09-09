import { EmployerDocumentModel } from "../../employers/employer-document.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import { resolveEmployerIndustryLabel } from "./operations-verifications-industry.js";
import type {
  OperationsVerificationsAnalyticsQuery,
  OperationsVerificationsAnalyticsRange,
  OperationsVerificationsAnalyticsResult,
  OperationsVerificationsNamedCount,
  OperationsVerificationsOverviewKpis,
  OperationsVerificationsStatusCount,
  OperationsVerificationsTabCounts,
  OperationsVerificationsTrendPoint,
  VerificationsAnalyticsPreset,
} from "./operations-verifications.types.js";

/**
 * Target SLA for employer verification decisions (calendar days).
 * Pending cases older than this, or decided cases that took longer, are SLA breaches.
 */
export const SLA_TARGET_DAYS = 3;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SLA_TARGET_MS = SLA_TARGET_DAYS * MS_PER_DAY;
const TOP_INDUSTRY_LIMIT = 8;
const TOP_STATES_LIMIT = 12;

/**
 * Operations-approved employers only.
 * Never infer from WhatsApp OTP (`isWhatsappVerified`) — that is phone proof, not KYC.
 */
export const VERIFIED_EMPLOYER_FILTER: Record<string, unknown> = {
  verificationStatus: { $in: ["verified", "approved"] },
};

/** Open queue: explicit pending or unset — independent of WhatsApp OTP. */
export const PENDING_VERIFICATION_FILTER: Record<string, unknown> = {
  $or: [
    { verificationStatus: "pending" },
    { verificationStatus: null },
    { verificationStatus: "" },
    { verificationStatus: { $exists: false } },
  ],
};

const REJECTED_FILTER: Record<string, unknown> = {
  verificationStatus: "rejected",
};

const HAS_DOCUMENTS_FILTER: Record<string, unknown> = {
  $or: [
    { "documentIds.0": { $exists: true } },
    { "docs.0": { $exists: true } },
  ],
};

const NO_DOCUMENTS_FILTER: Record<string, unknown> = {
  $and: [
    {
      $or: [
        { documentIds: { $exists: false } },
        { documentIds: { $size: 0 } },
        { documentIds: null },
      ],
    },
    { "docs.0": { $exists: false } },
  ],
};

/** Map raw EmployerDocument.documentType values into UI category buckets. */
export const DOCUMENT_TYPE_CATEGORY_MAP: Record<
  string,
  { key: string; label: string }
> = {
  "gst-certificate": { key: "gst_certificate", label: "GST Certificate" },
  pan: { key: "pan_card", label: "PAN Card" },
  "pan-card-business": { key: "pan_card", label: "PAN Card" },
  aadhaar: { key: "identity_proof", label: "Identity Proof" },
  "driving-licence": { key: "identity_proof", label: "Identity Proof" },
  "voter-id": { key: "identity_proof", label: "Identity Proof" },
  "certificate-of-incorporation": {
    key: "business_registration",
    label: "Business Registration",
  },
  "llp-registration-certificate": {
    key: "business_registration",
    label: "Business Registration",
  },
  "msme-udyam-registration": {
    key: "business_registration",
    label: "Business Registration",
  },
  "shop-establishment-license": {
    key: "business_registration",
    label: "Business Registration",
  },
  "trade-license": {
    key: "business_registration",
    label: "Business Registration",
  },
  "trust-society-registration": {
    key: "business_registration",
    label: "Business Registration",
  },
  "partnership-deed": {
    key: "business_registration",
    label: "Business Registration",
  },
  "fssai-license": {
    key: "business_registration",
    label: "Business Registration",
  },
  "other-government-registration": {
    key: "other_documents",
    label: "Other Documents",
  },
};

const DOCUMENT_CATEGORY_ORDER = [
  "business_registration",
  "gst_certificate",
  "pan_card",
  "identity_proof",
  "other_documents",
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
export function toKolkataIsoDate(date: Date): string {
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

export function msToDays(ms: number): number {
  return Math.round((ms / MS_PER_DAY) * 10) / 10;
}

/** True when the decision (or age to `end`) exceeds the SLA target. */
export function isBeyondSla(
  start: Date | null | undefined,
  end: Date | null | undefined,
  targetDays: number = SLA_TARGET_DAYS,
  now: Date = new Date(),
): boolean {
  if (!start) {
    return false;
  }
  const endAt = end ?? now;
  return endAt.getTime() - start.getTime() > targetDays * MS_PER_DAY;
}

export function mapDocumentTypeToCategory(documentType: string): {
  key: string;
  label: string;
} {
  const mapped = DOCUMENT_TYPE_CATEGORY_MAP[documentType];
  if (mapped) {
    return mapped;
  }
  return { key: "other_documents", label: "Other Documents" };
}

/** @deprecated Prefer resolveEmployerIndustryLabel — kept for existing tests. */
export function titleCaseIndustry(raw: string): string {
  return resolveEmployerIndustryLabel(raw);
}

/**
 * Pure operational status mapping for unit tests / shared rules.
 * `documentsCount` should reflect EmployerDocument rows or documentIds length.
 */
export function resolveOperationalVerificationStatus(input: {
  verificationStatus?: string | null;
  registrationStatus?: string | null;
  verificationSubmittedAt?: Date | string | null;
  createdAt?: Date | string | null;
  documentsCount: number;
  now?: Date;
  slaTargetDays?: number;
}): {
  status: "pending" | "under_review" | "verified" | "rejected";
  needsAttention: boolean;
  slaBreach: boolean;
} {
  const explicit = String(input.verificationStatus ?? "")
    .trim()
    .toLowerCase();
  const now = input.now ?? new Date();
  const targetDays = input.slaTargetDays ?? SLA_TARGET_DAYS;

  // Explicit ops decision only — do not treat WhatsApp OTP as employer verification.
  if (explicit === "verified" || explicit === "approved") {
    return { status: "verified", needsAttention: false, slaBreach: false };
  }
  if (explicit === "rejected") {
    return { status: "rejected", needsAttention: false, slaBreach: false };
  }

  const submittedAt = input.verificationSubmittedAt
    ? new Date(input.verificationSubmittedAt)
    : null;
  const createdAt = input.createdAt ? new Date(input.createdAt) : null;
  const ageStart = submittedAt ?? createdAt;
  const hasDocs = input.documentsCount > 0;
  const underReview = Boolean(submittedAt) && hasDocs;
  const status = underReview ? "under_review" : "pending";
  const agedBeyondSla = isBeyondSla(ageStart, null, targetDays, now);
  const missingDocsAfterComplete =
    input.registrationStatus === "completed" && !hasDocs;
  const needsAttention = agedBeyondSla || missingDocsAfterComplete;

  return {
    status,
    needsAttention,
    slaBreach: agedBeyondSla,
  };
}

function periodCaption(preset: VerificationsAnalyticsPreset): string {
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
  preset: VerificationsAnalyticsPreset,
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

export function resolveVerificationsAnalyticsDateRange(input: {
  preset: VerificationsAnalyticsPreset;
  dateFrom: string;
  dateTo: string;
  now?: Date;
}): OperationsVerificationsAnalyticsRange {
  const now = input.now ?? new Date();
  const todayEnd = endOfLocalDay(now);
  let from: Date;
  let to: Date;
  let preset: VerificationsAnalyticsPreset = input.preset;

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

/** Employers whose verification activity start falls in [from, to]. */
function activityStartRangeFilter(
  from: Date,
  to: Date,
): Record<string, unknown> {
  return {
    $or: [
      { verificationSubmittedAt: { $gte: from, $lte: to } },
      {
        $and: [
          {
            $or: [
              { verificationSubmittedAt: null },
              { verificationSubmittedAt: { $exists: false } },
            ],
          },
          { createdAt: { $gte: from, $lte: to } },
        ],
      },
    ],
  };
}

function documentsLookupStage() {
  return {
    $lookup: {
      from: "employer_documents",
      localField: "_id",
      foreignField: "employerId",
      pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
      as: "docs",
    },
  };
}

function ageStartBefore(cutoff: Date): Record<string, unknown> {
  return {
    $or: [
      { verificationSubmittedAt: { $lt: cutoff, $ne: null } },
      {
        $and: [
          {
            $or: [
              { verificationSubmittedAt: null },
              { verificationSubmittedAt: { $exists: false } },
            ],
          },
          { createdAt: { $lt: cutoff } },
        ],
      },
    ],
  };
}

function dateBucketExpression(
  field: string,
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

function activityStartBucketExpression(
  granularity: "day" | "week" | "month",
) {
  const startExpr = {
    $ifNull: ["$verificationSubmittedAt", "$createdAt"],
  };
  const truncated =
    granularity === "month"
      ? {
          $dateTrunc: {
            date: startExpr,
            unit: "month" as const,
            binSize: 1,
            timezone: "Asia/Kolkata",
          },
        }
      : granularity === "week"
        ? {
            $dateTrunc: {
              date: startExpr,
              unit: "week" as const,
              binSize: 1,
              startOfWeek: "Monday" as const,
              timezone: "Asia/Kolkata",
            },
          }
        : {
            $dateTrunc: {
              date: startExpr,
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

function buildTrend(
  from: Date,
  to: Date,
  granularity: "day" | "week" | "month",
  submittedMap: Map<string, number>,
  verifiedMap: Map<string, number>,
  rejectedMap: Map<string, number>,
): OperationsVerificationsTrendPoint[] {
  const points: OperationsVerificationsTrendPoint[] = [];
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
      submitted: submittedMap.get(cursorKey) ?? 0,
      verified: verifiedMap.get(cursorKey) ?? 0,
      rejected: rejectedMap.get(cursorKey) ?? 0,
    });
    cursorKey =
      granularity === "month"
        ? addMonthsIso(cursorKey, 1)
        : addDaysIso(cursorKey, granularity === "week" ? 7 : 1);
  }

  return points;
}

async function countUnderReview(
  extraMatch: Record<string, unknown> = {},
): Promise<number> {
  const rows = await EmployerModel.aggregate<{ count: number }>([
    {
      $match: {
        $and: [
          PENDING_VERIFICATION_FILTER,
          { verificationSubmittedAt: { $ne: null, $exists: true } },
          ...(Object.keys(extraMatch).length > 0 ? [extraMatch] : []),
        ],
      },
    },
    documentsLookupStage(),
    { $match: HAS_DOCUMENTS_FILTER },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}

async function countNeedsAttention(
  now: Date,
  extraMatch: Record<string, unknown> = {},
): Promise<number> {
  const slaCutoff = new Date(now.getTime() - SLA_TARGET_MS);
  const rows = await EmployerModel.aggregate<{ count: number }>([
    {
      $match: {
        $and: [
          PENDING_VERIFICATION_FILTER,
          ...(Object.keys(extraMatch).length > 0 ? [extraMatch] : []),
        ],
      },
    },
    documentsLookupStage(),
    {
      $match: {
        $or: [
          ageStartBefore(slaCutoff),
          {
            $and: [
              { registrationStatus: "completed" },
              NO_DOCUMENTS_FILTER,
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}

async function countSlaBreaches(
  now: Date,
  extraMatch: Record<string, unknown> = {},
): Promise<number> {
  const slaCutoff = new Date(now.getTime() - SLA_TARGET_MS);
  const matchParts: Record<string, unknown>[] = [];
  if (Object.keys(extraMatch).length > 0) {
    matchParts.push(extraMatch);
  }

  const rows = await EmployerModel.aggregate<{ count: number }>([
    ...(matchParts.length > 0 ? [{ $match: { $and: matchParts } }] : []),
    {
      $match: {
        $or: [
          {
            $and: [PENDING_VERIFICATION_FILTER, ageStartBefore(slaCutoff)],
          },
          {
            $and: [
              VERIFIED_EMPLOYER_FILTER,
              { verifiedAt: { $ne: null } },
              {
                $expr: {
                  $gt: [
                    {
                      $subtract: [
                        "$verifiedAt",
                        {
                          $ifNull: [
                            "$verificationSubmittedAt",
                            "$createdAt",
                          ],
                        },
                      ],
                    },
                    SLA_TARGET_MS,
                  ],
                },
              },
            ],
          },
          {
            $and: [
              REJECTED_FILTER,
              { rejectedAt: { $ne: null } },
              {
                $expr: {
                  $gt: [
                    {
                      $subtract: [
                        "$rejectedAt",
                        {
                          $ifNull: [
                            "$verificationSubmittedAt",
                            "$createdAt",
                          ],
                        },
                      ],
                    },
                    SLA_TARGET_MS,
                  ],
                },
              },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}

async function countPendingNotUnderReview(
  extraMatch: Record<string, unknown> = {},
): Promise<number> {
  const pendingTotal = await EmployerModel.countDocuments({
    $and: [
      PENDING_VERIFICATION_FILTER,
      ...(Object.keys(extraMatch).length > 0 ? [extraMatch] : []),
    ],
  });
  const underReview = await countUnderReview(extraMatch);
  return Math.max(0, pendingTotal - underReview);
}

type SlaAggregateResult = {
  averageDays: number | null;
  withinSlaPercent: number | null;
  beyondSlaPercent: number | null;
};

async function aggregateSlaMetrics(
  from: Date,
  to: Date,
): Promise<SlaAggregateResult> {
  const rows = await EmployerModel.aggregate<{
    avgMs: number | null;
    withinSla: number;
    beyondSla: number;
    count: number;
  }>([
    {
      $match: {
        $or: [
          {
            verificationStatus: "verified",
            verifiedAt: { $gte: from, $lte: to },
          },
          {
            verificationStatus: "rejected",
            rejectedAt: { $gte: from, $lte: to },
          },
        ],
      },
    },
    {
      $project: {
        durationMs: {
          $subtract: [
            { $ifNull: ["$verifiedAt", "$rejectedAt"] },
            { $ifNull: ["$verificationSubmittedAt", "$createdAt"] },
          ],
        },
      },
    },
    {
      $match: {
        durationMs: { $ne: null, $gte: 0 },
      },
    },
    {
      $group: {
        _id: null,
        avgMs: { $avg: "$durationMs" },
        withinSla: {
          $sum: {
            $cond: [{ $lte: ["$durationMs", SLA_TARGET_MS] }, 1, 0],
          },
        },
        beyondSla: {
          $sum: {
            $cond: [{ $gt: ["$durationMs", SLA_TARGET_MS] }, 1, 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const row = rows[0];
  if (!row || row.count <= 0) {
    return {
      averageDays: null,
      withinSlaPercent: null,
      beyondSlaPercent: null,
    };
  }

  return {
    averageDays:
      typeof row.avgMs === "number" ? msToDays(row.avgMs) : null,
    withinSlaPercent: percentOf(row.withinSla, row.count),
    beyondSlaPercent: percentOf(row.beyondSla, row.count),
  };
}

function mapCountRowsToBucket(
  rows: Array<{ _id: string | null; count: number }>,
  limit: number,
): OperationsVerificationsNamedCount[] {
  const normalized = rows
    .map((row) => {
      const raw = String(row._id ?? "").trim();
      const label = resolveEmployerIndustryLabel(raw);
      const key =
        raw.trim().toLowerCase().replace(/\s+/g, "-") ||
        label.toLowerCase().replace(/\s+/g, "-") ||
        "unspecified";
      return {
        key,
        label,
        count: row.count,
      };
    })
    .sort((a, b) => b.count - a.count);

  if (normalized.length <= limit) {
    return normalized;
  }

  const top = normalized.slice(0, limit);
  const othersCount = normalized
    .slice(limit)
    .reduce((sum, item) => sum + item.count, 0);
  if (othersCount > 0) {
    top.push({ key: "others", label: "Others", count: othersCount });
  }
  return top;
}

export async function getOperationsVerificationsAnalytics(
  query: OperationsVerificationsAnalyticsQuery,
): Promise<OperationsVerificationsAnalyticsResult> {
  const resolved = resolveVerificationsAnalyticsDateRange({
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
  const caption = periodCaption(resolved.preset);

  if (isOverall) {
    const earliest = await EmployerModel.findOne()
      .sort({ createdAt: 1 })
      .select({ createdAt: 1 })
      .lean();
    from = earliest?.createdAt
      ? startOfLocalDay(new Date(earliest.createdAt))
      : startOfLocalDay(now);
    granularity = "month";
  }

  const range: OperationsVerificationsAnalyticsRange = {
    ...resolved,
    from: from.toISOString(),
    to: to.toISOString(),
    label: rangeLabel(resolved.preset, from, to),
    granularity,
  };

  const cohortFilter = isOverall ? {} : activityStartRangeFilter(from, to);
  const previousCohortFilter = isOverall
    ? { _id: { $exists: false } }
    : activityStartRangeFilter(previousFrom, previousTo);

  const [
    totalVerifications,
    previousTotal,
    pendingReview,
    previousPending,
    verifiedEmployers,
    previousVerified,
    rejected,
    previousRejected,
    needsAttention,
    previousNeedsAttention,
    tabOverview,
    tabPending,
    tabUnderReview,
    tabVerified,
    tabRejected,
    tabSlaBreaches,
    currentSla,
    previousSla,
    industryRows,
    locationRows,
    documentTypeRows,
    submittedSeriesRows,
    verifiedSeriesRows,
    rejectedSeriesRows,
  ] = await Promise.all([
    EmployerModel.countDocuments(cohortFilter),
    EmployerModel.countDocuments(previousCohortFilter),
    EmployerModel.countDocuments({
      $and: [cohortFilter, PENDING_VERIFICATION_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    EmployerModel.countDocuments({
      $and: [previousCohortFilter, PENDING_VERIFICATION_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    EmployerModel.countDocuments({
      $and: [cohortFilter, VERIFIED_EMPLOYER_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    EmployerModel.countDocuments({
      $and: [previousCohortFilter, VERIFIED_EMPLOYER_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    EmployerModel.countDocuments({
      $and: [cohortFilter, REJECTED_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    EmployerModel.countDocuments({
      $and: [previousCohortFilter, REJECTED_FILTER].filter(
        (part) => Object.keys(part).length > 0,
      ),
    }),
    countNeedsAttention(now, cohortFilter),
    countNeedsAttention(now, previousCohortFilter),
    // Tabs + status mix: all-time operational badges (independent of analytics range)
    EmployerModel.countDocuments({}),
    countPendingNotUnderReview(),
    countUnderReview(),
    EmployerModel.countDocuments(VERIFIED_EMPLOYER_FILTER),
    EmployerModel.countDocuments(REJECTED_FILTER),
    countSlaBreaches(now),
    aggregateSlaMetrics(from, to),
    isOverall
      ? Promise.resolve({
          averageDays: null,
          withinSlaPercent: null,
          beyondSlaPercent: null,
        } satisfies SlaAggregateResult)
      : aggregateSlaMetrics(previousFrom, previousTo),
    EmployerModel.aggregate<{ _id: string | null; count: number }>([
      ...(Object.keys(cohortFilter).length > 0
        ? [{ $match: cohortFilter }]
        : []),
      {
        $group: {
          _id: {
            $let: {
              vars: {
                industry: {
                  $trim: { input: { $ifNull: ["$industry", ""] } },
                },
                category: {
                  $trim: { input: { $ifNull: ["$businessCategory", ""] } },
                },
              },
              in: {
                $cond: [
                  { $gt: [{ $strLenCP: "$$industry" }, 0] },
                  "$$industry",
                  {
                    $cond: [
                      { $gt: [{ $strLenCP: "$$category" }, 0] },
                      "$$category",
                      "Unspecified",
                    ],
                  },
                ],
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    EmployerModel.aggregate<{
      _id: { state: string | null; city: string | null };
      count: number;
    }>([
      ...(Object.keys(cohortFilter).length > 0
        ? [{ $match: cohortFilter }]
        : []),
      {
        $group: {
          _id: {
            state: { $ifNull: ["$state", ""] },
            city: { $ifNull: ["$city", ""] },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    EmployerDocumentModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          uploadedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$documentType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      { $match: activityStartRangeFilter(from, to) },
      {
        $group: {
          _id: activityStartBucketExpression(granularity),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          verificationStatus: "verified",
          verifiedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: dateBucketExpression("verifiedAt", granularity),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    EmployerModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          verificationStatus: "rejected",
          rejectedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: dateBucketExpression("rejectedAt", granularity),
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const kpis: OperationsVerificationsOverviewKpis = {
    totalVerifications,
    totalVerificationsTrendPercent: isOverall
      ? null
      : percentChange(totalVerifications, previousTotal),
    totalVerificationsCaption: caption,
    pendingReview,
    pendingReviewTrendPercent: isOverall
      ? null
      : percentChange(pendingReview, previousPending),
    pendingReviewCaption: "Awaiting review",
    pendingReviewPercentOfTotal: percentOf(
      pendingReview,
      totalVerifications,
    ),
    verifiedEmployers,
    verifiedEmployersTrendPercent: isOverall
      ? null
      : percentChange(verifiedEmployers, previousVerified),
    verifiedEmployersCaption: "Verified employers",
    verifiedEmployersPercentOfTotal: percentOf(
      verifiedEmployers,
      totalVerifications,
    ),
    needsAttention,
    needsAttentionTrendPercent: isOverall
      ? null
      : percentChange(needsAttention, previousNeedsAttention),
    needsAttentionCaption: "Requires follow-up",
    needsAttentionPercentOfTotal: percentOf(
      needsAttention,
      totalVerifications,
    ),
    rejected,
    rejectedTrendPercent: isOverall
      ? null
      : percentChange(rejected, previousRejected),
    rejectedCaption: "Verification rejected",
    rejectedPercentOfTotal: percentOf(rejected, totalVerifications),
  };

  const tabs: OperationsVerificationsTabCounts = {
    overview: tabOverview,
    pending: tabPending,
    underReview: tabUnderReview,
    verified: tabVerified,
    rejected: tabRejected,
    slaBreaches: tabSlaBreaches,
  };

  // Current operational status mix (all-time) — matches tabs / sidebar pending badge.
  // Trend + KPI cohort stay date-range scoped above.
  const statusTotal =
    tabPending + tabUnderReview + tabVerified + tabRejected;
  const byStatus: OperationsVerificationsStatusCount[] = [
    {
      key: "pending",
      label: "Pending",
      count: tabPending,
      percent: percentOf(tabPending, statusTotal),
    },
    {
      key: "under_review",
      label: "Under Review",
      count: tabUnderReview,
      percent: percentOf(tabUnderReview, statusTotal),
    },
    {
      key: "verified",
      label: "Verified",
      count: tabVerified,
      percent: percentOf(tabVerified, statusTotal),
    },
    {
      key: "rejected",
      label: "Rejected",
      count: tabRejected,
      percent: percentOf(tabRejected, statusTotal),
    },
  ].filter((item) => item.count > 0);

  const categoryCounts = new Map<string, { label: string; count: number }>();
  for (const row of documentTypeRows) {
    const mapped = mapDocumentTypeToCategory(String(row._id ?? ""));
    const existing = categoryCounts.get(mapped.key);
    if (existing) {
      existing.count += row.count;
    } else {
      categoryCounts.set(mapped.key, {
        label: mapped.label,
        count: row.count,
      });
    }
  }
  const documentsBreakdown: OperationsVerificationsNamedCount[] =
    DOCUMENT_CATEGORY_ORDER.filter((key) => categoryCounts.has(key)).map(
      (key) => ({
        key,
        label: categoryCounts.get(key)!.label,
        count: categoryCounts.get(key)!.count,
      }),
    );

  const byIndustry = mapCountRowsToBucket(industryRows, TOP_INDUSTRY_LIMIT);

  const locationCounts = new Map<string, number>();
  for (const row of locationRows) {
    const label = resolveIndiaStateLabel(row._id?.state, row._id?.city);
    locationCounts.set(
      label,
      (locationCounts.get(label) ?? 0) + row.count,
    );
  }
  const states: OperationsVerificationsNamedCount[] = Array.from(
    locationCounts.entries(),
  )
    .map(([label, count]) => ({
      key: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      count,
    }))
    .sort((a, b) => {
      if (a.label === "Unspecified") return 1;
      if (b.label === "Unspecified") return -1;
      return b.count - a.count;
    });
  const topStates = states
    .filter((item) => item.label !== "Unspecified")
    .slice(0, TOP_STATES_LIMIT);

  const submittedMap = new Map<string, number>();
  for (const row of submittedSeriesRows) {
    if (!row._id) continue;
    submittedMap.set(
      String(row._id),
      (submittedMap.get(String(row._id)) ?? 0) + row.count,
    );
  }
  const verifiedMap = new Map<string, number>();
  for (const row of verifiedSeriesRows) {
    if (!row._id) continue;
    verifiedMap.set(
      String(row._id),
      (verifiedMap.get(String(row._id)) ?? 0) + row.count,
    );
  }
  const rejectedMap = new Map<string, number>();
  for (const row of rejectedSeriesRows) {
    if (!row._id) continue;
    rejectedMap.set(
      String(row._id),
      (rejectedMap.get(String(row._id)) ?? 0) + row.count,
    );
  }

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

  const trend = buildTrend(
    trendFrom,
    to,
    granularity,
    submittedMap,
    verifiedMap,
    rejectedMap,
  );

  return {
    range,
    kpis,
    tabs,
    trend,
    byStatus,
    documentsBreakdown,
    byIndustry,
    byLocation: { states, topStates },
    sla: {
      averageDays: currentSla.averageDays,
      averageDaysTrendPercent:
        currentSla.averageDays == null || previousSla.averageDays == null
          ? null
          : percentChange(currentSla.averageDays, previousSla.averageDays),
      withinSlaPercent: currentSla.withinSlaPercent,
      withinSlaTrendPercent:
        currentSla.withinSlaPercent == null ||
        previousSla.withinSlaPercent == null
          ? null
          : percentChange(
              currentSla.withinSlaPercent,
              previousSla.withinSlaPercent,
            ),
      beyondSlaPercent: currentSla.beyondSlaPercent,
      beyondSlaTrendPercent:
        currentSla.beyondSlaPercent == null ||
        previousSla.beyondSlaPercent == null
          ? null
          : percentChange(
              currentSla.beyondSlaPercent,
              previousSla.beyondSlaPercent,
            ),
      targetDays: SLA_TARGET_DAYS,
    },
  };
}
