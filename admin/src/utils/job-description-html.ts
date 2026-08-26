import DOMPurify from "isomorphic-dompurify";

const EMPTY_HTML_PATTERN = /^(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+$/i;

/** Strip tags for counters, validation, and plain-text channels. */
export function getJobDescriptionPlainText(htmlOrText: string): string {
  if (!htmlOrText.trim()) {
    return "";
  }

  return htmlOrText
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function getJobDescriptionPlainTextLength(htmlOrText: string): number {
  return getJobDescriptionPlainText(htmlOrText).length;
}

export function isJobDescriptionEmpty(htmlOrText: string): boolean {
  const trimmed = htmlOrText.trim();
  if (!trimmed) {
    return true;
  }
  if (EMPTY_HTML_PATTERN.test(trimmed)) {
    return true;
  }
  return getJobDescriptionPlainText(trimmed).length === 0;
}

/** Persist empty editor state as "" so existing required checks keep working. */
export function normalizeJobDescriptionHtml(html: string): string {
  if (isJobDescriptionEmpty(html)) {
    return "";
  }
  return sanitizeJobDescriptionHtml(html);
}

export function sanitizeJobDescriptionHtml(html: string): string {
  if (!html.trim()) {
    return "";
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  }).trim();
}

export function looksLikeJobDescriptionHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}
