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

export async function trackAnalyticsEvent(
  input: TrackAnalyticsEventBody,
): Promise<{ id: string }> {
  const occurredAt = input.occurredAt
    ? new Date(input.occurredAt)
    : new Date();

  const doc = await AnalyticsEventModel.create({
    eventName: input.eventName,
    occurredAt,
    visitorId: input.visitorId.trim(),
    sessionId: input.sessionId.trim(),
    path: sanitizePath(input.path),
    portal: input.portal,
    device: input.device,
    referrerHost: sanitizeHost(input.referrerHost ?? ""),
    utmSource: (input.utmSource ?? "").trim().slice(0, 120),
    utmMedium: (input.utmMedium ?? "").trim().slice(0, 120),
    utmCampaign: (input.utmCampaign ?? "").trim().slice(0, 120),
  });

  return { id: String(doc._id) };
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

export async function aggregateWebsiteTraffic(
  from: Date,
  to: Date,
): Promise<WebsiteTrafficAggregate> {
  const match = {
    eventName: "page_view" as const,
    occurredAt: { $gte: from, $lte: to },
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
