import type {
  NotificationConversationView,
  NotificationType,
} from "./notification.types.js";

/**
 * Employer workflow steps that only produce job-seeker notifications.
 * The employer-side source of truth is the application's statusHistory.
 */
export const EMPLOYER_STATUS_HISTORY_ACTIONS = {
  application_viewed: "viewed",
  application_under_review: "under_review",
  application_shortlisted: "shortlisted",
} as const satisfies Partial<Record<NotificationType, string>>;

type StatusHistoryActionType = keyof typeof EMPLOYER_STATUS_HISTORY_ACTIONS;

/**
 * Seeker-side event names mapped to the employer mirror the employer inbox
 * actually stores (same pairs collapsed by the conversation timeline).
 */
const EMPLOYER_MIRROR_TYPES: Partial<Record<NotificationType, NotificationType>> =
  {
    application_submitted: "application_received",
    application_withdrawn: "candidate_withdrawn",
  };

/** Interview lifecycle events counted by the Messages "Interviews (7d)" KPI. */
export const INTERVIEW_EVENT_TYPES = [
  "interview_scheduled",
  "interview_updated",
  "interview_completed",
  "interview_cancelled",
] as const satisfies ReadonlyArray<NotificationType>;

/** Application statuses that end a hiring thread. */
export const TERMINAL_APPLICATION_STATUSES = [
  "joined",
  "did_not_join",
  "rejected",
  "withdrawn",
] as const;

function isStatusHistoryAction(value: string): value is StatusHistoryActionType {
  return Object.prototype.hasOwnProperty.call(
    EMPLOYER_STATUS_HISTORY_ACTIONS,
    value,
  );
}

export type ConversationTypeFilterPlan = {
  /** Must all appear among the employer notification types of the thread. */
  notificationTypes: string[];
  /** Must all appear in application.statusHistory.status. */
  statusHistoryStatuses: string[];
};

/**
 * Splits hasType / employerAction / candidateAction into conditions the
 * employer's own data can satisfy.
 */
export function planConversationTypeFilters(
  values: ReadonlyArray<string | undefined>,
): ConversationTypeFilterPlan {
  const notificationTypes = new Set<string>();
  const statusHistoryStatuses = new Set<string>();

  for (const raw of values) {
    const value = raw?.trim();
    if (!value || value === "all") {
      continue;
    }
    if (isStatusHistoryAction(value)) {
      statusHistoryStatuses.add(EMPLOYER_STATUS_HISTORY_ACTIONS[value]);
      continue;
    }
    notificationTypes.add(
      EMPLOYER_MIRROR_TYPES[value as NotificationType] ?? value,
    );
  }

  return {
    notificationTypes: [...notificationTypes],
    statusHistoryStatuses: [...statusHistoryStatuses],
  };
}

/**
 * Thread-level $match clauses applied after the per-employer thread state is
 * joined as `threadState` (missing state = not starred / archived / muted).
 */
export function conversationThreadMatches(input: {
  readStatus?: "all" | "unread" | "read";
  view?: NotificationConversationView;
  excludeMuted?: boolean;
}): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [];

  if (input.readStatus === "unread") {
    clauses.push({ unreadCount: { $gt: 0 } });
  } else if (input.readStatus === "read") {
    clauses.push({ unreadCount: 0 });
  }

  const view = input.view ?? "inbox";
  if (view === "starred") {
    clauses.push({ "threadState.starredAt": { $ne: null } });
  } else if (view === "archived") {
    clauses.push({ "threadState.archivedAt": { $ne: null } });
  } else {
    clauses.push({ "threadState.archivedAt": null });
  }

  if (input.excludeMuted) {
    clauses.push({ "threadState.mutedAt": null });
  }

  return clauses;
}

/** Bulk inputs: trimmed, de-duplicated, order preserved. */
export function dedupeConversationIds(ids: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of ids) {
    const id = raw.trim().toLowerCase();
    if (id && !seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  return unique;
}

export type ConversationTimelinePage<T> = {
  items: T[];
  hasOlder: boolean;
  /** Pass as `before` to load the next older page. */
  olderCursor: string | null;
};

/**
 * Newest-first paging over a chronological (oldest → newest) timeline.
 * Each page is returned oldest → newest so it can be prepended as-is.
 * `before` (an item id) takes precedence over `page`; an unknown cursor
 * yields an empty page instead of repeating newer items.
 */
export function sliceConversationTimelinePage<T extends { id: string }>(
  chronological: ReadonlyArray<T>,
  input: { limit: number; before?: string | null; page?: number },
): ConversationTimelinePage<T> {
  const limit = Math.max(1, Math.floor(input.limit));
  let end = chronological.length;

  const before = input.before?.trim();
  if (before) {
    const cursorIndex = chronological.findIndex((item) => item.id === before);
    if (cursorIndex < 0) {
      return { items: [], hasOlder: false, olderCursor: null };
    }
    end = cursorIndex;
  } else if (input.page && input.page > 1) {
    end = Math.max(0, chronological.length - (input.page - 1) * limit);
  }

  const start = Math.max(0, end - limit);
  const items = chronological.slice(start, end);
  const hasOlder = start > 0;

  return {
    items,
    hasOlder,
    olderCursor: hasOlder && items[0] ? items[0].id : null,
  };
}
