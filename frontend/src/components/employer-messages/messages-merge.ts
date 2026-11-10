type WithApplicationId = { applicationId: string };
type TimelineEntry = { id: string; createdAt: string };

/**
 * Loaded conversation pages → one list. A thread that shifted between pages
 * while loading appears once, at its newest (earliest page) position.
 */
export function flattenConversationPages<T extends WithApplicationId>(
  pages: ReadonlyArray<{ conversations: ReadonlyArray<T> }>,
): T[] {
  const seen = new Set<string>();
  const flattened: T[] = [];
  for (const page of pages) {
    for (const item of page.conversations) {
      if (!seen.has(item.applicationId)) {
        seen.add(item.applicationId);
        flattened.push(item);
      }
    }
  }
  return flattened;
}

/** Applies `patch` to matching threads across cached conversation pages. */
export function patchConversationPages<
  T extends WithApplicationId,
  D extends { pages: ReadonlyArray<{ conversations: ReadonlyArray<T> }> },
>(
  data: D | undefined,
  applicationIds: ReadonlySet<string>,
  patch: (item: T) => T,
): D | undefined {
  if (!data) {
    return data;
  }
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      conversations: page.conversations.map((item) =>
        applicationIds.has(item.applicationId) ? patch(item) : item,
      ),
    })),
  } as D;
}

/** Bulk read / unread request cap (matches the backend batch limit). */
export const MESSAGES_BULK_SELECTION_LIMIT = 100;

/** Toggles one thread in a bulk selection; refuses to grow past the cap. */
export function toggleBulkSelection(
  current: ReadonlySet<string>,
  applicationId: string,
  limit: number = MESSAGES_BULK_SELECTION_LIMIT,
): { next: Set<string>; limitReached: boolean } {
  const next = new Set(current);
  if (next.has(applicationId)) {
    next.delete(applicationId);
    return { next, limitReached: false };
  }
  if (next.size >= limit) {
    return { next, limitReached: true };
  }
  next.add(applicationId);
  return { next, limitReached: false };
}

/** Flattens newest-first timeline pages into one deduplicated oldest → newest list. */
export function flattenTimelinePages<T extends TimelineEntry>(
  pages: ReadonlyArray<{ notifications: ReadonlyArray<T> }>,
): T[] {
  const byId = new Map<string, T>();
  for (const page of pages) {
    for (const item of page.notifications) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  }
  return [...byId.values()].sort((left, right) => {
    const delta =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return delta !== 0 ? delta : left.id.localeCompare(right.id);
  });
}

/** Signature of the newest Messages activity; changes when any thread gets a new notification. */
export function buildMessagesActivitySignature(
  result:
    | {
        conversations: ReadonlyArray<{ latestNotification: { id: string } }>;
        pagination: { total: number };
      }
    | undefined,
): string | null {
  if (!result) {
    return null;
  }
  const latestId = result.conversations[0]?.latestNotification.id ?? "none";
  return `${latestId}:${result.pagination.total}`;
}

/** Only in-app employer routes are followed from notification action paths. */
export function safeEmployerActionPath(path: string | null | undefined): string | null {
  const value = path?.trim() ?? "";
  if (!value.startsWith("/employer/") || value.startsWith("//")) {
    return null;
  }
  return value;
}
