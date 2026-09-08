import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import { buildValidationErrorFromZodIssues } from "./validate.middleware.js";

describe("buildValidationErrorFromZodIssues", () => {
  it("uses the first issue message when there is a single issue", () => {
    const result = z
      .object({
        whatsappNumber: z
          .string()
          .regex(/^\d{10}$/, "WhatsApp number must be exactly 10 digits"),
      })
      .safeParse({ whatsappNumber: "123" });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }

    const payload = buildValidationErrorFromZodIssues(result.error.issues);

    assert.equal(
      payload.message,
      "WhatsApp number must be exactly 10 digits",
    );
    assert.equal(payload.details.code, "VALIDATION_ERROR");
    assert.deepEqual(payload.details.fieldErrors, {
      whatsappNumber: "WhatsApp number must be exactly 10 digits",
    });
    assert.deepEqual(payload.details.issues, [
      {
        path: "whatsappNumber",
        message: "WhatsApp number must be exactly 10 digits",
      },
    ]);
  });

  it("uses a summary message and fieldErrors for multiple issues", () => {
    const result = z
      .object({
        firstName: z.string().trim().min(1, "First name is required"),
        lastName: z.string().trim().min(1, "Last name is required"),
      })
      .safeParse({ firstName: "", lastName: "" });

    assert.equal(result.success, false);
    if (result.success) {
      return;
    }

    const payload = buildValidationErrorFromZodIssues(result.error.issues);

    assert.equal(payload.message, "Please correct the highlighted fields.");
    assert.equal(payload.details.fieldErrors.firstName, "First name is required");
    assert.equal(payload.details.fieldErrors.lastName, "Last name is required");
    assert.ok(payload.details.issues.length >= 2);
  });

  it("joins nested paths with dots and maps empty path to _form", () => {
    const nested = buildValidationErrorFromZodIssues([
      {
        path: ["socialLinks", "linkedin"],
        message: "Invalid LinkedIn URL",
      },
      {
        path: [],
        message: "Form is invalid",
      },
    ]);

    assert.deepEqual(nested.details.fieldErrors, {
      "socialLinks.linkedin": "Invalid LinkedIn URL",
      _form: "Form is invalid",
    });
    assert.equal(nested.message, "Please correct the highlighted fields.");
  });

  it("keeps the first message when the same field has multiple issues", () => {
    const payload = buildValidationErrorFromZodIssues([
      { path: ["emailAddress"], message: "Email is required" },
      { path: ["emailAddress"], message: "Please enter a valid email address." },
    ]);

    assert.equal(
      payload.details.fieldErrors.emailAddress,
      "Email is required",
    );
    assert.equal(payload.details.issues.length, 2);
  });
});
