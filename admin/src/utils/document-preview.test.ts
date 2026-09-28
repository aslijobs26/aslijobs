import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectDocumentPreviewKind,
  fileNameFromContentDisposition,
  isJsonOrHtmlBlob,
  isPdfDocumentFile,
  normalizeDocumentBlobForPreview,
  previewErrorMessageFromStatus,
} from "./document-preview.ts";

describe("verification document preview utils", () => {
  it("recognizes GST certificate PDFs by name and mime", () => {
    assert.equal(isPdfDocumentFile("3-DISHHA_GST_CERTIFICATE.pdf", ""), true);
    assert.equal(isPdfDocumentFile("gst.bin", "application/pdf"), true);
    assert.equal(detectDocumentPreviewKind("3-DISHHA_GST_CERTIFICATE.pdf"), "pdf");
  });

  it("reads the filename from Content-Disposition without treating it as a download flag", () => {
    assert.equal(
      fileNameFromContentDisposition('inline; filename="gst.pdf"'),
      "gst.pdf",
    );
  });

  it("rejects JSON error payloads that would render a blank PDF viewer", () => {
    const json = new Blob([JSON.stringify({ message: "nope" })], {
      type: "application/json",
    });
    assert.equal(isJsonOrHtmlBlob(json, "application/json"), true);
  });

  it("normalizes octet-stream PDF bytes to application/pdf", async () => {
    const bytes = new Blob([Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n")], {
      type: "application/octet-stream",
    });
    const normalized = await normalizeDocumentBlobForPreview(
      bytes,
      "3-DISHHA_GST_CERTIFICATE.pdf",
      "application/octet-stream",
    );
    assert.equal(normalized.type, "application/pdf");
  });

  it("rejects invalid PDF bytes", async () => {
    const fake = new Blob(["not a pdf"], { type: "application/octet-stream" });
    await assert.rejects(
      () => normalizeDocumentBlobForPreview(fake, "gst.pdf"),
      /invalid_pdf/,
    );
  });

  it("treats GST octet-stream PDFs as previewable PDFs", () => {
    assert.equal(
      detectDocumentPreviewKind(
        "3-DISHHA_GST_CERTIFICATE.pdf",
        "application/octet-stream",
      ),
      "pdf",
    );
  });

  it("maps auth and missing-document errors", () => {
    assert.match(previewErrorMessageFromStatus(403), /permission/i);
    assert.match(previewErrorMessageFromStatus(404), /not be found/i);
    assert.match(previewErrorMessageFromStatus(401), /session/i);
  });
});
