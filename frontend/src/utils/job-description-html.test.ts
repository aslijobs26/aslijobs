import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JobDescriptionContent } from "../components/ui/JobDescriptionContent";
import { sanitizeJobDescriptionHtml } from "./job-description-html";

const tamilHtml =
  "<h2>வேலை விவரம்</h2><p>அனுபவம்: 2 ஆண்டுகள்</p><ul><li>அழைப்புகளை மேற்கொள்ளுங்கள்.</li><li>பின்தொடரவும்.</li></ul>";
const englishHtml =
  "<h2>Job Description</h2><p>Experience: Fresher to 2 Years</p><ul><li>Make outbound calls.</li></ul>";

describe("job description rendering", () => {
  it("renders a stored Tamil description without falling back to English", () => {
    const safe = sanitizeJobDescriptionHtml(tamilHtml);
    assert.match(safe, /வேலை விவரம்/);
    assert.match(safe, /<h2>/);
    assert.match(safe, /<ul>/);
    assert.match(safe, /<li>/);
    assert.match(safe, /\b2\b/);
    assert.equal((safe.match(/<li>/g) ?? []).length, 2);

    const markup = renderToStaticMarkup(
      createElement(JobDescriptionContent, { html: tamilHtml }),
    );
    assert.match(markup, /வேலை விவரம்/);
    assert.match(markup, /அழைப்புகளை மேற்கொள்ளுங்கள்/);
    assert.equal(markup.includes("Make outbound calls"), false);
    assert.equal(markup.includes("Fresher"), false);

    const original = renderToStaticMarkup(
      createElement(JobDescriptionContent, { html: englishHtml }),
    );
    assert.match(original, /Make outbound calls/);
    assert.equal(original.includes("வேலை விவரம்"), false);
  });
});
