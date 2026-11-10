/**
 * Shared engine for Operations "Activity & History" timelines (candidates,
 * employers). A timeline is a k-way merge of independent sources; each source
 * returns at most `limit + 1` rows strictly after an `(at, id)` cursor, newest
 * first, so no source is ever loaded in full. Totals come from per-source
 * count queries, never from a page.
 */

// ---------------------------------------------------------------------------
// Cursor + ordering
// ---------------------------------------------------------------------------

export type ActivityCursor = { at: Date; id: string };

const CURSOR_ID_PATTERN = /^[a-z_]+:[A-Za-z0-9_:.-]{1,200}$/;

export function encodeActivityCursor(cursor: ActivityCursor): string {
  return Buffer.from(
    JSON.stringify({ a: cursor.at.toISOString(), i: cursor.id }),
    "utf8",
  ).toString("base64url");
}

/** Returns null for anything that is not a cursor this module produced. */
export function decodeActivityCursor(value: string): ActivityCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const { a, i } = parsed as { a?: unknown; i?: unknown };
    if (typeof a !== "string" || typeof i !== "string") {
      return null;
    }
    if (!CURSOR_ID_PATTERN.test(i)) {
      return null;
    }
    const at = new Date(a);
    return Number.isNaN(at.getTime()) ? null : { at, id: i };
  } catch {
    return null;
  }
}

export type ActivityOrdered = { at: Date; id: string };

/**
 * Newest first; equal timestamps order by id descending using plain
 * code-unit comparison, which matches MongoDB's binary string ordering for
 * the ASCII ids used here.
 */
export function compareActivityOrder(a: ActivityOrdered, b: ActivityOrdered): number {
  const diff = b.at.getTime() - a.at.getTime();
  if (diff !== 0) {
    return diff;
  }
  if (a.id === b.id) {
    return 0;
  }
  return a.id < b.id ? 1 : -1;
}

/** True when `entry` sorts strictly after `cursor` in newest-first order. */
export function comesAfterCursor(
  entry: ActivityOrdered,
  cursor: ActivityCursor,
): boolean {
  const entryAt = entry.at.getTime();
  const cursorAt = cursor.at.getTime();
  return entryAt < cursorAt || (entryAt === cursorAt && entry.id < cursor.id);
}

// ---------------------------------------------------------------------------
// Sources, merge, counts
// ---------------------------------------------------------------------------

export type ActivityEntryBase<C extends string> = ActivityOrdered & {
  category: C;
};

export type ActivityFetchParams<C extends string> = {
  cursor: ActivityCursor | null;
  limit: number;
  category: C | null;
};

export type ActivitySource<C extends string, E extends ActivityEntryBase<C>> = {
  name: string;
  categories: readonly C[];
  /** Newest first, strictly after `cursor`, at most `limit` rows. */
  fetch(params: ActivityFetchParams<C>): Promise<E[]>;
  /** Totals per category over the whole source (not just one page). */
  count(): Promise<Partial<Record<C, number>>>;
};

export function inMemoryActivitySource<C extends string, E extends ActivityEntryBase<C>>(
  name: string,
  entries: E[],
): ActivitySource<C, E> {
  const sorted = [...entries].sort(compareActivityOrder);
  const categories = [...new Set(sorted.map((entry) => entry.category))];
  return {
    name,
    categories,
    async fetch({ cursor, limit, category }) {
      const rows: E[] = [];
      for (const entry of sorted) {
        if (rows.length >= limit) {
          break;
        }
        if (category && entry.category !== category) {
          continue;
        }
        if (cursor && !comesAfterCursor(entry, cursor)) {
          continue;
        }
        rows.push(entry);
      }
      return rows;
    },
    async count() {
      const counts: Partial<Record<C, number>> = {};
      for (const entry of sorted) {
        counts[entry.category] = (counts[entry.category] ?? 0) + 1;
      }
      return counts;
    },
  };
}

export type ActivityPage<E> = {
  entries: E[];
  hasMore: boolean;
  nextCursor: ActivityCursor | null;
};

