import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUTH_VALIDATION_MESSAGES } from "../constants/auth-validation-messages";
import { individualRegistrationDocumentErrors } from "./employer-individual-registration";

describe("individual employer registration documents", () => {
  it("requires a document type and file", () => {
    assert.deepEqual(
      individualRegistrationDocumentErrors({
        documentType: null,
        hasDocumentFile: false,
      }),
      {
        documentType: AUTH_VALIDATION_MESSAGES.DOCUMENT_TYPE_REQUIRED,
        documentFile: AUTH_VALIDATION_MESSAGES.DOCUMENT_REQUIRED,
      },
    );
  });

  it("requires the file after a type is selected", () => {
    assert.deepEqual(
      individualRegistrationDocumentErrors({
        documentType: "aadhaar",
        hasDocumentFile: false,
      }),
      {
        documentFile: AUTH_VALIDATION_MESSAGES.DOCUMENT_REQUIRED,
      },
    );
  });

  it("accepts a selected type and file without asking for a profile photo", () => {
    assert.deepEqual(
      individualRegistrationDocumentErrors({
        documentType: "pan",
        hasDocumentFile: true,
      }),
      {},
    );
  });
});
