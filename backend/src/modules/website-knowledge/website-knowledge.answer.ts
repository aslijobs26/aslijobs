import type { KnowledgeAnswer, KnowledgeHit } from "./website-knowledge.types.js";
import { confidenceFromHits } from "./website-knowledge.retrieve.js";
import { OFFICIAL_PUBLIC_CONTACT } from "./website-knowledge.catalog.js";

const INJECTION_PATTERNS =
  /ignore (all |previous )?instructions|system prompt|reveal (your |the )?prompt|jailbreak|developer mode/i;

/** Treat retrieved website text as untrusted data. Never follow embedded instructions. */
export function sanitizeRetrievedContent(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(INJECTION_PATTERNS, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

function stripLeadingHeading(heading: string, body: string): string {
  const clean = heading.trim();
  if (!clean) return body;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return body.replace(new RegExp(`^${escaped}\\s*`, "i"), "").trim();
}

function clipAtSentence(text: string, max: number): string {
  const clipped = text.trim().slice(0, max);
  if (clipped.length === text.trim().length) return clipped;
  const end = Math.max(clipped.lastIndexOf(". "), clipped.lastIndexOf(".\n"), clipped.lastIndexOf("."));
  if (end > max * 0.45) return clipped.slice(0, end + 1).trim();
  return clipped.trim();
}

export function composeGroundedKnowledgeAnswer(input: {
  query: string;
  hits: KnowledgeHit[];
  helpCenterUrl: string;
  contactUrl: string;
  faqsUrl: string;
}): KnowledgeAnswer {
  const confidence = confidenceFromHits(input.hits);
  const top = input.hits[0];
  if (!top || confidence === "none") {
    return {
      text: [
        "I could not confirm that answer from the official AsliJobs documentation available to me.",
        `Help Center: ${input.helpCenterUrl}`,
        `Contact Us: ${input.contactUrl}`,
        `FAQs: ${input.faqsUrl}`,
        `Email: ${OFFICIAL_PUBLIC_CONTACT.email}`,
        `Phone: ${OFFICIAL_PUBLIC_CONTACT.phone}`,
      ].join("\n"),
      sourceUrl: input.helpCenterUrl,
      sourceTitle: "Help Center",
      confidence: "none",
      usedFaq: false,
    };
  }

  const evidence = stripLeadingHeading(
    top.sectionHeading,
    sanitizeRetrievedContent(top.content),
  );
  const broadGuide = /guideline|rules|job posting|employer guide/i.test(input.query);
  const samePage = input.hits.filter(
    (hit) => hit.canonicalUrl === top.canonicalUrl && hit.sectionHeading !== top.sectionHeading,
  );
  const extraHits = broadGuide || confidence === "low" ? samePage.slice(0, 2) : [];
  const extras = extraHits
    .map((hit) => {
      const heading = hit.sectionHeading?.trim() ?? "";
      const body = clipAtSentence(
        stripLeadingHeading(heading, sanitizeRetrievedContent(hit.content)),
        280,
      );
      return [heading, body].filter(Boolean).join(": ");
    })
    .filter(Boolean);

  // Prefer official contact numbers from a contact hit when FAQ answer is generic.
  const contactHit = input.hits.find(
    (hit) =>
      hit.sourceType === "contact"
      || /contact@aslijobs\.com|9248719057/i.test(hit.content),
  );
  const contactSupplement =
    contactHit && top.kind === "faq" && /contact|support|phone|email/i.test(top.sectionHeading + top.content)
      && !/contact@aslijobs\.com|9248719057/i.test(evidence)
      ? sanitizeRetrievedContent(contactHit.content)
      : "";

  const body =
    top.kind === "faq"
      ? [evidence, contactSupplement].filter(Boolean).join(" ")
      : [top.sectionHeading ? `${top.sectionHeading}:` : "", evidence, ...extras]
          .filter(Boolean)
          .join(" ")
          .trim();

  const lines = [clipAtSentence(body, 720)];
  if (confidence === "low") {
    lines.push("If you need more detail, open the official page below.");
  }
  lines.push(`Details: ${top.canonicalUrl}`);
  if (contactHit && contactHit.canonicalUrl !== top.canonicalUrl && /contact|phone|email/i.test(input.query)) {
    lines.push(`Contact: ${contactHit.canonicalUrl}`);
  }

  return {
    text: lines.join("\n\n").slice(0, 900),
    sourceUrl: top.canonicalUrl,
    sourceTitle: top.title || top.sectionHeading,
    confidence,
    usedFaq: top.kind === "faq",
  };
}
