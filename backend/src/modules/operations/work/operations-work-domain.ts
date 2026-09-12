import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import {
  startOfKolkataDay,
  startOfNextKolkataDay,
  toKolkataIsoDate,
} from "../registration-awareness/operations-registration-time.js";
import type { WorkItemStatus } from "./operations-work.constants.js";

/**
 * Controlled Work Item status transitions.
 * Server rejects any transition not listed here.
 */
const ALLOWED_TRANSITIONS: Record<WorkItemStatus, readonly WorkItemStatus[]> = {
  queued: ["assigned", "cancelled"],
  assigned: ["in_progress", "queued", "assigned", "cancelled"],
  in_progress: ["waiting", "completed", "assigned", "cancelled"],
  waiting: ["in_progress", "assigned", "cancelled"],
  completed: [],
  cancelled: [],
};

export function assertWorkStatusTransition(
  from: WorkItemStatus,
  to: WorkItemStatus,
): void {
  if (from === to) {
    return;
  }
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(
      `Invalid work status transition: ${from} → ${to}.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

export function isTerminalWorkStatus(status: WorkItemStatus): boolean {
  return status === "completed" || status === "cancelled";
}

export function formatWorkDisplayId(objectIdHex: string): string {
  const year = new Date().getFullYear();
  const suffix = objectIdHex.replace(/[^a-fA-F0-9]/g, "").slice(-6).toUpperCase();
  return `WI-${year}-${suffix || "000000"}`;
}

/**
 * Business-day helpers use Asia/Kolkata (Operations business timezone),
 * not the Node process local timezone.
 */
export function startOfLocalDay(date: Date): Date {
  return startOfKolkataDay(date);
}

export function endOfLocalDay(date: Date): Date {
  return new Date(startOfNextKolkataDay(date).getTime() - 1);
}

export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

export function kolkataDateKey(date: Date): string {
  return toKolkataIsoDate(date);
}

/** Do Now = P1 OR overdue among open actionable statuses. */
export function buildDoNowFilter(now: Date): Record<string, unknown> {
  return {
    status: { $in: ["assigned", "in_progress", "queued"] },
    $or: [{ priority: "P1" }, { dueAt: { $lt: now } }],
  };
}
