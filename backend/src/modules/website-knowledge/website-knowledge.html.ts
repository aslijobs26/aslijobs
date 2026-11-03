/** Lightweight HTML → text extraction (no external HTML parser dependency). */

const MAX_TEXT_CHARS = 40_000;

export type ExtractedPage = {
  title: string;
  sections: Array<{ heading: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  plainText: string;
};

export function extractKnowledgeFromHtml(html: string): ExtractedPage {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const titleMatch = withoutNoise.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeHtml(stripTags(titleMatch?.[1] ?? "")).trim().slice(0, 200);

  const sections: Array<{ heading: string; content: string }> = [];
  const headingRegex = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  const headings: Array<{ index: number; end: number; heading: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(withoutNoise)) != null) {
    headings.push({
      index: match.index,
      end: match.index + match[0].length,
      heading: decodeHtml(stripTags(match[2])).trim().slice(0, 200),
    });
  }

  for (let i = 0; i < headings.length; i += 1) {
    const current = headings[i]!;
    if (!current.heading) continue;
    const next = headings[i + 1];
    const slice = withoutNoise.slice(current.end, next?.index ?? withoutNoise.length);
    const content = collapseWhitespace(decodeHtml(stripTags(slice))).slice(0, 4_000);
    if (content.length < 40) continue;
    sections.push({ heading: current.heading, content });
  }

  const faqs: Array<{ question: string; answer: string }> = [];
  const detailsRegex = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  while ((match = detailsRegex.exec(withoutNoise)) != null) {
    const question = collapseWhitespace(decodeHtml(stripTags(match[1] ?? "")));
    const answer = collapseWhitespace(decodeHtml(stripTags(match[2] ?? "")));
    if (question.length >= 8 && answer.length >= 12) {
      faqs.push({ question: question.slice(0, 300), answer: answer.slice(0, 2_000) });
    }
  }

  const plainText = collapseWhitespace(decodeHtml(stripTags(withoutNoise))).slice(0, MAX_TEXT_CHARS);
  if (sections.length === 0 && plainText.length >= 80) {
    sections.push({ heading: title || "Page", content: plainText.slice(0, 4_000) });
  }

  return { title: title || "AsliJobs", sections, faqs, plainText };
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    );
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
