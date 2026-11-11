import type { Analytics } from "firebase/analytics";
import { getFirebaseOptions } from "@/lib/firebase-config";
import {
  hasPrivateUrlData,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsUrl,
} from "./analytics-url";
import { clarityPageType } from "./clarity-routes";
import {
  ctaNameForLink,
  firebaseEventFor,
  isSamePageView,
  type FirebaseEventParams,
  type TrackedAnalyticsEvent,
} from "./firebase-events";

/**
 * Firebase's gtag.js gets its own globals. On the default `dataLayer` it would
 * share a queue with the GTM container and its GA4 tag.
 */
const DATA_LAYER_NAME = "firebaseDataLayer";
const GTAG_NAME = "firebaseGtag";

/** Development events show in Firebase DebugView. */
const DEBUG_PARAMS: FirebaseEventParams =
  process.env.NODE_ENV !== "production" ? { debug_mode: 1 } : {};

type AnalyticsSdk = typeof import("firebase/analytics");

type FirebaseAnalyticsClient = {
  analytics: Analytics;
  sdk: AnalyticsSdk;
};

let clientPromise: Promise<FirebaseAnalyticsClient | null> | null = null;
let pageParams: FirebaseEventParams | null = null;
let lastPagePath = "";
/** The Google tag sends the page_view for the page where Analytics starts. */
let startPagePath: string | null = null;

function sanitizedPath(href: string): string | null {
  const location = sanitizeAnalyticsUrl(href);
  return location ? new URL(location).pathname : null;
}

/**
 * When the Google tag starts it sends a page_view built from the raw URL and
 * referrer, ignoring the parameters set here. Analytics therefore starts only
 * on a page whose URL and same-site referrer carry no private data.
 */
function canStartOnThisPage(): boolean {
  const referrer = document.referrer;
  const sameSiteReferrer =
    referrer.startsWith(`${window.location.origin}/`) ||
    referrer === window.location.origin;
  return (
    !hasPrivateUrlData(window.location.href) &&
    !(sameSiteReferrer && hasPrivateUrlData(referrer))
  );
}

/** Resolves null when Analytics is unavailable or has not started yet. */
function loadClient(): Promise<FirebaseAnalyticsClient | null> {
  if (typeof window === "undefined" || !getFirebaseOptions()) {
    return Promise.resolve(null);
  }
  if (!clientPromise) {
    if (!canStartOnThisPage()) {
      return Promise.resolve(null);
    }
    startPagePath = sanitizedPath(window.location.href);
    clientPromise = initializeClient().catch(() => null);
  }
  return clientPromise;
}

async function initializeClient(): Promise<FirebaseAnalyticsClient | null> {
  const [{ getFirebaseApp }, sdk] = await Promise.all([
    import("@/lib/firebase"),
    import("firebase/analytics"),
  ]);
  if (!(await sdk.isSupported())) {
    return null;
  }
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  try {
    sdk.settings({ dataLayerName: DATA_LAYER_NAME, gtagName: GTAG_NAME });
    const analytics = sdk.initializeAnalytics(app, {
      config: { ...pageParams, ...DEBUG_PARAMS },
    });
    return { analytics, sdk };
  } catch {
    // Fast Refresh can re-run this module after Analytics has started.
    return { analytics: sdk.getAnalytics(app), sdk };
  }
}

/**
 * Sends one page_view per page. The page where Analytics starts is counted by
 * the Google tag itself; later route changes are sent here. Query-only changes
 * and repeated effects only refresh the parameters later events carry.
 */
export function trackFirebasePageView(): void {
  if (typeof window === "undefined") {
    return;
  }
  const location = sanitizeAnalyticsUrl(window.location.href);
  const path = sanitizedPath(window.location.href);
  if (!location || !path) {
    return;
  }
  const samePage = lastPagePath !== "" && isSamePageView(lastPagePath, path);
  const referrer = samePage
    ? pageParams?.page_referrer
    : pageParams?.page_location;
  const params: FirebaseEventParams = {
    page_location: location,
    page_referrer:
      referrer ??
      sanitizeAnalyticsReferrer(document.referrer, window.location.origin),
    page_title: document.title,
    page_type: clarityPageType(path),
  };
  pageParams = params;
  lastPagePath = path;

  const client = loadClient();
  const countedByTag = startPagePath === path;
  if (countedByTag) {
    startPagePath = null;
  }
  void client.then((loaded) => {
    if (!loaded) {
      return;
    }
    loaded.sdk.setDefaultEventParameters({ ...params, ...DEBUG_PARAMS });
    if (!samePage && !countedByTag) {
      loaded.sdk.logEvent(loaded.analytics, "page_view", params);
    }
  });
}

export function trackFirebaseEvent(
  name: string,
  params: FirebaseEventParams = {},
): void {
  void loadClient().then((client) => {
    if (client) {
      client.sdk.logEvent(client.analytics, name, params);
    }
  });
}

/** Forwards an event already recorded by `trackAnalyticsEvent`. */
export function forwardToFirebase(event: TrackedAnalyticsEvent): void {
  const mapped = firebaseEventFor(event, new URL(window.location.href));
  if (mapped) {
    trackFirebaseEvent(mapped.name, mapped.params);
  }
}

export function trackFirebaseCtaClick(event: MouseEvent): void {
  const link =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }
  let url: URL;
  try {
    url = new URL(link.href);
  } catch {
    return;
  }
  const ctaName = ctaNameForLink(url, window.location.origin);
  if (!ctaName) {
    return;
  }
  const area = link.closest("header, nav, footer, aside, main");
  trackFirebaseEvent("cta_click", {
    cta_name: ctaName,
    cta_location: area?.tagName.toLowerCase() ?? "page",
  });
}
