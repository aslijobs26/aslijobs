import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  safeMediaFileName,
  validateWhatsAppMedia,
} from "./whatsapp-media.js";

describe("whatsapp media validation", () => {
  it("accepts images and pdf documents within the size limit", () => {
    assert.deepEqual(
      validateWhatsAppMedia({ mimeType: "image/jpeg", sizeBytes: 1024 }),
      { kind: "image" },
    );
    assert.deepEqual(
      validateWhatsAppMedia({ mimeType: "application/pdf", sizeBytes: 2048 }),
      { kind: "document" },
    );
  });

  it("rejects unsupported types and oversized images", () => {
    assert.deepEqual(
      validateWhatsAppMedia({ mimeType: "application/zip", sizeBytes: 100 }),
      { error: "This file type cannot be sent on WhatsApp." },
    );
    const oversized = validateWhatsAppMedia({
      mimeType: "image/png",
      sizeBytes: 6 * 1024 * 1024,
    });
    assert.equal("error" in oversized, true);
  });

  it("strips path segments from file names", () => {
    assert.equal(safeMediaFileName("../resume.pdf"), "resume.pdf");
    assert.equal(safeMediaFileName(""), "file");
  });
});
