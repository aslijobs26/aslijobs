import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadOfficialPolicyCorpusSections, mergePolicySectionsIntoCorpus } from "./website-knowledge.policy.js";
import { CORPUS_SECTIONS } from "./website-knowledge.corpus.js";
import { rankKnowledgeHits, confidenceFromHits } from "./website-knowledge.retrieve.js";
import { normalizeKnowledgeText } from "./website-knowledge.normalize.js";
import {
  isThinKnowledgePath,
  shouldAttemptBrowserFallback,
} from "./website-knowledge.browser.js";
import {
  resolveEmbeddingProvider,
  embedKnowledgeTextHash,
  HASH_EMBEDDING_DIMS,
} from "./website-knowledge.embeddings.js";
import { isCrawlablePublicPath } from "./website-knowledge.discover.js";

describe("website knowledge policy completeness", () => {
  it("loads official Privacy/Terms/Guidelines sections from generated corpus", () => {
    const sections = loadOfficialPolicyCorpusSections();
    assert.ok(sections.length >= 50, `expected many policy sections, got ${sections.length}`);
    assert.ok(sections.some((s) => s.path === "/privacy-policy" && /personal information/i.test(s.content)));
    assert.ok(sections.some((s) => s.path === "/terms-and-conditions"));
    assert.ok(sections.some((s) => s.path === "/guidelines" && /job seeker/i.test(s.content + s.sectionHeading)));
  });

  it("makes privacy clauses searchable via lexical retrieval", () => {
    const merged = mergePolicySectionsIntoCorpus(CORPUS_SECTIONS);
    const hits = rankKnowledgeHits({
      query: "What personal information do you collect from job seekers?",
      faqs: [],
      sections: merged.map((section) => ({
        title: section.title,
        sectionHeading: section.sectionHeading,
        content: section.content,
        canonicalUrl: `https://www.aslijobs.com${section.path}`,
        sourceType: section.sourceType,
        language: "en" as const,
        persona: section.persona,
        keywords: section.keywords,
      })),
      limit: 5,
    });
    assert.ok(hits.length > 0);
    assert.notEqual(confidenceFromHits(hits), "none");
    assert.match(hits[0]!.canonicalUrl, /privacy-policy/);
    assert.match(
      normalizeKnowledgeText(hits[0]!.content + hits[0]!.sectionHeading),
      /personal|job seeker|information|privacy/,
    );
  });
});

describe("website knowledge thin-page browser strategy", () => {
  it("flags resources shells as thin and require optional browser", () => {
    assert.equal(isThinKnowledgePath("/resources"), true);
    assert.equal(isThinKnowledgePath("/resources?page=sitemap"), true);
    assert.equal(isThinKnowledgePath("/privacy-policy"), false);
    assert.equal(
      shouldAttemptBrowserFallback({
        enabled: true,
        path: "/resources",
        contentChars: 48,
      }),
      true,
    );
    assert.equal(
      shouldAttemptBrowserFallback({
        enabled: false,
        path: "/resources",
        contentChars: 48,
      }),
      false,
    );
  });
});

describe("website knowledge embedding providers", () => {
  it("resolves xenova vs hash and keeps hash dims stable", () => {
    assert.equal(resolveEmbeddingProvider(false), "none");
    assert.equal(resolveEmbeddingProvider(true, "hash"), "hash");
    assert.equal(resolveEmbeddingProvider(true, "xenova"), "xenova");
    const vec = embedKnowledgeTextHash("AsliJobs privacy policy personal data");
    assert.equal(vec.length, HASH_EMBEDDING_DIMS);
  });
});

describe("website knowledge page ops allowlist", () => {
  it("rejects private paths for single-page refresh", () => {
    assert.equal(isCrawlablePublicPath("/employer/dashboard"), false);
    assert.equal(isCrawlablePublicPath("/privacy-policy"), true);
  });
});
