"use client";

import { getApiUrl } from "@/constants/env";
import {
  emptyAttribution,
  resolveAttribution,
  type AttributionTouch,
} from "./analytics-attribution";
import { forwardToFirebase } from "./firebase-analytics";

const VISITOR_KEY = "aslijobs_analytics_visitor_id";
const SESSION_KEY = "aslijobs_analytics_session_id";
const FIRST_KEY = "aslijobs_analytics_first_touch";
const LANDING_KEY = "aslijobs_analytics_landing_path";
const SESSION_TTL_MS = 30 * 60 * 1000;

export type AnalyticsEventName =
  | "page_view"
  | "registration_started"
  | "registration_completed"
  | "otp_verified"
  | "profile_completed"
  | "job_search"
  | "job_detail_viewed"
  | "job_apply_started"
  | "job_application_submitted"
  | "employer_job_posted";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreate(storage: Storage, key: string): string {
  const existing = storage.getItem(key)?.trim();
  if (existing && existing.length >= 8) return existing;
  const next = createId();
  storage.setItem(key, next);
  return next;
}

function resolveSessionId(): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; at?: number };
      if (parsed.id && parsed.at && Date.now() - parsed.at < SESSION_TTL_MS) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, at: Date.now() }));
        return parsed.id;
      }
    }
  } catch {
    // ignore
  }
  const id = createId();
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    // ignore
  }
  return id;
}

function currentTouch(): AttributionTouch {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get("utm_source") ?? "",
    medium: params.get("utm_medium") ?? "",
    campaign: params.get("utm_campaign") ?? "",
    content: params.get("utm_content") ?? "",
    term: params.get("utm_term") ?? "",
  };
}

function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    return new URL(document.referrer).hostname;
  } catch {
    return "";
  }
}

function readStoredFirst(): AttributionTouch | null {
  try {
    const raw = localStorage.getItem(FIRST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AttributionTouch;
  } catch {
    return null;
  }
}

export function trackAnalyticsEvent(input: {
  eventName: AnalyticsEventName;
  path?: string;
  portal?: "public_site" | "employer" | "job_seeker";
  audience?: "job_seeker" | "employer" | "unknown";
}): void {
  if (typeof window === "undefined") return;
  if (/bot|spider|crawler|headless/i.test(navigator.userAgent)) return;
  const path = (input.path || window.location.pathname || "/").split("?")[0] || "/";
  const dedupeKey = `${input.eventName}:${input.audience ?? ""}:${path}`;
  try {
    const recentAt = Number(sessionStorage.getItem(`aslijobs_ev:${dedupeKey}`) ?? "0");
    if (recentAt && Date.now() - recentAt < 2000) return;
    sessionStorage.setItem(`aslijobs_ev:${dedupeKey}`, String(Date.now()));
  } catch {
    // The request still sends an idempotency key.
  }
  forwardToFirebase(input);
  const visitorId = readOrCreate(localStorage, VISITOR_KEY);
  const sessionId = resolveSessionId();
  const attribution = resolveAttribution({
    storedFirst: readStoredFirst(),
    current: currentTouch(),
    referrerHost: referrerHost(),
  });
  try {
    localStorage.setItem(FIRST_KEY, JSON.stringify(attribution.first));
    if (!localStorage.getItem(LANDING_KEY)) localStorage.setItem(LANDING_KEY, path);
  } catch {
    // ignore
  }
  const landingPath = localStorage.getItem(LANDING_KEY) || path;
  const payload = {
    eventName: input.eventName,
    visitorId,
    sessionId,
    path,
    portal: input.portal ?? "public_site",
    audience: input.audience ?? "unknown",
    device: /ipad|tablet/i.test(navigator.userAgent)
      ? "tablet"
      : /mobi|iphone|android/i.test(navigator.userAgent)
        ? "mobile"
        : "desktop",
    referrerHost: referrerHost(),
    utmSource: attribution.first.source,
    utmMedium: attribution.first.medium,
    utmCampaign: attribution.first.campaign,
    utmContent: attribution.first.content,
    utmTerm: attribution.first.term,
    sessionUtmSource: attribution.session.source,
    sessionUtmMedium: attribution.session.medium,
    sessionUtmCampaign: attribution.session.campaign,
    sessionUtmContent: attribution.session.content,
    sessionUtmTerm: attribution.session.term,
    landingPath,
    idempotencyKey: `${visitorId}:${input.eventName}:${path}:${sessionId}`.slice(0, 140),
  };
  void fetch(`${getApiUrl()}/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    // Tracking must not block the workflow.
  });
}

export { emptyAttribution };
