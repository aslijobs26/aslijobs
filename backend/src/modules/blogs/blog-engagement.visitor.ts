import { randomUUID } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";

export const BLOG_ENGAGEMENT_COOKIE_NAME = "aslijobs_blog_visitor_id";

const BLOG_VISITOR_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export function resolveBlogEngagementVisitor(req: Request): {
  visitorId: string;
  shouldSetCookie: boolean;
} {
  const existingId = req.cookies?.[BLOG_ENGAGEMENT_COOKIE_NAME];
  if (typeof existingId === "string" && BLOG_VISITOR_ID_PATTERN.test(existingId)) {
    return { visitorId: existingId, shouldSetCookie: false };
  }
  return { visitorId: randomUUID(), shouldSetCookie: true };
}

export function setBlogEngagementVisitorCookie(
  res: Response,
  visitorId: string,
): void {
  if (!BLOG_VISITOR_ID_PATTERN.test(visitorId)) return;

  const options: CookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
  res.cookie(BLOG_ENGAGEMENT_COOKIE_NAME, visitorId, options);
}
