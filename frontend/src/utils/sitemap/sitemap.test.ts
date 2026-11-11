import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  JOBS_PER_SITEMAP,
  PRIVATE_CRAWL_PATHS,
  PUBLIC_SITEMAP_PATHS,
  buildJobEntries,
  buildPublicPageEntries,
  buildSitemapIndexEntries,
  needsSitemapIndex,
  parseSitemapFile,
  parseSitemapJobsResponse,
} from "./sitemap-entries";
import {
  buildSitemapIndexXml,
  buildUrlsetXml,
  escapeXml,
  toSitemapLastModified,
} from "./sitemap-xml";

const SITE = "https://www.aslijobs.com";

describe("sitemap xml", () => {
  it("escapes XML special characters", () => {
    assert.equal(
      escapeXml(`a&b<c>"d'`),
      "a&amp;b&lt;c&gt;&quot;d&apos;",
    );
  });

  it("builds a valid urlset with lastmod only when a reliable date exists", () => {
    const xml = buildUrlsetXml([
      { loc: `${SITE}/` },
      { loc: `${SITE}/jobs/AJ-2026-000001`, lastModified: "2026-04-15T08:30:00.000Z" },
      { loc: `${SITE}/jobs/AJ-2026-000002`, lastModified: "garbage" },
    ]);

    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(xml.trimEnd().endsWith("</urlset>"));
    assert.ok(xml.includes(`<url><loc>${SITE}/</loc></url>`));
    assert.ok(
      xml.includes(
        `<url><loc>${SITE}/jobs/AJ-2026-000001</loc><lastmod>2026-04-15T08:30:00.000Z</lastmod></url>`,
      ),
    );
    assert.ok(xml.includes(`<url><loc>${SITE}/jobs/AJ-2026-000002</loc></url>`));
    assert.ok(!xml.includes("<priority>"));
    assert.ok(!xml.includes("<changefreq>"));
  });

  it("never repeats a URL", () => {
    const xml = buildUrlsetXml([
      { loc: `${SITE}/faqs` },
      { loc: `${SITE}/faqs` },
    ]);
    assert.equal(xml.match(/<loc>/g)?.length, 1);
  });

  it("builds a sitemap index", () => {
    const xml = buildSitemapIndexXml(buildSitemapIndexEntries(SITE, 2));
    assert.ok(xml.includes('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(xml.includes(`<sitemap><loc>${SITE}/sitemaps/pages.xml</loc></sitemap>`));
    assert.ok(xml.includes(`<sitemap><loc>${SITE}/sitemaps/jobs-1.xml</loc></sitemap>`));
    assert.ok(xml.includes(`<sitemap><loc>${SITE}/sitemaps/jobs-2.xml</loc></sitemap>`));
    assert.ok(!xml.includes("jobs-3.xml"));
  });

  it("normalizes lastmod to W3C datetime", () => {
    assert.equal(toSitemapLastModified("2026-04-15T08:30:00Z"), "2026-04-15T08:30:00.000Z");
    assert.equal(toSitemapLastModified(null), null);
    assert.equal(toSitemapLastModified(""), null);
  });
});

describe("sitemap entries", () => {
  it("lists every public page once on the canonical domain", () => {
    const entries = buildPublicPageEntries(SITE);
    const locs = entries.map((entry) => entry.loc);

    assert.equal(new Set(locs).size, locs.length);
    assert.equal(locs[0], `${SITE}/`);
    for (const loc of locs) {
      assert.ok(loc.startsWith(`${SITE}/`), loc);
      assert.ok(!loc.includes("?"), loc);
    }
  });

  it("does not list a page that robots.txt disallows", () => {
    for (const path of PUBLIC_SITEMAP_PATHS) {
      for (const blocked of PRIVATE_CRAWL_PATHS) {
        assert.ok(!path.startsWith(blocked), `${path} is blocked by ${blocked}`);
      }
    }
  });

  it("blocks private workspaces, sign-in and the posting wizard", () => {
    const blocks = (path: string) =>
      PRIVATE_CRAWL_PATHS.some((blocked) => path.startsWith(blocked));

    for (const path of [
      "/employer/dashboard",
      "/employer/login",
      "/employer/register",
      "/job-seeker/dashboard",
      "/job-seeker/login",
      "/job-seeker/register",
      "/login",
      "/post-job",
      "/post-job/success",
      "/team/accept-invitation",
      "/team-member/login",
    ]) {
      assert.ok(blocks(path), path);
    }
    for (const path of ["/employer-guide", "/job-seeker-guide", "/post-a-job", "/jobs/AJ-2026-000001"]) {
      assert.ok(!blocks(path), path);
    }
  });

  it("builds job detail URLs from public job ids without duplicates", () => {
    const entries = buildJobEntries(SITE, [
      { publicJobId: "AJ-2026-000001", lastModified: "2026-04-15T08:30:00.000Z" },
      { publicJobId: "aj-2026-000001", lastModified: null },
      { publicJobId: "AJ-ELEC-2", lastModified: null },
      { publicJobId: "../employer/dashboard", lastModified: null },
      { publicJobId: "AJ-2026-000002", lastModified: null },
    ]);

    assert.deepEqual(entries, [
      { loc: `${SITE}/jobs/AJ-2026-000001`, lastModified: "2026-04-15T08:30:00.000Z" },
      { loc: `${SITE}/jobs/AJ-2026-000002`, lastModified: null },
    ]);
  });

  it("switches to a sitemap index only when jobs exceed one file", () => {
    assert.equal(needsSitemapIndex({ jobs: [], total: 0, totalPages: 1 }), false);
    assert.equal(
      needsSitemapIndex({ jobs: [], total: JOBS_PER_SITEMAP, totalPages: 1 }),
      false,
    );
    assert.equal(
      needsSitemapIndex({ jobs: [], total: JOBS_PER_SITEMAP + 1, totalPages: 2 }),
      true,
    );
    assert.ok(JOBS_PER_SITEMAP + PUBLIC_SITEMAP_PATHS.length <= 50_000);
  });

  it("parses child sitemap file names", () => {
    assert.deepEqual(parseSitemapFile("pages.xml"), { kind: "pages" });
    assert.deepEqual(parseSitemapFile("jobs-1.xml"), { kind: "jobs", page: 1 });
    assert.deepEqual(parseSitemapFile("jobs-12.xml"), { kind: "jobs", page: 12 });
    assert.equal(parseSitemapFile("jobs-0.xml"), null);
    assert.equal(parseSitemapFile("jobs-01.xml"), null);
    assert.equal(parseSitemapFile("jobs.xml"), null);
    assert.equal(parseSitemapFile("../jobs-1.xml"), null);
  });

  it("validates the backend sitemap payload", () => {
    assert.deepEqual(
      parseSitemapJobsResponse({
        success: true,
        data: {
          jobs: [
            { publicJobId: "AJ-2026-000001", lastModified: "2026-04-15T08:30:00.000Z" },
            { publicJobId: "AJ-2026-000002", lastModified: null },
            { nope: true },
          ],
          pagination: { page: 1, limit: JOBS_PER_SITEMAP, total: 2, totalPages: 1 },
        },
      }),
      {
        jobs: [
          { publicJobId: "AJ-2026-000001", lastModified: "2026-04-15T08:30:00.000Z" },
          { publicJobId: "AJ-2026-000002", lastModified: null },
        ],
        total: 2,
        totalPages: 1,
      },
    );
    assert.throws(() => parseSitemapJobsResponse({ success: false }));
    assert.throws(() => parseSitemapJobsResponse(null));
  });
});
