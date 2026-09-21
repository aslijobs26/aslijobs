import { z } from "zod";
import {
  ANALYTICS_DEVICES,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_PORTALS,
} from "./analytics-event.model.js";

export const trackAnalyticsEventBodySchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES),
  visitorId: z.string().trim().min(8).max(64),
  sessionId: z.string().trim().min(8).max(64),
  path: z.string().trim().min(1).max(500),
  portal: z.enum(ANALYTICS_PORTALS).optional().default("public_site"),
  device: z.enum(ANALYTICS_DEVICES).optional().default("unknown"),
  referrerHost: z.string().trim().max(255).optional().default(""),
  utmSource: z.string().trim().max(120).optional().default(""),
  utmMedium: z.string().trim().max(120).optional().default(""),
  utmCampaign: z.string().trim().max(120).optional().default(""),
  occurredAt: z.string().datetime().optional(),
});

export type TrackAnalyticsEventBody = z.infer<
  typeof trackAnalyticsEventBodySchema
>;
