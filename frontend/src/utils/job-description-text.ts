/**
 * DOM-free job description helpers. Server components import these; anything
 * that needs DOMPurify (and therefore jsdom) stays in `job-description-html`.
 */

const EMPTY_HTML_PATTERN = /^(?:<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+$/i;

/** Markup the job description editor produces and the job page renders. */
export const JOB_DESCRIPTION_ALLOWED_TAGS = [
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
];

export const JOB_DESCRIPTION_ALLOWED_ATTRIBUTES = [
  "href",
  "target",
  "rel",
  "class",
];

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

export function looksLikeJobDescriptionHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}
