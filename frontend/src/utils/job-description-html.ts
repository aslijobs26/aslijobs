import DOMPurify from "dompurify";
import { sanitizeJobDescriptionHtmlAllowlist } from "./job-description-html-allowlist";
import {
  isJobDescriptionEmpty,
  JOB_DESCRIPTION_ALLOWED_ATTRIBUTES,
  JOB_DESCRIPTION_ALLOWED_TAGS,
} from "./job-description-text";

export {
  getJobDescriptionPlainText,
  getJobDescriptionPlainTextLength,
  isJobDescriptionEmpty,
  looksLikeJobDescriptionHtml,
} from "./job-description-text";

/** Persist empty editor state as "" so existing required checks keep working. */
export function normalizeJobDescriptionHtml(html: string): string {
  if (isJobDescriptionEmpty(html)) {
    return "";
  }
  return sanitizeJobDescriptionHtml(html);
}

/**
 * DOMPurify in the browser. Server rendering has no DOM, and jsdom (what
 * `isomorphic-dompurify` would load) cannot run in the Vercel server runtime,
 * so the server uses the equivalent DOM-free allowlist sanitizer.
 */
export function sanitizeJobDescriptionHtml(html: string): string {
  if (!html.trim()) {
    return "";
  }
  if (!DOMPurify.isSupported) {
    return sanitizeJobDescriptionHtmlAllowlist(html);
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: JOB_DESCRIPTION_ALLOWED_TAGS,
    ALLOWED_ATTR: JOB_DESCRIPTION_ALLOWED_ATTRIBUTES,
    ALLOW_DATA_ATTR: false,
  }).trim();
}
