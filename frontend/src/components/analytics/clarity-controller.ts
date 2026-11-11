import { getActiveAuthRealm } from "@/utils/auth-realm";
import { EMPLOYER_AUTH_CHANGE_EVENT } from "@/utils/employer-auth-storage";
import { JOB_SEEKER_AUTH_CHANGE_EVENT } from "@/utils/job-seeker-auth-storage";
import {
  clarityTagsFor,
  isClarityEntryUrl,
  isClarityRecordableUrl,
  isClaritySafeReferrer,
  type ClarityUserRole,
} from "./clarity-routes";

type ClarityCall = ArrayLike<unknown>;

type ClarityFunction = ((...args: unknown[]) => void) & {
  q?: ClarityCall[];
  v?: string;
  t?: boolean;
};

declare global {
  interface Window {
    clarity?: ClarityFunction;
  }
}

const CLARITY_TAG_URL = "https://www.clarity.ms/tag/";
const PROJECT_ID = /^[a-z0-9]{6,20}$/i;

type TagState = "waiting" | "loading" | "ready" | "inactive";

let installed = false;
let projectId = "";
let tagState: TagState = "waiting";
/** The tag's own start call, held back while the current URL is excluded. */
let heldStart: unknown[] | null = null;
/** Clarity was stopped here and must be started again on a recordable URL. */
let halted = false;

/**
 * Loads the official Clarity tag once and keeps excluded URLs out of it.
 * Clarity's own SPA tracking still records every recordable route change.
 * Nothing loads when the browser sends Global Privacy Control or Do Not Track,
 * or when the page was opened from an excluded page.
 */
export function startMicrosoftClarity(rawProjectId: string | undefined): void {
  if (installed || typeof window === "undefined") {
    return;
  }
  const id = rawProjectId?.trim() ?? "";
  if (
    !PROJECT_ID.test(id) ||
    hasPrivacyOptOut() ||
    hasClarityTag() ||
    !isClaritySafeReferrer(document.referrer, window.location.origin)
  ) {
    return;
  }
  installed = true;
  projectId = id;

  guardHistory();
  // Capture listeners run before Clarity's own, so it never sees these events.
  window.addEventListener("popstate", syncWithLocation, true);
  window.addEventListener("click", haltBeforePrivateLink, true);
  window.addEventListener("contextmenu", haltBeforePrivateLink, true);
  window.addEventListener(EMPLOYER_AUTH_CHANGE_EVENT, updateUserRole);
  window.addEventListener(JOB_SEEKER_AUTH_CHANGE_EVENT, updateUserRole);
  syncWithLocation();
}

function hasPrivacyOptOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

function hasClarityTag(): boolean {
  return (
    Boolean(window.clarity) ||
    document.querySelector('script[src*="clarity.ms/tag/"]') !== null
  );
}

function toUrl(value: string | URL): URL | null {
  try {
    return new URL(value, window.location.href);
  } catch {
    return null;
  }
}

function syncWithLocation(): void {
  const url = new URL(window.location.href);
  if (tagState === "waiting") {
    if (isClarityEntryUrl(url)) {
      loadTag();
    }
    return;
  }
  if (isClarityRecordableUrl(url)) {
    resumeRecording();
  } else {
    haltRecording();
  }
}

function loadTag(): void {
  tagState = "loading";
  if (!window.clarity) {
    const queue: ClarityFunction = (...args: unknown[]) => {
      (queue.q ??= []).push(args);
    };
    window.clarity = queue;
  }
  window.clarity("metadata", applyTags, false, true);

  const script = document.createElement("script");
  script.async = true;
  script.src = `${CLARITY_TAG_URL}${encodeURIComponent(projectId)}`;
  script.onload = onTagLoaded;
  script.onerror = () => {
    tagState = "inactive";
  };
  document.head.appendChild(script);
}

/**
 * The tag queues its start call and only then fetches clarity.js, so the
 * call can be held here before Clarity runs.
 */
function onTagLoaded(): void {
  const clarity = window.clarity;
  heldStart = clarity ? takeQueuedStart(clarity) : null;
  tagState = heldStart ? "ready" : "inactive";
  syncWithLocation();
}

function takeQueuedStart(clarity: ClarityFunction): unknown[] | null {
  const queue = clarity.q ?? [];
  const index = queue.findIndex((call) => call[0] === "start");
  if (index < 0) {
    return null;
  }
  const [call] = queue.splice(index, 1);
  return Array.from(call);
}

function haltRecording(): void {
  const clarity = window.clarity;
  if (tagState !== "ready" || !clarity || heldStart || halted) {
    return;
  }
  const queuedStart = clarity.v ? null : takeQueuedStart(clarity);
  if (queuedStart) {
    heldStart = queuedStart;
    return;
  }
  // A running Clarity stops now. One that is between pages or idle queues the
  // call and stops as soon as it restarts, before it reads the page.
  clarity("stop");
  halted = true;
}

function resumeRecording(): void {
  const clarity = window.clarity;
  if (tagState !== "ready" || !clarity) {
    return;
  }
  if (heldStart) {
    const start = heldStart;
    heldStart = null;
    clarity(...start);
    if (!clarity.v && clarity.q) {
      // Before clarity.js runs, start must stay ahead of queued calls.
      clarity.q.unshift(clarity.q.pop()!);
    }
    return;
  }
  if (!halted) {
    return;
  }
  halted = false;
  if (clarity.q) {
    clarity.q = clarity.q.filter((call) => call[0] !== "stop");
  }
  clarity("start", {});
}

function guardHistory(): void {
  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method];
    window.history[method] = function (
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null,
    ) {
      const target = url == null ? null : toUrl(url);
      if (target && !isClarityRecordableUrl(target)) {
        haltRecording();
      }
      original.call(this, data, unused, url);
      syncWithLocation();
    };
  }
}

/** Clarity sends a clicked link's URL unmasked, so stop before it sees one. */
function haltBeforePrivateLink(event: MouseEvent): void {
  const link =
    event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!(link instanceof HTMLAnchorElement)) {
    return;
  }
  const url = toUrl(link.href);
  if (
    url &&
    url.origin === window.location.origin &&
    !isClarityRecordableUrl(url)
  ) {
    haltRecording();
  }
}

function currentUserRole(): ClarityUserRole {
  const realm = getActiveAuthRealm();
  if (realm === "employer") {
    return "employer";
  }
  return realm === "job-seeker" ? "job_seeker" : "guest";
}

/** Clarity calls this once for every recorded page, including SPA routes. */
function applyTags(): void {
  const clarity = window.clarity;
  if (!clarity) {
    return;
  }
  const tags = clarityTagsFor(window.location.pathname, currentUserRole());
  for (const [key, value] of Object.entries(tags)) {
    clarity("set", key, value);
  }
}

function updateUserRole(): void {
  if (window.clarity?.v && !halted && !heldStart) {
    window.clarity("set", "user_role", currentUserRole());
  }
}
