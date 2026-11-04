/**
 * HTML → knowledge extraction via Cheerio (not regex-only parsing).
 * Website HTML is treated as untrusted data.
 */
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

const MAX_TEXT_CHARS = 40_000;
const MAX_SECTION_CHARS = 4_000;
const MAX_FAQ_ANSWER = 2_000;

export type ExtractedPage = {
  title: string;
  description: string;
  canonicalUrl: string;
  language: string;
  sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  plainText: string;
  links: string[];
};

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "nav",
  "footer",
  "[data-site-footer]",
  "header",
  ".cookie",
  "#cookie",
  "[class*='cookie']",
  "[id*='cookie']",
].join(", ");

export function extractKnowledgeFromHtml(
  html: string,
  options?: { pageUrl?: string },
): ExtractedPage {
  const $ = cheerio.load(html);
  const title = collapseWhitespace($("title").first().text() || $("h1").first().text()).slice(0, 200);
  const description = collapseWhitespace(
    $('meta[name="description"]').attr("content")
      || $('meta[property="og:description"]').attr("content")
      || "",
  ).slice(0, 500);
  const canonicalUrl = (
    $('link[rel="canonical"]').attr("href")
    || options?.pageUrl
    || ""
  ).trim();
  const language = ($("html").attr("lang") || "en").trim().slice(0, 16);

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") || "").trim();
    if (href.startsWith("/") || href.startsWith("http")) {
      links.push(href.slice(0, 500));
    }
  });

  const faqs: Array<{ question: string; answer: string }> = [];
  $("details").each((_, el) => {
    const question = collapseWhitespace($(el).find("summary").first().text());
    const clone = $(el).clone();
    clone.find("summary").remove();
    const answer = collapseWhitespace(clone.text());
    if (question.length >= 8 && answer.length >= 12) {
      faqs.push({
        question: question.slice(0, 300),
        answer: answer.slice(0, MAX_FAQ_ANSWER),
      });
    }
  });

  $(NOISE_SELECTORS).remove();

  const main = $("main, article, [role='main'], .prose, #content").first();
  const root = main.length > 0 ? main : $("body");

  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = title || "Page";
  let buffer: string[] = [];

  const flush = () => {
    const content = collapseWhitespace(buffer.join(" ")).slice(0, MAX_SECTION_CHARS);
    if (content.length >= 40) {
      sections.push({ heading: currentHeading.slice(0, 200), content });
    }
    buffer = [];
  };

  const walk = (nodes: AnyNode[]) => {
    for (const node of nodes) {
      if (node.type === "tag") {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();
        if (tag === "h1" || tag === "h2" || tag === "h3") {
          flush();
          currentHeading = collapseWhitespace($(el).text()) || currentHeading;
          continue;
        }
        if (tag === "p" || tag === "li" || tag === "td" || tag === "th" || tag === "blockquote") {
          const text = collapseWhitespace($(el).text());
          if (text) buffer.push(text);
          continue;
        }
        if (el.children?.length) walk(el.children);
      }
    }
  };

  walk(root.toArray());
  flush();

  const plainText = collapseWhitespace(root.text()).slice(0, MAX_TEXT_CHARS);
  if (sections.length === 0 && plainText.length >= 80) {
    sections.push({ heading: title || "Page", content: plainText.slice(0, MAX_SECTION_CHARS) });
  }

  return {
    title: title || "AsliJobs",
    description,
    canonicalUrl,
    language,
    sections,
    faqs,
    plainText,
    links: [...new Set(links)].slice(0, 80),
  };
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