export async function paginateActivity<C extends string, E extends ActivityEntryBase<C>>(
  sources: readonly ActivitySource<C, E>[],
  params: ActivityFetchParams<C>,
): Promise<ActivityPage<E>> {
  const limit = Math.max(1, Math.floor(params.limit));
  const { cursor, category } = params;
  const relevant = sources.filter(
    (source) => !category || source.categories.includes(category),
  );
  // Each source may contribute the whole page, so ask for one extra row to
  // know whether anything remains after it.
  const batches = await Promise.all(
    relevant.map((source) =>
      source.fetch({ cursor, limit: limit + 1, category }),
    ),
  );

  const seen = new Set<string>();
  const merged: E[] = [];
  for (const batch of batches) {
    for (const entry of batch) {
      if (category && entry.category !== category) {
        continue;
      }
      if (cursor && !comesAfterCursor(entry, cursor)) {
        continue;
      }
      if (seen.has(entry.id)) {
        continue;
      }
      seen.add(entry.id);
      merged.push(entry);
    }
  }
  merged.sort(compareActivityOrder);

  const page = merged.slice(0, limit);
  const hasMore = merged.length > limit;
  const last = page.at(-1);
  return {
    entries: page,
    hasMore,
    nextCursor: hasMore && last ? { at: last.at, id: last.id } : null,
  };
}

export type ActivityCategoryCounts<C extends string> = Record<"all" | C, number>;

export function emptyActivityCounts<C extends string>(
  categories: readonly C[],
): ActivityCategoryCounts<C> {
  return Object.fromEntries([
    ["all", 0],
    ...categories.map((category) => [category, 0]),
  ]) as ActivityCategoryCounts<C>;
}

export async function countActivity<C extends string, E extends ActivityEntryBase<C>>(
  sources: readonly ActivitySource<C, E>[],
  categories: readonly C[],
): Promise<ActivityCategoryCounts<C>> {
  const totals = emptyActivityCounts(categories);
  const results = await Promise.all(sources.map((source) => source.count()));
  for (const result of results) {
    for (const category of categories) {
      const value = result[category] ?? 0;
      if (value > 0) {
        totals[category] += value;
        totals.all += value;
      }
    }
  }
  return totals;
}

// ---------------------------------------------------------------------------
// Shared value helpers
// ---------------------------------------------------------------------------

export function activityDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function activityText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function activityRefId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const id = String(value);
  return id ? id : null;
}

export function activityPlural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function earliestActivityDate(
  values: Array<Date | null | undefined>,
): Date | null {
  let found: Date | null = null;
  for (const value of values) {
    const date = activityDate(value ?? null);
    if (date && (!found || date < found)) {
      found = date;
    }
  }
  return found;
}

export type LoginClientSummary = {
  browser?: string | null;
  os?: string | null;
  deviceType?: string | null;
} | null;

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
};

export function describeLoginClient(client: LoginClientSummary | undefined): string {
  const browser = activityText(client?.browser);
  const os = activityText(client?.os);
  const device = DEVICE_LABELS[activityText(client?.deviceType)] ?? "";
  const software = browser && os ? `${browser} on ${os}` : browser || os;
  const parts = [software, device].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Device not recorded";
}

export type JourneyStageDraft<Id extends string> = {
  id: Id;
  label: string;
  reached: boolean;
  at: Date | null;
  detail: string;
};

export type JourneyStage<Id extends string> = {
  id: Id;
  label: string;
  state: "done" | "current" | "pending";
  /** Null when reached but the source has no recorded timestamp. */
  at: string | null;
  detail: string;
};

/** The first unreached stage is "current"; later unreached stages are "pending". */
export function finalizeJourney<Id extends string>(
  stages: JourneyStageDraft<Id>[],
): JourneyStage<Id>[] {
  const firstPendingIndex = stages.findIndex((stage) => !stage.reached);
  return stages.map((stage, index) => ({
    id: stage.id,
    label: stage.label,
    state: stage.reached
      ? "done"
      : index === firstPendingIndex
        ? "current"
        : "pending",
    at: stage.reached && stage.at ? stage.at.toISOString() : null,
    detail: stage.detail,
  }));
}

// ---------------------------------------------------------------------------
// MongoDB pipelines
// ---------------------------------------------------------------------------

export type ActivityStage = Record<string, unknown>;

export function activityCursorMatch(cursor: ActivityCursor): ActivityStage {
  return {
    $or: [
      { at: { $lt: cursor.at } },
      { at: cursor.at, eventId: { $lt: cursor.id } },
    ],
  };
}

