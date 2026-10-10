import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatEmployerDocumentTypeLabel } from "./employer-document.labels.js";
import {
  allowedEmployerDocumentTypes,
  assertEmployerDocumentTypeForAccount,
} from "./employer-document.policy.js";

describe("employer document types", () => {
  it("allows business certificates for company accounts", () => {
    assert.ok(allowedEmployerDocumentTypes("company").includes("gst-certificate"));
    assert.doesNotThrow(() =>
      assertEmployerDocumentTypeForAccount("company", "gst-certificate"),
    );
  });

  it("rejects identity cards as company verification documents", () => {
    assert.throws(
      () => assertEmployerDocumentTypeForAccount("company", "aadhaar"),
      /business verification document/,
    );
  });

  it("keeps incorporation certificates on company accounts", () => {
    assert.ok(
      allowedEmployerDocumentTypes("company").includes(
        "certificate-of-incorporation",
      ),
    );
  });

  it("allows consultancy registration documents and rejects company-only certificates", () => {
    assert.ok(
      allowedEmployerDocumentTypes("consultancy").includes("gst-certificate"),
    );
    assert.doesNotThrow(() =>
      assertEmployerDocumentTypeForAccount("consultancy", "pan-card-business"),
    );
    assert.equal(
      allowedEmployerDocumentTypes("consultancy").includes(
        "certificate-of-incorporation",
      ),
      false,
    );
    assert.throws(
      () =>
        assertEmployerDocumentTypeForAccount(
          "consultancy",
          "certificate-of-incorporation",
        ),
      /business verification document/,
    );
  });

  it("allows identity cards for individual accounts", () => {
    assert.doesNotThrow(() =>
      assertEmployerDocumentTypeForAccount("individual", "aadhaar"),
    );
    assert.throws(
      () =>
        assertEmployerDocumentTypeForAccount(
          "individual",
          "gst-certificate",
        ),
      /identity document/,
    );
  });

  it("formats stored document type keys for display", () => {
    assert.equal(
      formatEmployerDocumentTypeLabel("gst-certificate"),
      "Gst Certificate",
    );
    assert.equal(
      formatEmployerDocumentTypeLabel("certificate_of_incorporation"),
      "Certificate Of Incorporation",
    );
  });
});
