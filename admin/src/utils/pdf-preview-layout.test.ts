import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { pdfPageFitScale, pdfPreviewObjectUrl } from "./pdf-preview-layout.ts";

describe("PDF preview layout", () => {
  it("fits PDF page width into the modal container", () => {
    assert.equal(pdfPageFitScale(800, 400, 1), 0.5);
    assert.equal(pdfPageFitScale(400, 800, 1), 2);
    assert.equal(pdfPageFitScale(400, 800, 1.25), 2.5);
  });

  it("never appends Chrome PDF viewer hash fragments to blob URLs", () => {
    const blobUrl = "blob:https://aslijobs-admin.vercel.app/abc-123";
    assert.equal(pdfPreviewObjectUrl(`${blobUrl}#toolbar=1&view=FitH`), blobUrl);
    assert.equal(pdfPreviewObjectUrl(blobUrl), blobUrl);
  });

  it("does not use an iframe or blob hash for in-modal PDF preview", () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const panel = readFileSync(
      path.resolve(
        here,
        "../components/operations/employers/detail/EmployerDocumentsPanel.tsx",
      ),
      "utf8",
    );
    assert.match(panel, /DocumentPdfPreview/);
    assert.doesNotMatch(panel, /<iframe/);
    assert.doesNotMatch(panel, /toolbar=1/);
    assert.doesNotMatch(panel, /backdrop-blur/);
  });
});