export type TimestampedActivitySourceConfig = {
  match: Record<string, unknown>;
  /** Expression producing the event time, e.g. "$savedAt". */
  atExpression: unknown;
  /**
   * Stored date field equal to `atExpression`; lets the first `$match` use
   * the `(owner, field)` index to skip rows newer than the cursor.
   */
  indexedAtField?: string;
  idPrefix: string;
  project: Record<string, 1>;
};

export function buildTimestampedActivityPipeline(
  config: TimestampedActivitySourceConfig,
  params: { cursor: ActivityCursor | null; limit: number },
): ActivityStage[] {
  const { cursor } = params;
  const firstMatch =
    cursor && config.indexedAtField
      ? { ...config.match, [config.indexedAtField]: { $lte: cursor.at } }
      : config.match;
  return [
    { $match: firstMatch },
    {
      $project: {
        ...config.project,
        at: config.atExpression,
        eventId: { $concat: [config.idPrefix, { $toString: "$_id" }] },
      },
    },
    { $match: { at: { $type: "date" }, ...(cursor ? activityCursorMatch(cursor) : {}) } },
    { $sort: { at: -1, eventId: -1 } },
    { $limit: params.limit },
  ];
}

export function buildTimestampedActivityCountPipeline(
  config: TimestampedActivitySourceConfig,
): ActivityStage[] {
  return [
    { $match: config.match },
    { $project: { at: config.atExpression } },
    { $match: { at: { $type: "date" } } },
    { $count: "count" },
  ];
}

// ---------------------------------------------------------------------------
// Application events (shared by candidate and employer timelines)
// ---------------------------------------------------------------------------

export const APPLICATION_ACTIVITY_CATEGORIES = [
  "application",
  "interview",
  "offer",
] as const;

export type ApplicationActivityCategory =
  (typeof APPLICATION_ACTIVITY_CATEGORIES)[number];

export const SHORTLISTED_OR_LATER_STATUSES = [
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
  "did_not_join",
] as const;
export const INTERVIEW_STATUSES = ["interview_scheduled", "interview_completed"] as const;
export const OFFER_STATUSES = ["offer_sent"] as const;
export const HIRED_STATUSES = ["selected", "joined"] as const;
export const TERMINAL_APPLICATION_STATUSES = [
  "joined",
  "did_not_join",
  "rejected",
  "withdrawn",
] as const;

export type ApplicationActivityRowKind =
  | "history"
  | "applied"
  | "interview_cancelled"
  | "offer_response";

export type ApplicationActivityRow = {
  eventId: string;
  at: Date;
  kind: ApplicationActivityRowKind;
  status?: string | null;
  actorType?: string | null;
  remark?: string | null;
  reason?: string | null;
  applicationId: unknown;
  jobId?: unknown;
  employerId?: unknown;
  jobSeekerId?: unknown;
  publicJobId?: string | null;
};

export function applicationActivityCategory(
  kind: ApplicationActivityRowKind,
  status: string,
): ApplicationActivityCategory {
  if (kind === "interview_cancelled") {
    return "interview";
  }
  if (kind === "offer_response") {
    return "offer";
  }
  if (kind === "history") {
    if ((INTERVIEW_STATUSES as readonly string[]).includes(status)) {
      return "interview";
    }
    if ((OFFER_STATUSES as readonly string[]).includes(status)) {
      return "offer";
    }
  }
  return "application";
}

const APPLICATION_ID_STRING = { $toString: "$_id" };

function applicationEventId(suffix: unknown[]): ActivityStage {
  return { $concat: ["application:", APPLICATION_ID_STRING, ...suffix] };
}

