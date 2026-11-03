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
    .slice(0, 1_200);
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

  const evidence = sanitizeRetrievedContent(top.content);
  const extras =
    confidence === "low"
      ? input.hits
          .slice(1, 3)
          .map((hit) => sanitizeRetrievedContent(hit.content))
          .filter(Boolean)
      : [];

  const body =
    top.kind === "faq"
      ? evidence
      : [top.sectionHeading ? `${top.sectionHeading}:` : "", evidence, ...extras]
          .filter(Boolean)
          .join(" ")
          .trim();

  const lines = [body];
  if (confidence === "low") {
    lines.push("If you need more detail, open the official page below.");
  }
  lines.push(`Details: ${top.canonicalUrl}`);

  return {
    text: lines.join("\n\n").slice(0, 1_600),
    sourceUrl: top.canonicalUrl,
    sourceTitle: top.title || top.sectionHeading,
    confidence,
    usedFaq: top.kind === "faq",
  };
}
