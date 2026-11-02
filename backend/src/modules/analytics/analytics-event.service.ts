import { MongoServerError } from "mongodb";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { AnalyticsEventModel } from "./analytics-event.model.js";
import type { TrackAnalyticsEventBody } from "./analytics-event.validation.js";

function sanitizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return `/${trimmed.slice(0, 499)}`;
  }
  // Drop query strings / hashes from stored path.
  return trimmed.split("?")[0]?.split("#")[0]?.slice(0, 500) || "/";
}

function sanitizeHost(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  try {
    if (trimmed.includes("://")) {
      return new URL(trimmed).hostname.slice(0, 255);
    }
    return trimmed.replace(/[^a-z0-9.-]/g, "").slice(0, 255);
  } catch {
    return "";
  }
}

function sanitizeUtm(value: string | undefined): string {
  const text = String(value ?? "").trim().replace(/[\r\n\t]/g, "").slice(0, 120);
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return "";
  if (/\+?\d[\d\s-]{8,}\d/.test(text)) return "";
  return text;
}

export async function trackAnalyticsEvent(
  input: TrackAnalyticsEventBody,
): Promise<{ id: string; duplicate?: boolean }> {
  const now = Date.now();
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    throw new AppError("occurredAt is not a valid time.", HTTP_STATUS.BAD_REQUEST);
  }
  if (occurredAt.getTime() > now + 5 * 60_000) {
    throw new AppError("occurredAt cannot be in the future.", HTTP_STATUS.BAD_REQUEST);
  }
  if (now - occurredAt.getTime() > 48 * 60 * 60_000) {
    throw new AppError(
      "occurredAt is too old to record. Historical events are not backfilled by the public tracker.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  const idempotencyKey = sanitizeUtm(input.idempotencyKey).slice(0, 140);
  try {
    const doc = await AnalyticsEventModel.create({
      eventName: input.eventName,
      occurredAt,
      visitorId: input.visitorId.trim(),
      sessionId: input.sessionId.trim(),
      path: sanitizePath(input.path),
      portal: input.portal,
      device: input.device,
      referrerHost: sanitizeHost(input.referrerHost ?? ""),
      utmSource: sanitizeUtm(input.utmSource),
      utmMedium: sanitizeUtm(input.utmMedium),
      utmCampaign: sanitizeUtm(input.utmCampaign),
      utmContent: sanitizeUtm(input.utmContent),
      utmTerm: sanitizeUtm(input.utmTerm),
      sessionUtmSource: sanitizeUtm(input.sessionUtmSource),
      sessionUtmMedium: sanitizeUtm(input.sessionUtmMedium),
      sessionUtmCampaign: sanitizeUtm(input.sessionUtmCampaign),
      sessionUtmContent: sanitizeUtm(input.sessionUtmContent),
      sessionUtmTerm: sanitizeUtm(input.sessionUtmTerm),
      landingPath: sanitizePath(input.landingPath || input.path),
      audience: input.audience,
      idempotencyKey,
    });
    return { id: String(doc._id) };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000 && idempotencyKey) {
      return { id: idempotencyKey, duplicate: true };
    }
    throw error;
  }
}

export type WebsiteTrafficAggregate = {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  newVisitors: number;
  returningVisitors: number;
  topPages: Array<{ path: string; count: number }>;
  byDevice: Array<{ device: string; count: number }>;
  bySourceHost: Array<{ host: string; count: number }>;
  daily: Array<{ date: string; pageViews: number; uniqueVisitors: number }>;
};

export function classifyNewReturningVisitors(
  periodVisitorIds: string[],
  priorVisitorIds: string[],
): { newVisitors: number; returningVisitors: number } {
  const previousSet = new Set(priorVisitorIds);
  let returningVisitors = 0;
  for (const visitorId of periodVisitorIds) {
    if (previousSet.has(visitorId)) returningVisitors += 1;
  }
  const uniqueVisitors = periodVisitorIds.length;
  return {
    newVisitors: Math.max(uniqueVisitors - returningVisitors, 0),
    returningVisitors,
  };
}