/** Unwinds each matched application into its dated events with a category. */
export function buildApplicationEventStages(
  match: Record<string, unknown>,
): ActivityStage[] {
  return [
    { $match: match },
    {
      $project: {
        jobId: 1,
        employerId: 1,
        jobSeekerId: 1,
        publicJobId: 1,
        events: {
          $concatArrays: [
            {
              $map: {
                input: {
                  $range: [0, { $size: { $ifNull: ["$statusHistory", []] } }],
                },
                as: "i",
                in: {
                  $let: {
                    vars: { entry: { $arrayElemAt: ["$statusHistory", "$$i"] } },
                    in: {
                      kind: "history",
                      status: "$$entry.status",
                      at: "$$entry.at",
                      actorType: "$$entry.actorType",
                      remark: "$$entry.remark",
                      eventId: applicationEventId([
                        ":history:",
                        { $toString: "$$i" },
                      ]),
                    },
                  },
                },
              },
            },
            {
              $cond: [
                {
                  $and: [
                    { $ne: [{ $ifNull: ["$appliedAt", null] }, null] },
                    {
                      $not: [
                        {
                          $in: [
                            "submitted",
                            { $ifNull: ["$statusHistory.status", []] },
                          ],
                        },
                      ],
                    },
                  ],
                },
                [
                  {
                    kind: "applied",
                    at: "$appliedAt",
                    eventId: applicationEventId([":applied"]),
                  },
                ],
                [],
              ],
            },
            {
              $cond: [
                { $ne: [{ $ifNull: ["$interview.cancelledAt", null] }, null] },
                [
                  {
                    kind: "interview_cancelled",
                    at: "$interview.cancelledAt",
                    reason: "$interview.cancellationReason",
                    eventId: applicationEventId([":interview_cancelled"]),
                  },
                ],
                [],
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        { $ifNull: ["$offerResponse.respondedAt", null] },
                        null,
                      ],
                    },
                    {
                      $in: ["$offerResponse.status", ["accepted", "declined"]],
                    },
                  ],
                },
                [
                  {
                    kind: "offer_response",
                    status: "$offerResponse.status",
                    at: "$offerResponse.respondedAt",
                    eventId: applicationEventId([
                      ":offer_",
                      "$offerResponse.status",
                    ]),
                  },
                ],
                [],
              ],
            },
          ],
        },
      },
    },
    { $unwind: "$events" },
    {
      $replaceWith: {
        $mergeObjects: [
          "$events",
          {
            applicationId: "$_id",
            jobId: "$jobId",
            employerId: "$employerId",
            jobSeekerId: "$jobSeekerId",
            publicJobId: "$publicJobId",
          },
        ],
      },
    },
    {
      $match: {
        at: { $type: "date" },
        $or: [{ kind: { $ne: "history" } }, { status: { $nin: [null, ""] } }],
      },
    },
    {
      $addFields: {
        category: {
          $switch: {
            branches: [
              { case: { $eq: ["$kind", "interview_cancelled"] }, then: "interview" },
              { case: { $eq: ["$kind", "offer_response"] }, then: "offer" },
              {
                case: {
                  $and: [
                    { $eq: ["$kind", "history"] },
                    { $in: ["$status", [...INTERVIEW_STATUSES]] },
                  ],
                },
                then: "interview",
              },
              {
                case: {
                  $and: [
                    { $eq: ["$kind", "history"] },
                    { $in: ["$status", [...OFFER_STATUSES]] },
                  ],
                },
                then: "offer",
              },
            ],
            default: "application",
          },
        },
      },
    },
  ];
}

export function buildApplicationEventPagePipeline(params: {
  match: Record<string, unknown>;
  cursor: ActivityCursor | null;
  limit: number;
  category: string | null;
}): ActivityStage[] {
  return [
    ...buildApplicationEventStages(params.match),
    ...(params.category ? [{ $match: { category: params.category } }] : []),
    ...(params.cursor ? [{ $match: activityCursorMatch(params.cursor) }] : []),
    { $sort: { at: -1, eventId: -1 } },
    { $limit: params.limit },
  ];
}

export function buildApplicationEventCountPipeline(
  match: Record<string, unknown>,
): ActivityStage[] {
  return [
    ...buildApplicationEventStages(match),
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ];
}

export type ApplicationActivityStats = {
  applications: number;
  active: number;
  shortlisted: number;
  interviews: number;
  offers: number;
  hired: number;
  offersAccepted: number;
  offersDeclined: number;
  rejected: number;
  withdrawn: number;
  firstAppliedAt: Date | null;
  firstSubmittedAt: Date | null;
  firstShortlistedAt: Date | null;
  firstInterviewAt: Date | null;
  firstOfferAt: Date | null;
  firstHiredAt: Date | null;
};

