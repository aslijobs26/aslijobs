const STORAGE_KEY = "aslijobs.job-seeker.nav.saved-seen-ids";
export const SAVED_NAV_SEEN_CHANGE_EVENT = "aslijobs:saved-nav-seen";

function readSeenIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function hasSavedNavSeenState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) != null;
}

export function getSeenSavedJobIds(): string[] {
  return readSeenIds();
}

export function markSavedJobsAsSeen(ids: readonly string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueIds = [...new Set(ids.filter(Boolean))];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds));
  window.dispatchEvent(new CustomEvent(SAVED_NAV_SEEN_CHANGE_EVENT));
}

/** First load: treat existing saved jobs as already seen so the badge only tracks new saves. */
export function ensureSavedNavSeenInitialized(ids: readonly string[]): void {
  if (typeof window === "undefined" || hasSavedNavSeenState()) {
    return;
  }
  markSavedJobsAsSeen(ids);
}

export function getUnseenSavedJobCount(currentIds: readonly string[]): number {
  const seen = new Set(readSeenIds());
  return currentIds.filter((id) => Boolean(id) && !seen.has(id)).length;
}
