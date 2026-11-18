import * as cheerio from "cheerio";
import { WORDS_PER_MINUTE } from "./blog.constants.js";

const ALLOWED_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption",
  "iframe",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "hr",
  "pre",
  "code",
  "div",
]);

const YOUTUBE_ID = /^[\w-]{6,}$/;

export function slugifyBlogText(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "article";
}

function safeHref(value: string | undefined): string | null {
  const href = (value ?? "").trim();
  if (!href || href.length > 2000) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^mailto:[^\s]+$/i.test(href)) return href;
  try {
    const url = new URL(href);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function safeImageSrc(value: string | undefined): string | null {
  const src = (value ?? "").trim();
  if (!src || src.length > 2000 || src.startsWith("data:")) return null;
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  try {
    const url = new URL(src);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function youtubeIdFromUrl(value: string | undefined): string {
  const src = (value ?? "").trim();
  if (!src) return "";
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return "";
  }
  const host = url.hostname.replace(/^(?:www|m|music)\./, "");
  let id = "";
  if (host === "youtu.be") {
    id = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
      id = parts[1] ?? "";
    } else {
      id = url.searchParams.get("v") ?? "";
    }
  } else {
    return "";
  }
  id = id.split(/[?&#]/)[0];
  return YOUTUBE_ID.test(id) ? id : "";
}

function safeYoutubeSrc(value: string | undefined): string | null {
  const id = youtubeIdFromUrl(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

/** First YouTube video embedded in article HTML, in document order. */
export function firstYoutubeVideoId(html: string): string {
  if (!html) return "";
  const $ = cheerio.load(html);
  let found = "";
  $("iframe").each((_, element) => {
    if (found) return;
    found = youtubeIdFromUrl($(element).attr("src"));
  });
  return found;
}

function headingId(text: string, used: Set<string>): string {
  const base = slugifyBlogText(text) || "section";
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

/**
 * Rebuilds article HTML from an allowlist. Scripts, event handlers, and
 * non-YouTube iframes are dropped. Headings receive stable ids for the TOC.
 */
export function sanitizeBlogHtml(input: string): string {
  const source = typeof input === "string" ? input : "";
  const $ = cheerio.load(`<div id="blog-root">${source}</div>`, {}, false);
  const usedIds = new Set<string>();

  // Cheerio's node union is wider than the elements this walker edits.
  function walk(node: any): void {
    const children = $(node).children().toArray();
    for (const child of children) {
      walk(child);
    }

    const tag = node.tagName?.toLowerCase();
    if (!tag || tag === "div" && $(node).attr("id") === "blog-root") {
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      if (["script", "style", "noscript", "object", "embed", "form", "svg", "math", "template"].includes(tag)) {
        $(node).remove();
        return;
      }
      $(node).replaceWith($(node).contents());
      return;
    }

    const attribs = { ...(node.attribs ?? {}) };
    for (const name of Object.keys(attribs)) {
      $(node).removeAttr(name);
    }

    if (tag === "a") {
      const href = safeHref(attribs.href);
      if (!href) {
        $(node).replaceWith($(node).contents());
        return;
      }
      $(node).attr("href", href);
      $(node).attr("rel", "noopener noreferrer");
      if (/^https?:/i.test(href)) {
        $(node).attr("target", "_blank");
      }
      return;
    }

    if (tag === "img") {
      const src = safeImageSrc(attribs.src);
      if (!src) {
        $(node).remove();
        return;
      }
      $(node).attr("src", src);
      $(node).attr("alt", (attribs.alt ?? "").replace(/\s+/g, " ").trim().slice(0, 180));
      return;
    }

    if (tag === "iframe") {
      const src = safeYoutubeSrc(attribs.src);
      if (!src) {
        $(node).remove();
        return;
      }
      $(node).attr("src", src);
      $(node).attr("title", "YouTube video");
      $(node).attr("loading", "lazy");
      $(node).attr("allowfullscreen", "true");
      $(node).attr(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      );
      return;
    }

    if (tag === "div") {
      const className = attribs.class ?? "";
      if (/\bblog-cta\b/.test(className)) {
        $(node).attr("class", "blog-cta");
      } else if (/\bblog-callout\b/.test(className)) {
        $(node).attr("class", "blog-callout");
      } else {
        $(node).replaceWith($(node).contents());
      }
      return;
    }

    if (tag === "h2" || tag === "h3") {
      const text = $(node).text().replace(/\s+/g, " ").trim();
      $(node).attr("id", headingId(text || tag, usedIds));
      return;
    }

    if (tag === "td" || tag === "th") {
      const colspan = Number(attribs.colspan);
      const rowspan = Number(attribs.rowspan);
      if (Number.isInteger(colspan) && colspan > 1 && colspan <= 8) {
        $(node).attr("colspan", String(colspan));
      }
      if (Number.isInteger(rowspan) && rowspan > 1 && rowspan <= 12) {
        $(node).attr("rowspan", String(rowspan));
      }
    }
  }

  const root = $("div#blog-root").get(0);
  if (root) walk(root);
  return $("div#blog-root").html()?.trim() ?? "";
}

export function estimateReadingMinutes(html: string): number {
  const text = sanitizeBlogHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 1;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export type BlogHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export function extractBlogHeadings(html: string): BlogHeading[] {
  const $ = cheerio.load(`<div id="blog-root">${html}</div>`, {}, false);
  const headings: BlogHeading[] = [];
  $("h2, h3").each((_, el) => {
    const id = $(el).attr("id")?.trim();
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (!id || !text) return;
    headings.push({
      id,
      text,
      level: el.tagName.toLowerCase() === "h2" ? 2 : 3,
    });
  });
  return headings;
}
