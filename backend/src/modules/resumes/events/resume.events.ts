import { RESUME_EVENT_NAMES } from "../resume.constants.js";

export type ResumeEventName =
  (typeof RESUME_EVENT_NAMES)[keyof typeof RESUME_EVENT_NAMES];

export type ResumeJobSeekerEventPayload = {
  jobSeekerId: string;
};

export type ResumeRegistrationCompletedPayload = ResumeJobSeekerEventPayload;

export type ResumeProfileUpdatedPayload = ResumeJobSeekerEventPayload & {
  reason?: string;
};

export type ResumeExperienceUpdatedPayload = ResumeJobSeekerEventPayload;

export type ResumeEducationUpdatedPayload = ResumeJobSeekerEventPayload;

export type ResumeRegenerationRequestedPayload = ResumeJobSeekerEventPayload & {
  reason?: string;
};

export type ResumeGenerationFailedPayload = ResumeJobSeekerEventPayload & {
  reason: string;
  resumeId?: string;
};

/**
 * Future domain-event contracts for the ATS Resume system.
 * Phase 1: constants + payload types only — no emitter is wired.
 */
export const RESUME_EVENTS = {
  names: RESUME_EVENT_NAMES,
} as const;
