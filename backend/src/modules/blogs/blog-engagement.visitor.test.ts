import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "express";
import {
  BLOG_ENGAGEMENT_COOKIE_NAME,
  resolveBlogEngagementVisitor,
} from "./blog-engagement.visitor.js";

test("reuses a valid anonymous visitor cookie", () => {
  const visitorId = "a0b1c2d3-e4f5-4678-9abc-def012345678";
  const req = {
    cookies: { [BLOG_ENGAGEMENT_COOKIE_NAME]: visitorId },
  } as unknown as Request;

  assert.deepEqual(resolveBlogEngagementVisitor(req), {
    visitorId,
    shouldSetCookie: false,
  });
});

test("replaces malformed visitor cookies with a new UUID", () => {
  const req = {
    cookies: { [BLOG_ENGAGEMENT_COOKIE_NAME]: "invalid" },
  } as unknown as Request;

  const visitor = resolveBlogEngagementVisitor(req);
  assert.equal(visitor.shouldSetCookie, true);
  assert.match(
    visitor.visitorId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});
