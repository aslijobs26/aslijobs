import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  estimateReadingMinutes,
  extractBlogHeadings,
  firstYoutubeVideoId,
  sanitizeBlogHtml,
  slugifyBlogText,
} from "./blog.html.js";

describe("blog html", () => {
  it("slugifies titles", () => {
    assert.equal(slugifyBlogText("5 Tips to Find the Right Job Faster"), "5-tips-to-find-the-right-job-faster");
    assert.equal(slugifyBlogText("   "), "article");
  });

  it("drops scripts and keeps headings, lists, and links", () => {
    const html = sanitizeBlogHtml(
      `<h2>Start here</h2><script>alert(1)</script><p>Hello <strong>there</strong></p><ul><li>One</li></ul><a href="javascript:alert(1)">bad</a><a href="https://aslijobs.com/jobs">jobs</a>`,
    );
    assert.equal(html.includes("script"), false);
    assert.equal(html.includes("alert"), false);
    assert.equal(html.includes("javascript:"), false);
    assert.match(html, /<h2 id="start-here">Start here<\/h2>/);
    assert.match(html, /href="https:\/\/aslijobs.com\/jobs"/);
    assert.match(html, /<strong>there<\/strong>/);
  });

  it("allows youtube embeds and rejects other iframes", () => {
    const html = sanitizeBlogHtml(
      `<iframe src="https://www.youtube.com/embed/dQw4w9wg"></iframe><iframe src="https://evil.example/embed"></iframe><img src="data:image/png;base64,aaaa" alt="x"><img src="https://cdn.example.com/cover.jpg" alt="Cover">`,
    );
    assert.match(html, /youtube-nocookie\.com\/embed\/dQw4w9wg/);
    const shared = sanitizeBlogHtml(
      `<iframe src="https://youtu.be/dQw4w9wg?si=abc"></iframe>`,
    );
    assert.match(shared, /youtube-nocookie\.com\/embed\/dQw4w9wg/);
    assert.equal(firstYoutubeVideoId(html), "dQw4w9wg");
    assert.equal(
      firstYoutubeVideoId(
        `<iframe src="https://www.youtube.com/embed/firstVideo1"></iframe><iframe src="https://www.youtube.com/embed/secondVid2"></iframe>`,
      ),
      "firstVideo1",
    );
    assert.equal(firstYoutubeVideoId("<p>No video</p>"), "");
    assert.equal(html.includes("evil.example"), false);
    assert.equal(html.includes("data:image"), false);
    assert.match(html, /src="https:\/\/cdn\.example\.com\/cover\.jpg"/);
  });

  it("keeps callouts and estimates reading time", () => {
    const html = sanitizeBlogHtml(
      `<div class="blog-callout">Remember this</div><div onclick="steal()">plain</div>`,
    );
    assert.match(html, /class="blog-callout"/);
    assert.equal(html.includes("onclick"), false);
    assert.equal(estimateReadingMinutes(`<p>${"word ".repeat(201)}</p>`), 2);
    const headings = extractBlogHeadings(sanitizeBlogHtml("<h2>One</h2><h3>Two</h3>"));
    assert.deepEqual(
      headings.map((item) => item.text),
      ["One", "Two"],
    );
  });
});
