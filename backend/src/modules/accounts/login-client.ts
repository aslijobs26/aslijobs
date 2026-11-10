import { createHash } from "node:crypto";

export const LOGIN_DEVICE_TYPES = ["desktop", "mobile", "tablet", "unknown"] as const;

export type LoginDeviceType = (typeof LOGIN_DEVICE_TYPES)[number];

export type LoginClientSummary = {
  browser: string;
  os: string;
  deviceType: LoginDeviceType;
};

const MAX_USER_AGENT_LENGTH = 512;

function detectOs(ua: string): string {
  if (/windows nt/.test(ua)) return "Windows";
  if (/android/.test(ua)) return "Android";
  if (/iphone|ipad|ipod/.test(ua)) return "iOS";
  if (/cros/.test(ua)) return "ChromeOS";
  if (/mac os x|macintosh/.test(ua)) return "macOS";
  if (/linux/.test(ua)) return "Linux";
  return "";
}

function detectBrowser(ua: string): string {
  if (/edg(e|a|ios)?\//.test(ua)) return "Edge";
  if (/opr\/|opera/.test(ua)) return "Opera";
  if (/samsungbrowser/.test(ua)) return "Samsung Internet";
  if (/firefox|fxios/.test(ua)) return "Firefox";
  if (/crios|chrome|chromium/.test(ua)) return "Chrome";
  if (/safari/.test(ua)) return "Safari";
  return "";
}

function detectDeviceType(ua: string): LoginDeviceType {
  if (/ipad|tablet/.test(ua) || (/android/.test(ua) && !/mobile/.test(ua))) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/** Coarse, non-identifying client summary. The raw user agent is not kept. */
export function summarizeUserAgent(
  userAgent: string | null | undefined,
): LoginClientSummary {
  const ua =
    typeof userAgent === "string"
      ? userAgent.slice(0, MAX_USER_AGENT_LENGTH).toLowerCase().trim()
      : "";
  if (!ua) {
    return { browser: "", os: "", deviceType: "unknown" };
  }
  return {
    browser: detectBrowser(ua),
    os: detectOs(ua),
    deviceType: detectDeviceType(ua),
  };
}

/** One key per consumed sign-in challenge; the challenge itself is never stored. */
export function buildLoginDedupeKey(method: string, challengeKey: string): string {
  return createHash("sha256").update(`${method}:${challengeKey}`).digest("hex");
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}
