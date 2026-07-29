/**
 * Employer hiring pipeline: forward-only transitions.
 * Terminal statuses lock further employer changes.
 * Earlier stages may enter Interview Scheduled only through the interview API.
 */

import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { APPLICATION_STATUSES } from "./application.constants.js";
import type {
  ApplicationInterview,
  ApplicationOffer,
  ApplicationStatus,
} from "./application.types.js";

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

/**
 * Allowed next statuses per current status.
 * Rejected / Withdrawn remain available until a terminal status is reached.
 * `interview_scheduled` appears for UI routing to the schedule form; direct status PATCH is blocked.
 */
const EMPLOYER_ALLOWED_TRANSITIONS: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  submitted: [
    "viewed",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  viewed: [
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  under_review: [
    "shortlisted",
    "interview_scheduled",
    "rejected",
    "withdrawn",
  ],
  shortlisted: ["interview_scheduled", "rejected", "withdrawn"],
  interview_scheduled: ["interview_completed", "rejected", "withdrawn"],
  interview_completed: ["offer_sent", "rejected", "withdrawn"],
  offer_sent: ["selected", "joined", "rejected", "withdrawn"],
  selected: ["joined", "rejected", "withdrawn"],
  joined: [],
  rejected: [],
  withdrawn: [],
};

const FORWARD_INDEX = new Map<string, number>(
  EMPLOYER_FORWARD_PIPELINE.map((status, index) => [status, index]),
);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isEmployerTerminalStatus(
  status: string,
): status is EmployerTerminalStatus {
  return (EMPLOYER_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** True when status is earlier in the pipeline than interview_scheduled. */
export function isStatusBeforeInterviewScheduled(
  status: ApplicationStatus | string,
): boolean {
  const currentIndex = FORWARD_INDEX.get(status);
  const interviewIndex = FORWARD_INDEX.get("interview_scheduled");
  if (currentIndex === undefined || interviewIndex === undefined) {
    return false;
  }
  return currentIndex < interviewIndex;
}

export function hasRequiredInterviewDetails(
  interview: ApplicationInterview | null | undefined,
): boolean {
  if (!interview) {
    return false;
  }
  return Boolean(
    text(interview.date) &&
      text(interview.time) &&
      text(interview.mode) &&
      text(interview.interviewerName),
  );
}

export function hasRequiredOfferDetails(
  offer: ApplicationOffer | null | undefined,
): boolean {
  if (!offer) {
    return false;
  }
  return Boolean(
    text(offer.offerDate) &&
      text(offer.joiningDate) &&
      text(offer.packageText),
  );
}

export function getAllowedEmployerStatusTransitions(
  current: ApplicationStatus,
): ApplicationStatus[] {
  if (isEmployerTerminalStatus(current)) {
    return [];
  }
  return [...(EMPLOYER_ALLOWED_TRANSITIONS[current] ?? [])];
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

export type EmployerStatusTransitionContext = {
  interview?: ApplicationInterview | null;
  offer?: ApplicationOffer | null;
};

/**
 * Validates pipeline membership only.
 * Use assertEmployerStatusChangeAllowed for direct status updates with prerequisite checks.
 */
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
      "Invalid status transition. Complete the previous hiring stage before moving forward.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

/**
 * Final authority for employer status PATCH / hiring status changes.
 * Blocks Interview Scheduled (must use interview API) and enforces interview/offer prerequisites.
 */
export function assertEmployerStatusChangeAllowed(
  from: ApplicationStatus,
  to: ApplicationStatus,
  context: EmployerStatusTransitionContext = {},
): void {
  if (to === "interview_scheduled") {
    throw new AppError(
      "Schedule an interview to set status to Interview Scheduled. Direct status update is not allowed.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  assertValidEmployerStatusTransition(from, to);

  if (to === "interview_completed") {
    if (from !== "interview_scheduled") {
      throw new AppError(
        "Schedule and complete an interview before marking it as completed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (
      !hasRequiredInterviewDetails(context.interview) ||
      Boolean(context.interview?.cancelledAt)
    ) {
      throw new AppError(
        "Schedule and complete an interview before marking it as completed.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  if (to === "offer_sent") {
    if (from !== "interview_completed") {
      throw new AppError(
        "Complete the interview before sending an offer.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    if (!hasRequiredOfferDetails(context.offer)) {
      throw new AppError(
        "Complete offer details (offer date, joining date, and package) before sending an offer.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  if (to === "joined") {
    if (from !== "offer_sent" && from !== "selected") {
      throw new AppError(
        "Send an offer before marking the candidate as joined.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }
}
