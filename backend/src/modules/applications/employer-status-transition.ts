/**
 * Employer hiring pipeline: forward-only status transitions.
 * Terminal statuses lock further employer changes.
 */

import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { APPLICATION_STATUSES } from "./application.constants.js";
import type { ApplicationStatus } from "./application.types.js";

/** Ordered hiring stages (excludes terminal side-exits rejected/withdrawn). */
export const EMPLOYER_FORWARD_PIPELINE = [
  "submitted",
  "viewed",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "offer_sent",
  "selected",
  "joined",
] as const satisfies readonly ApplicationStatus[];

export const EMPLOYER_TERMINAL_STATUSES = [
  "joined",
  "rejected",
  "withdrawn",
] as const satisfies readonly ApplicationStatus[];

export type EmployerTerminalStatus =
  (typeof EMPLOYER_TERMINAL_STATUSES)[number];

const FORWARD_INDEX = new Map<string, number>(
  EMPLOYER_FORWARD_PIPELINE.map((status, index) => [status, index]),
);

export function isEmployerTerminalStatus(
  status: string,
): status is EmployerTerminalStatus {
  return (EMPLOYER_TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function getAllowedEmployerStatusTransitions(
  current: ApplicationStatus,
): ApplicationStatus[] {
  if (isEmployerTerminalStatus(current)) {
    return [];
  }

  const currentIndex = FORWARD_INDEX.get(current);
  if (currentIndex === undefined) {
    return [];
  }

  const forward = EMPLOYER_FORWARD_PIPELINE.slice(currentIndex + 1);
  return [...forward, "rejected", "withdrawn"];
}

export function isValidEmployerStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): boolean {
  if (from === to) {
    return true;
  }
  if (!(APPLICATION_STATUSES as readonly string[]).includes(to)) {
    return false;
  }
  return getAllowedEmployerStatusTransitions(from).includes(to);
}

export function assertValidEmployerStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (from === to) {
    return;
  }

  if (isEmployerTerminalStatus(from)) {
    throw new AppError(
      "This application has reached a final status and cannot be updated.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (!isValidEmployerStatusTransition(from, to)) {
    throw new AppError(
      "Invalid status transition. Hiring status can only move forward in the pipeline.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}
