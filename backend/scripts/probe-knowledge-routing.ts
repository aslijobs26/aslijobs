import {
  understandLocally,
  applyAccountAwareIntent,
  unknownUserAction,
  applyRoleHints,
  looksLikePlatformKnowledge,
  looksLikeHowToPostJobGuide,
  looksLikePricingQuestion,
} from "../src/modules/whatsapp/whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "../src/modules/whatsapp/whatsapp-role-policy.js";
import { answerWebsiteKnowledgeQuestion } from "../src/modules/website-knowledge/website-knowledge.service.js";

const qs = [
  "Phone",
  "Driver",
  "Driver job",
  "Which job category are available",
  "Which job categories are available?",
  "Are employer services free or paid",
  "How can I post a job?",
  "Employer pricing plans",
  "AsliJobs ante enti?",
  "Is job posting free?",
  "How much does posting a job cost?",
  "Employer guide",
];

for (const q of qs) {
  const u = understandLocally(q);
  const none = applyAccountAwareIntent(u, "none");
  const employer = applyAccountAwareIntent(u, "employer");
  const gateE = authorizeWhatsAppRole({
    account: "employer",
    intent: u.intent,
    activeRole: "employer",
  });
  const knowledge = await answerWebsiteKnowledgeQuestion({
    query: q,
    language: "en",
    frontendOrigin: "https://www.aslijobs.com",
  });
  console.log(
    [
      `Q: ${q}`,
      `  intent=${u.intent} cat=${u.category || "-"} focus=${u.focus || "-"} open=${u.openSearch}`,
      `  pk=${looksLikePlatformKnowledge(q)} price=${looksLikePricingQuestion(q)} howPost=${looksLikeHowToPostJobGuide(q)}`,
      `  unknownAction=${unknownUserAction(u)} noneCross=${none.crossRole || "-"} empIntent=${employer.intent} empCross=${employer.crossRole || "-"}`,
      `  gateE.allowed=${gateE.allowed} reason=${gateE.allowed ? gateE.reason : gateE.reason}`,
      `  knowledge.confidence=${knowledge.confidence} usedFaq=${knowledge.usedFaq}`,
      `  knowledge.source=${knowledge.sourceUrl}`,
      `  knowledge.text=${knowledge.text.slice(0, 140).replace(/\n/g, " | ")}`,
      `  hinted=${applyRoleHints(q, u, "none").intent}`,
    ].join("\n"),
  );
}