export async function countWebsiteTraffic(
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {},
): Promise<{ pageViews: number; uniqueVisitors: number; sessions: number }> {
  const match = {
    eventName: "page_view" as const,
    occurredAt: { $gte: from, $lte: to },
    ...extra,
  };
  const [pageViews, visitors, sessions] = await Promise.all([
    AnalyticsEventModel.countDocuments(match),
    AnalyticsEventModel.distinct("visitorId", match),
    AnalyticsEventModel.distinct("sessionId", match),
  ]);
  return {
    pageViews,
    uniqueVisitors: visitors.length,
    sessions: sessions.length,
  };
}

export async function aggregateWebsiteTraffic(
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {},
): Promise<WebsiteTrafficAggregate> {
  const match = {
    eventName: "page_view" as const,
    occurredAt: { $gte: from, $lte: to },
    ...extra,
  };

  const [
    pageViews,
    uniqueVisitorRows,
    sessionRows,
    topPages,
    byDevice,
    bySourceHost,
    dailyRows,
    previousVisitorRows,
  ] = await Promise.all([
    AnalyticsEventModel.countDocuments(match),
    AnalyticsEventModel.distinct("visitorId", match),
    AnalyticsEventModel.distinct("sessionId", match),
    AnalyticsEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AnalyticsEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsEventModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...match,
          referrerHost: { $nin: ["", null] },
        },
      },
      { $group: { _id: "$referrerHost", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    AnalyticsEventModel.aggregate<{
      _id: string;
      pageViews: number;
      visitors: string[];
    }>([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$occurredAt",
              timezone: "Asia/Kolkata",
            },
          },
          pageViews: { $sum: 1 },
          visitors: { $addToSet: "$visitorId" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEventModel.distinct("visitorId", {
      eventName: "page_view",
      occurredAt: { $lt: from },
      ...extra,
    }),
  ]);

  const uniqueVisitors = uniqueVisitorRows.length;
  const { newVisitors, returningVisitors } = classifyNewReturningVisitors(
    uniqueVisitorRows,
    previousVisitorRows,
  );

  return {
    pageViews,
    uniqueVisitors,
    sessions: sessionRows.length,
    newVisitors,
    returningVisitors,
    topPages: topPages.map((row) => ({
      path: row._id || "/",
      count: row.count,
    })),
    byDevice: byDevice.map((row) => ({
      device: row._id || "unknown",
      count: row.count,
    })),
    bySourceHost: bySourceHost.map((row) => ({
      host: row._id || "direct",
      count: row.count,
    })),
    daily: dailyRows.map((row) => ({
      date: row._id,
      pageViews: row.pageViews,
      uniqueVisitors: row.visitors.length,
    })),
  };
}

const SERVER_EVENT_NAMES = new Set<string>([
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "candidate_selected",
  "candidate_joined",
]);

/** Server-side hiring event. Does not store candidate names, phones, or remarks. */
export function recordHiringAnalyticsEvent(input: {
  eventName: string;
  applicationId: string;
  employerId: string;
  publicJobId: string;
}): void {
  if (!SERVER_EVENT_NAMES.has(input.eventName)) return;
  const applicationId = input.applicationId.trim();
  const employerId = input.employerId.trim();
  if (applicationId.length < 8 || employerId.length < 8) return;
  const minute = new Date().toISOString().slice(0, 16);
  void AnalyticsEventModel.create({
    eventName: input.eventName,
    occurredAt: new Date(),
    visitorId: `app:${applicationId}`.slice(0, 64),
    sessionId: `emp:${employerId}`.slice(0, 64),
    path: `/jobs/${input.publicJobId || "unknown"}`.slice(0, 500),
    portal: "employer",
    device: "unknown",
    audience: "employer",
    idempotencyKey: `hiring:${applicationId}:${input.eventName}:${minute}`.slice(0, 140),
  }).catch((error: unknown) => {
    if (error instanceof MongoServerError && error.code === 11000) return;
    console.error("[analytics] hiring event was not stored", {
      eventName: input.eventName,
    });
  });
}
