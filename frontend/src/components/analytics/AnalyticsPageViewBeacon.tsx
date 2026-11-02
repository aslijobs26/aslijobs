"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackAnalyticsEvent } from "./track-analytics-event";

export type AnalyticsPortal = "public_site" | "employer" | "job_seeker";

type AnalyticsPageViewBeaconProps = {
  portal: AnalyticsPortal;
};

/**
 * Privacy-safe page_view beacon. First-touch UTM is stored once and is not
 * replaced by a later campaign on the same browser.
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
    if (/bot|spider|crawler|headless/i.test(navigator.userAgent)) return;
    const dedupeKey = `${portal}:${path}:${searchParams.toString()}`;
    if (lastSentRef.current === dedupeKey) return;
    lastSentRef.current = dedupeKey;
    trackAnalyticsEvent({
      eventName: "page_view",
      path,
      portal,
      audience: portal === "employer" ? "employer" : portal === "job_seeker" ? "job_seeker" : "unknown",
    });
  }, [pathname, portal, searchParams]);

  return null;
}
