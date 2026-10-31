import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectDocumentKind,
  extractDocumentText,
  extractResumeHints,
  isUsableDigitalText,
  truncateExtractedText,
} from "./whatsapp-media-extract.js";

describe("whatsapp media extract", () => {
  it("detects pdf magic bytes and rejects legacy doc / zip / exe", () => {
    const pdf = Buffer.concat([Buffer.from("%PDF-1.4"), Buffer.alloc(20)]);
    assert.equal(detectDocumentKind("application/pdf", "cv.pdf", pdf), "pdf");
    assert.equal(
      detectDocumentKind("application/msword", "old.doc", Buffer.from("x")),
      "unsupported",
    );
    assert.equal(
      detectDocumentKind("application/zip", "x.zip", Buffer.from([0x50, 0x4b, 0x03, 0x04])),
      "unsupported",
    );
    assert.equal(
      detectDocumentKind("application/pdf", "fake.pdf", Buffer.from("not-a-pdf")),
      "unsupported",
    );
    assert.equal(
      detectDocumentKind("text/plain", "virus.txt", Buffer.from([0x4d, 0x5a, 0x90, 0x00])),
      "unsupported",
    );
  });

  it("extracts plain text resumes", async () => {
    const buffer = Buffer.from(
      "John Doe\nSkills: React, Node, TypeScript\nExperience: 3 years\nEducation: B.Tech",
      "utf8",
    );
    const result = await extractDocumentText({
      buffer,
      mimeType: "text/plain",
      fileName: "resume.txt",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.text, /React/);
    assert.equal(result.source, "digital");
    const hints = extractResumeHints(result.text);
    assert.ok(hints.skills.includes("react"));
    assert.ok(hints.skills.includes("node"));
    assert.equal(hints.looksLikeResume, true);
  });

  it("rejects empty buffers and truncates long text", async () => {
    const empty = await extractDocumentText({
      buffer: Buffer.alloc(0),
      mimeType: "text/plain",
      fileName: "empty.txt",
    });
    assert.equal(empty.ok, false);

    const long = "a".repeat(20_000);
    const truncated = truncateExtractedText(long, 100);
    assert.equal(truncated.truncated, true);
    assert.equal(truncated.text.length, 100);
  });

  it("detects unusable digital text for scanned-PDF routing", () => {
    assert.equal(isUsableDigitalText("   \n\n  "), false);
    assert.equal(isUsableDigitalText("Hi"), false);
    assert.equal(
      isUsableDigitalText(
        "Software Engineer with React and Node experience across multiple projects and teams.",
      ),
      true,
    );
  });

  it("classifies job-ad text separately from resumes", () => {
    const hints = extractResumeHints(
      "We are hiring React developers. Job description: responsibilities and requirements. Salary competitive. Apply now.",
    );
    assert.equal(hints.looksLikeJobAd, true);
  });
});
