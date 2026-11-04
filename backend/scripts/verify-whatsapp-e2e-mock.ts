import {
  buildKnowledgeWhatsAppPreview,
  executeKnowledgeWhatsAppE2E,
  getWhatsAppE2EEligibility,
} from "../src/modules/website-knowledge/website-knowledge.whatsapp-e2e.js";

async function main() {
  const eligibility = getWhatsAppE2EEligibility();
  const mock = await executeKnowledgeWhatsAppE2E({
    adminUserId: "ops-verify",
    recipientRaw: "9876543210",
    messageBody: buildKnowledgeWhatsAppPreview({
      answer: "AsliJobs helps job seekers and employers.",
      sourceUrl: "https://www.aslijobs.com/faqs",
    }),
    confirm: true,
    mode: "mock",
  });
  const liveRefused = await executeKnowledgeWhatsAppE2E({
    adminUserId: "ops-verify",
    recipientRaw: "9876543210",
    messageBody: "test",
    confirm: true,
    mode: "live",
  });
  console.log(
    JSON.stringify(
      {
        e2eEnabled: eligibility.e2eEnabled,
        liveSendAllowed: eligibility.liveSendAllowed,
        reason: eligibility.reason,
        mockOk: mock.ok,
        mockError: mock.error,
        mockAccepted: mock.accepted,
        mockNote: mock.note,
        liveOk: liveRefused.ok,
        liveError: liveRefused.error,
        liveNote: liveRefused.note,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