function reachedAny(statuses: readonly string[]): ActivityStage {
  return {
    $cond: [
      { $gt: [{ $size: { $setIntersection: ["$reached", [...statuses]] } }, 0] },
      1,
      0,
    ],
  };
}

function firstHistoryAt(statuses: readonly string[]): ActivityStage {
  return {
    $min: {
      $cond: [
        { $in: ["$statusHistory.status", [...statuses]] },
        "$statusHistory.at",
        null,
      ],
    },
  };
}

export function buildApplicationActivityStatsPipeline(
  match: Record<string, unknown>,
): ActivityStage[] {
  return [
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $project: {
              appliedAt: 1,
              status: { $ifNull: ["$status", "submitted"] },
              offerStatus: "$offerResponse.status",
              reached: {
                $setUnion: [
                  { $ifNull: ["$statusHistory.status", []] },
                  [{ $ifNull: ["$status", "submitted"] }],
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              applications: { $sum: 1 },
              active: {
                $sum: {
                  $cond: [{ $in: ["$status", [...TERMINAL_APPLICATION_STATUSES]] }, 0, 1],
                },
              },
              shortlisted: { $sum: reachedAny(SHORTLISTED_OR_LATER_STATUSES) },
              interviews: { $sum: reachedAny(INTERVIEW_STATUSES) },
              offers: { $sum: reachedAny(OFFER_STATUSES) },
              hired: { $sum: reachedAny(HIRED_STATUSES) },
              offersAccepted: {
                $sum: { $cond: [{ $eq: ["$offerStatus", "accepted"] }, 1, 0] },
              },
              offersDeclined: {
                $sum: { $cond: [{ $eq: ["$offerStatus", "declined"] }, 1, 0] },
              },
              rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
              withdrawn: {
                $sum: { $cond: [{ $eq: ["$status", "withdrawn"] }, 1, 0] },
              },
              firstAppliedAt: { $min: "$appliedAt" },
            },
          },
        ],
        milestones: [
          { $unwind: "$statusHistory" },
          { $match: { "statusHistory.at": { $type: "date" } } },
          {
            $group: {
              _id: null,
              firstSubmittedAt: firstHistoryAt(["submitted"]),
              firstShortlistedAt: firstHistoryAt(SHORTLISTED_OR_LATER_STATUSES),
              firstInterviewAt: firstHistoryAt(INTERVIEW_STATUSES),
              firstOfferAt: firstHistoryAt(OFFER_STATUSES),
              firstHiredAt: firstHistoryAt(HIRED_STATUSES),
            },
          },
        ],
      },
    },
  ];
}

export function activityNumberField(
  source: Record<string, unknown> | undefined,
  key: string,
): number {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function activityDateField(
  source: Record<string, unknown> | undefined,
  key: string,
): Date | null {
  const value = source?.[key];
  return value instanceof Date || typeof value === "string" ? activityDate(value) : null;
}

export function parseApplicationActivityStats(rows: unknown[]): ApplicationActivityStats {
  const facet = (rows[0] ?? {}) as {
    totals?: Record<string, unknown>[];
    milestones?: Record<string, unknown>[];
  };
  const totals = facet.totals?.[0];
  const milestones = facet.milestones?.[0];
  return {
    applications: activityNumberField(totals, "applications"),
    active: activityNumberField(totals, "active"),
    shortlisted: activityNumberField(totals, "shortlisted"),
    interviews: activityNumberField(totals, "interviews"),
    offers: activityNumberField(totals, "offers"),
    hired: activityNumberField(totals, "hired"),
    offersAccepted: activityNumberField(totals, "offersAccepted"),
    offersDeclined: activityNumberField(totals, "offersDeclined"),
    rejected: activityNumberField(totals, "rejected"),
    withdrawn: activityNumberField(totals, "withdrawn"),
    firstAppliedAt: activityDateField(totals, "firstAppliedAt"),
    firstSubmittedAt: activityDateField(milestones, "firstSubmittedAt"),
    firstShortlistedAt: activityDateField(milestones, "firstShortlistedAt"),
    firstInterviewAt: activityDateField(milestones, "firstInterviewAt"),
    firstOfferAt: activityDateField(milestones, "firstOfferAt"),
    firstHiredAt: activityDateField(milestones, "firstHiredAt"),
  };
}
