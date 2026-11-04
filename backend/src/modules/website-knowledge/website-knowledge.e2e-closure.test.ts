import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyContentQuality,
  isThinKnowledgePath,
  shouldAttemptBrowserFallback,
} from "./website-knowledge.browser.js";
import {
  cosineSimilarity,
  embedKnowledgeText,
  embedKnowledgeTextHash,
  embeddingsCompatible,
  expectedEmbeddingDimsForProvider,
  expectedEmbeddingModelForProvider,
  HASH_EMBEDDING_DIMS,
  HASH_EMBEDDING_MODEL,
  resolveEmbeddingProvider,
  XENOVA_E5_DIMS,
  XENOVA_E5_MODEL_ID,
} from "./website-knowledge.embeddings.js";
import {
  buildKnowledgeWhatsAppPreview,
  executeKnowledgeWhatsAppE2E,
  getWhatsAppE2EEligibility,
  isRecipientAuthorizedForE2E,
  maskWhatsAppRecipientSafe,
  parseWhatsAppE2EAllowlist,
  shortenMessageId,
} from "./website-knowledge.whatsapp-e2e.js";

describe("website knowledge embedding contracts", () => {
  it("keeps hash dims and resolves providers", () => {
    assert.equal(resolveEmbeddingProvider(false), "none");
    assert.equal(resolveEmbeddingProvider(true, "hash"), "hash");
    assert.equal(resolveEmbeddingProvider(true, "e5"), "xenova");
    assert.equal(expectedEmbeddingDimsForProvider("hash"), HASH_EMBEDDING_DIMS);
    assert.equal(expectedEmbeddingDimsForProvider("xenova"), XENOVA_E5_DIMS);
    assert.equal(expectedEmbeddingModelForProvider("xenova"), XENOVA_E5_MODEL_ID);
    const vec = embedKnowledgeTextHash("AsliJobs privacy policy personal data");
    assert.equal(vec.length, HASH_EMBEDDING_DIMS);
    const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0));
    assert.ok(Math.abs(norm - 1) < 1e-6);
  });

  it("rejects mixing hash vectors into xenova index checks", () => {
    const hash = embedKnowledgeTextHash("privacy policy");
    assert.equal(
      embeddingsCompatible({
        embedding: hash,
        embeddingModel: HASH_EMBEDDING_MODEL,
        provider: "xenova",
      }),
      false,
    );
    assert.equal(
      embeddingsCompatible({
        embedding: hash,
        embeddingModel: HASH_EMBEDDING_MODEL,
        provider: "hash",
      }),
      true,
    );
  });

  it("falls back to hash when xenova unavailable without throwing", async () => {
    const embedded = await embedKnowledgeText({
      text: "What is the privacy policy?",
      enabled: true,
      provider: "hash",
      asQuery: true,
    });
    assert.ok(embedded);
    assert.equal(embedded!.provider, "hash");
    assert.equal(embedded!.vector.length, HASH_EMBEDDING_DIMS);
  });

  it("computes cosine similarity correctly", () => {
    assert.ok(cosineSimilarity([1, 0], [1, 0]) > 0.99);
    assert.ok(cosineSimilarity([1, 0], [0, 1]) < 0.01);
    assert.equal(cosineSimilarity([], [1]), 0);
  });
});

describe("website knowledge browser strategy", () => {
  it("classifies thin resources paths and quality", () => {
    assert.equal(isThinKnowledgePath("/resources"), true);
    assert.equal(isThinKnowledgePath("/resources?page=sitemap"), true);
    assert.equal(
      shouldAttemptBrowserFallback({ enabled: true, path: "/resources", contentChars: 20 }),
      true,
    );
    assert.equal(
      shouldAttemptBrowserFallback({ enabled: false, path: "/resources", contentChars: 20 }),
      false,
    );
    assert.equal(classifyContentQuality(0), "empty");
    assert.equal(classifyContentQuality(40), "thin");
    assert.equal(classifyContentQuality(200), "adequate");
    assert.equal(classifyContentQuality(800), "rich");
  });
});

describe("website knowledge WhatsApp E2E safety", () => {
  it("defaults to disabled live send and empty allowlist", () => {
    const eligibility = getWhatsAppE2EEligibility();
    assert.equal(eligibility.e2eEnabled, false);
    assert.equal(eligibility.liveSendAllowed, false);
    assert.equal(parseWhatsAppE2EAllowlist("").length, 0);
  });

  it("parses allowlist and masks recipients", () => {
    const list = parseWhatsAppE2EAllowlist("9876543210, 919876543210");
    assert.equal(list.length, 1);
    assert.equal(list[0], "919876543210");
    assert.match(maskWhatsAppRecipientSafe("919876543210"), /\*{4}/);
    const short = shortenMessageId("wamid.ABCDEFGHIJKLMNOPQRST");
    assert.ok(short);
    assert.ok(short!.includes("…"));
  });

  it("refuses unauthorized recipient and unconfirmed send", async () => {
    const unauthorized = isRecipientAuthorizedForE2E("911111111111");
    assert.equal(unauthorized.authorized, false);

    const refused = await executeKnowledgeWhatsAppE2E({
      adminUserId: "admin-test",
      recipientRaw: "9876543210",
      messageBody: buildKnowledgeWhatsAppPreview({ answer: "AsliJobs is a job platform." }),
      confirm: false,
      mode: "mock",
    });
    assert.equal(refused.ok, false);
    assert.ok(
      refused.error === "confirmation_required" || refused.error === "allowlist_empty" || refused.error === "recipient_not_allowlisted",
    );
  });

  it("builds a bounded message preview", () => {
    const preview = buildKnowledgeWhatsAppPreview({
      answer: "Privacy policy summary",
      sourceUrl: "https://www.aslijobs.com/privacy-policy",
    });
    assert.match(preview, /Privacy policy summary/);
    assert.match(preview, /Source:/);
    assert.ok(preview.length <= 3900);
  });
});
