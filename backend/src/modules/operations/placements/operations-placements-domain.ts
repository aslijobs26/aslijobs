import type mongoose from "mongoose";
import { PLACEMENT_APPLICATION_STATUSES } from "../../applications/application.constants.js";
import type { ApplicationStatus } from "../../applications/application.types.js";
import type { PlacementJoiningStatus } from "./operations-placements.types.js";

export const PLACEMENT_STATUS_MATCH = {
  status: { $in: [...PLACEMENT_APPLICATION_STATUSES] },
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const PLACEMENT_JOINING_STATUS_LABELS: Record<
  PlacementJoiningStatus,
  string
> = {
  joining_pending: "Joining Pending",
  joined: "Joined",
  did_not_join: "Did Not Join",
};

export function resolvePlacementJoiningStatus(
  appStatus: ApplicationStatus | string | null | undefined,
): PlacementJoiningStatus | null {
  switch (appStatus) {
    case "selected":
      return "joining_pending";
    case "joined":
      return "joined";
    case "did_not_join":
      return "did_not_join";
    default:
      return null;
  }
}

export function placementStatusLabel(
  joiningStatus: PlacementJoiningStatus | null | undefined,
): string {
  if (!joiningStatus) {
    return "—";
  }
  return PLACEMENT_JOINING_STATUS_LABELS[joiningStatus] ?? "—";
}

export function joiningStatusToApplicationStatus(
  joiningStatus: PlacementJoiningStatus,
): (typeof PLACEMENT_APPLICATION_STATUSES)[number] {
  switch (joiningStatus) {
    case "joining_pending":
      return "selected";
    case "joined":
      return "joined";
    case "did_not_join":
      return "did_not_join";
  }
}

/**
 * Parse offer/joining date strings stored on Application.offer.
 * Accepts YYYY-MM-DD or ISO datetime; returns null when invalid.
 */
export function parseOfferDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Whole calendar days between offer and join (non-negative). */
export function daysBetweenOfferAndJoin(
  offerDate: string | Date | null | undefined,
  joinDate: string | Date | null | undefined,
): number | null {
  const offer = parseOfferDate(offerDate);
  const join = parseOfferDate(joinDate);
  if (!offer || !join) {
    return null;
  }
  const diff = join.getTime() - offer.getTime();
  if (diff < 0) {
    return null;
  }
  return Math.round((diff / MS_PER_DAY) * 10) / 10;
}

export type StatusHistoryLike = {
  status?: string | null;
  at?: Date | string | null;
};

/**
 * Cohort date for placement KPIs: first history entry into a placement status,
 * else fallback to updatedAt.
 */
export function resolvePlacementCohortDate(input: {
  statusHistory?: StatusHistoryLike[] | null;
  updatedAt?: Date | string | null;
}): Date | null {
  const history = Array.isArray(input.statusHistory) ? input.statusHistory : [];
  let earliest: Date | null = null;

  for (const entry of history) {
    const status = String(entry.status ?? "").trim();
    if (
      !(PLACEMENT_APPLICATION_STATUSES as readonly string[]).includes(status)
    ) {
      continue;
    }
    const at = parseOfferDate(entry.at ?? null);
    if (!at) {
      continue;
    }
    if (!earliest || at.getTime() < earliest.getTime()) {
      earliest = at;
    }
  }

  if (earliest) {
    return earliest;
  }

  return parseOfferDate(input.updatedAt ?? null);
}

/** Most recent status-history timestamp for a given status (scan from end). */
export function findStatusHistoryAt(
  history: StatusHistoryLike[] | null | undefined,
  status: string,
): Date | null {
  if (!Array.isArray(history) || !status) {
    return null;
  }
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (String(history[i]?.status ?? "").trim() === status) {
      return parseOfferDate(history[i]?.at ?? null);
    }
  }
  return null;
}

export type PlacementOfferJoinLike = {
  offer?: {
    offerDate?: string | Date | null;
    joiningDate?: string | Date | null;
  } | null;
  statusHistory?: StatusHistoryLike[] | null;
  updatedAt?: Date | string | null;
};

/**
 * When the offer was made: explicit offer.offerDate, else offer_sent history.
 */
export function resolveOfferMadeAt(
  row: PlacementOfferJoinLike,
): Date | null {
  return (
    parseOfferDate(row.offer?.offerDate) ??
    findStatusHistoryAt(row.statusHistory, "offer_sent")
  );
}

/**
 * When the candidate actually joined.
 * Prefer the joined status-history event over the planned offer.joiningDate
 * (planned dates often equal offerDate → false "0 days", and can fall outside
 * the analytics window so the trend series stays empty).
 */
export function resolveActualJoinedAt(
  row: PlacementOfferJoinLike,
): Date | null {
  return (
    findStatusHistoryAt(row.statusHistory, "joined") ??
    parseOfferDate(row.offer?.joiningDate) ??
    resolvePlacementCohortDate({
      statusHistory: row.statusHistory,
      updatedAt: row.updatedAt,
    })
  );
}

export function formatPlacementDisplayId(applicationId: string): string {
  const hex = applicationId.replace(/[^a-fA-F0-9]/g, "").slice(-8).toUpperCase();
  return hex ? `AJ-PLC-${hex}` : "AJ-PLC-UNKNOWN";
}

/**
 * Extract a searchable ObjectId hex from placement display IDs (AJ-PLC-XXXXXXXX)
 * or raw 24-char ObjectIds. Returns null when the token is not an id-like value.
 */
export function extractPlacementSearchObjectId(
  search: string,
): string | null {
  const trimmed = search.trim();
  if (!trimmed) {
    return null;
  }
  if (/^[a-f\d]{24}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  const displayMatch = /^AJ-PLC-([A-F0-9]{6,24})$/i.exec(trimmed);
  if (displayMatch?.[1]) {
    return displayMatch[1].toLowerCase();
  }
  return null;
}

/**
 * Mongo aggregation stages that materialize `placementCohortAt` for list/export
 * date filtering and sorting. Mirrors resolvePlacementCohortDate().
 */
export function placementCohortAtStages(): mongoose.PipelineStage[] {
  return [
    {
      $addFields: {
        placementCohortAt: {
          $let: {
            vars: {
              placementEntries: {
                $filter: {
                  input: { $ifNull: ["$statusHistory", []] },
                  as: "entry",
                  cond: {
                    $in: [
                      "$$entry.status",
                      [...PLACEMENT_APPLICATION_STATUSES],
                    ],
                  },
                },
              },
            },
            in: {
              $cond: [
                { $gt: [{ $size: "$$placementEntries" }, 0] },
                { $min: "$$placementEntries.at" },
                "$updatedAt",
              ],
            },
          },
        },
      },
    },
  ];
}
