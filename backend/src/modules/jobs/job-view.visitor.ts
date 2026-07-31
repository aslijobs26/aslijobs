import { randomUUID } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";

export const JOB_VIEW_VISITOR_TYPES = ["guest", "jobSeeker"] as const;

export type JobViewVisitorType = (typeof JOB_VIEW_VISITOR_TYPES)[number];

export type JobViewVisitorIdentity = {
  visitorType: JobViewVisitorType;
  visitorId: string;
  /** True when a new guest cookie must be set on the response. */
  shouldSetGuestCookie: boolean;
};

/** HttpOnly cookie that identifies anonymous job viewers across refreshes. */
export const JOB_VIEW_GUEST_COOKIE_NAME = "aslijobs_job_visitor_id";

const GUEST_VISITOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GUEST_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

function isValidGuestVisitorId(value: unknown): value is string {
  return typeof value === "string" && GUEST_VISITOR_ID_PATTERN.test(value);
}

function buildGuestCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    // Cross-origin SPA → API in production requires SameSite=None + Secure.
    sameSite: isProduction ? "none" : "lax",
    maxAge: GUEST_COOKIE_MAX_AGE_MS,
    path: "/",
  };
}

/**
 * Resolve the viewer for job-view tracking.
 * Authenticated job seekers take precedence over the anonymous guest cookie.
 */
export function resolveJobViewVisitor(
  req: Request,
  jobSeekerId?: string,
): JobViewVisitorIdentity {
  if (jobSeekerId?.trim()) {
    return {
      visitorType: "jobSeeker",
      visitorId: jobSeekerId.trim(),
      shouldSetGuestCookie: false,
    };
  }

  const existingGuestId = req.cookies?.[JOB_VIEW_GUEST_COOKIE_NAME];
  if (isValidGuestVisitorId(existingGuestId)) {
    return {
      visitorType: "guest",
      visitorId: existingGuestId,
      shouldSetGuestCookie: false,
    };
  }

  return {
    visitorType: "guest",
    visitorId: randomUUID(),
    shouldSetGuestCookie: true,
  };
}

export function setJobViewGuestCookie(
  res: Response,
  visitorId: string,
): void {
  if (!isValidGuestVisitorId(visitorId)) {
    return;
  }

  res.cookie(
    JOB_VIEW_GUEST_COOKIE_NAME,
    visitorId,
    buildGuestCookieOptions(),
  );
}
