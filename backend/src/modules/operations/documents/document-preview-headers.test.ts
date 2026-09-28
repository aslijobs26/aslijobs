import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDocumentFileHeaders } from "./document-preview-headers.js";

describe("verification document preview headers", () => {
  it("serves PDFs as application/pdf with inline disposition", () => {
    const headers = resolveDocumentFileHeaders({
      mimeType: "application/octet-stream",
      fileName: "3-DISHHA_GST_CERTIFICATE.pdf",
      disposition: "inline",
    });
    assert.equal(headers.contentType, "application/pdf");
    assert.match(headers.contentDisposition, /^inline;/);
    assert.match(headers.contentDisposition, /GST_CERTIFICATE\.pdf/);
    assert.doesNotMatch(headers.contentDisposition, /attachment/);
  });

  it("keeps stored MIME for non-PDF files", () => {
    const headers = resolveDocumentFileHeaders({
      mimeType: "image/png",
      fileName: "logo.png",
      disposition: "inline",
    });
    assert.equal(headers.contentType, "image/png");
    assert.match(headers.contentDisposition, /^inline;/);
  });

  it("uses attachment only when download disposition is requested", () => {
    const headers = resolveDocumentFileHeaders({
      mimeType: "application/pdf",
      fileName: "gst.pdf",
      disposition: "attachment",
    });
    assert.equal(headers.contentType, "application/pdf");
    assert.match(headers.contentDisposition, /^attachment;/);
  });
});
