import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  discoverKnowledgePathsFromSeeds,
  isCrawlablePublicPath,
  isExcludedDiscoveryPath,
  normalizeKnowledgePath,
  parseSitemapLocs,
} from "./website-knowledge.discover.js";
import { robotsAllowsPath } from "./website-knowledge.crawl.js";
import { embedKnowledgeTextHash, cosineSimilarity } from "./website-knowledge.embeddings.js";
import { blendSemanticHits, rankKnowledgeHits } from "./website-knowledge.retrieve.js";
import { extractKnowledgeFromHtml } from "./website-knowledge.html.js";

describe("website knowledge discovery", () => {
  it("merges footer + route + catalog seeds and excludes private paths", () => {
    const urls = discoverKnowledgePathsFromSeeds();
    assert.ok(urls.length >= 15);
    assert.ok(urls.some((u) => u.path === "/pricing-plans"));
    assert.ok(urls.some((u) => u.path.includes("faqs") || u.path === "/faqs"));
    assert.ok(urls.some((u) => u.source === "footer" || u.source === "catalog" || u.source === "route_manifest"));
    assert.equal(isExcludedDiscoveryPath("/employer/dashboard"), true);
    assert.equal(isExcludedDiscoveryPath("/job-seeker/register"), true);
    assert.equal(isExcludedDiscoveryPath("/employer/login"), true);
    assert.equal(isCrawlablePublicPath("/employer-guide"), true);
    assert.equal(isCrawlablePublicPath("/api/v1/jobs"), false);
  });

  it("normalizes tracking params and keeps meaningful query keys", () => {
    assert.equal(
      normalizeKnowledgePath("/faqs?utm_source=x&resource=faqs"),
      "/faqs?resource=faqs",
    );
    assert.equal(normalizeKnowledgePath("/privacy-policy/"), "/privacy-policy");
  });

  it("parses sitemap locs for allowlisted hosts only", () => {
    const xml = `
      <urlset>
        <url><loc>https://www.aslijobs.com/pricing-plans</loc></url>
        <url><loc>https://evil.example/steal</loc></url>
      </urlset>`;
    const locs = parseSitemapLocs(xml, new Set(["www.aslijobs.com", "aslijobs.com"]));
    assert.deepEqual(locs, ["/pricing-plans"]);
  });
});

describe("website knowledge robots", () => {
  it("honours disallow prefixes", () => {
    assert.equal(robotsAllowsPath({ allowAll: true, disallow: [] }, "/faqs"), true);
    assert.equal(robotsAllowsPath({ allowAll: false, disallow: ["/employer"] }, "/employer-guide"), true);
    assert.equal(robotsAllowsPath({ allowAll: false, disallow: ["/"] }, "/faqs"), false);
  });
});

describe("website knowledge cheerio extraction", () => {
  it("extracts meta, headings, lists, and FAQ details", () => {
    const html = `
      <html lang="en"><head>
        <title>Contact Us</title>
        <meta name="description" content="Reach AsliJobs support" />
        <link rel="canonical" href="https://www.aslijobs.com/contact" />
      </head>
      <body>
        <nav>Home Jobs</nav>
        <main>
          <h1>Contact AsliJobs</h1>
          <p>Email contact@aslijobs.com</p>
          <ul><li>Phone 9248719057</li></ul>
          <details><summary>How can users contact AsliJobs support?</summary>
            <p>You can contact AsliJobs support through WhatsApp, phone, or email.</p>
          </details>
        </main>
        <footer data-site-footer>Footer noise</footer>
      </body></html>`;
    const extracted = extractKnowledgeFromHtml(html);
    assert.equal(extracted.title, "Contact Us");
    assert.match(extracted.description, /Reach AsliJobs/);
    assert.match(extracted.canonicalUrl, /\/contact/);
    assert.ok(extracted.faqs.some((f) => /contact AsliJobs support/i.test(f.question)));
    assert.doesNotMatch(extracted.plainText, /Footer noise/);
    assert.ok(extracted.sections.length >= 1);
  });
});

describe("website knowledge hybrid retrieval", () => {
  it("blends semantic chunk scores with lexical FAQ hits", () => {
    const faqs = [
      {
        question: "What is AsliJobs?",
        answer: "AsliJobs is a WhatsApp-based job portal.",
        canonicalUrl: "https://www.aslijobs.com/faqs",
        language: "en" as const,
        normalizedQuestion: "what is aslijobs",
        active: true,
      },
    ];
    const lexical = rankKnowledgeHits({
      query: "What is AsliJobs?",
      faqs,
      sections: [],
      limit: 5,
    });
    assert.equal(lexical[0]?.kind, "faq");
    const qEmb = embedKnowledgeTextHash("pricing plans for employers");
    const chunkEmb = embedKnowledgeTextHash("Pricing Plans paid hiring plans Basic Hiring Plan");
    const blended = blendSemanticHits({
      queryEmbedding: qEmb,
      lexicalHits: lexical,
      chunks: [
        {
          sectionTitle: "Pricing Plans",
          text: "AsliJobs offers paid hiring plans for employers.",
          sourceUrl: "https://www.aslijobs.com/pricing-plans",
          sourceType: "pricing",
          language: "en",
          embedding: chunkEmb,
        },
      ],
      limit: 5,
    });
    assert.ok(blended.length >= 1);
    assert.ok(cosineSimilarity(qEmb, chunkEmb) > 0.1);
  });
});
