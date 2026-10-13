import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUTH_VALIDATION_MESSAGES } from "../constants/auth-validation-messages";
import {
  employerOtherIndustryFieldErrors,
  resolveEmployerRegistrationIndustry,
} from "./employer-other-industry";

describe("employer other industry", () => {
  it("requires a typed industry and business category when Other is selected", () => {
    const errors = employerOtherIndustryFieldErrors({
      industry: "other",
      customIndustry: "  ",
      businessCategory: "",
    });

    assert.equal(errors.customIndustry, AUTH_VALIDATION_MESSAGES.INDUSTRY_REQUIRED);
    assert.equal(
      errors.businessCategory,
      AUTH_VALIDATION_MESSAGES.BUSINESS_CATEGORY_REQUIRED,
    );
  });

  it("accepts typed industry and category text for Other", () => {
    const errors = employerOtherIndustryFieldErrors({
      industry: "other",
      customIndustry: "Printing",
      businessCategory: "Packaging",
    });

    assert.deepEqual(errors, {});
    assert.equal(
      resolveEmployerRegistrationIndustry({
        industry: "other",
        customIndustry: "  Printing  ",
      }),
      "Printing",
    );
  });

  it("keeps a listed industry value and does not require custom text", () => {
    const errors = employerOtherIndustryFieldErrors({
      industry: "retail-stores",
      customIndustry: "",
      businessCategory: "",
    });

    assert.deepEqual(errors, {});
    assert.equal(
      resolveEmployerRegistrationIndustry({
        industry: "retail-stores",
        customIndustry: "Ignored",
      }),
      "retail-stores",
    );
  });
});
