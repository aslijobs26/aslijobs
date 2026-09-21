"use client";

import { getApiUrl } from "@/constants/env";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export type AnalyticsPortal = "public_site" | "employer" | "job_seeker";

const VISITOR_KEY = "aslijobs_analytics_visitor_id";
const SESSION_KEY = "aslijobs_analytics_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000;

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
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
      if (
        parsed.id &&
        parsed.at &&
        Date.now() - parsed.at < SESSION_TTL_MS
      ) {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ id: parsed.id, at: Date.now() }),
        );
        return parsed.id;
      }
    }
  } catch {
    // fall through
  }
  const id = createId();
  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ id, at: Date.now() }),
    );
  } catch {
    // ignore
  }
  return id;
}

function detectDevice(): "desktop" | "mobile" | "tablet" | "unknown" {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "unknown";
}

function referrerHost(): string {
  try {
    if (!document.referrer) return "";
    return new URL(document.referrer).hostname;
  } catch {
    return "";
  }
}

type AnalyticsPageViewBeaconProps = {
  portal: AnalyticsPortal;
};

/**
 * Privacy-safe page_view beacon for website analytics.
 * Stores only opaque visitor/session IDs + path/device/referrer host.
 */
export function AnalyticsPageViewBeacon({
  portal,
}: AnalyticsPageViewBeaconProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastSentRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const path = pathname || "/";
    const dedupeKey = `${portal}:${path}`;
    if (lastSentRef.current === dedupeKey) return;
    lastSentRef.current = dedupeKey;

    const visitorId = readOrCreate(localStorage, VISITOR_KEY);
    const sessionId = resolveSessionId();
    const utmSource = searchParams.get("utm_source") ?? "";
    const utmMedium = searchParams.get("utm_medium") ?? "";
    const utmCampaign = searchParams.get("utm_campaign") ?? "";

    const payload = {
      eventName: "page_view" as const,
      visitorId,
      sessionId,
      path,
      portal,
      device: detectDevice(),
      referrerHost: referrerHost(),
      utmSource,
      utmMedium,
      utmCampaign,
    };

    const url = `${getApiUrl()}/analytics/events`;
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit",
    }).catch(() => {
      // Analytics must never break the page.
    });
  }, [pathname, portal, searchParams]);

  return null;
}
