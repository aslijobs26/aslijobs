import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  registerJobSeekerSchema,
  updateJobSeekerProfileSchema,
} from "./job-seeker.validation.js";

describe("job seeker preferred language", () => {
  it("saves English and Telugu from website registration", () => {
    const english = registerJobSeekerSchema.parse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
      preferredLanguage: "en",
    });
    assert.equal(english.preferredLanguage, "en");

    const telugu = registerJobSeekerSchema.parse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
      preferredLanguage: "telugu",
    });
    assert.equal(telugu.preferredLanguage, "te");

    const malayalam = registerJobSeekerSchema.parse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
      preferredLanguage: "malayalam",
    });
    assert.equal(malayalam.preferredLanguage, "ml");
  });

  it("omits preferredLanguage when the user did not select one", () => {
    const parsed = registerJobSeekerSchema.parse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
    });
    assert.equal(parsed.preferredLanguage, undefined);
  });

  it("rejects unsupported language codes", () => {
    const result = registerJobSeekerSchema.safeParse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
      preferredLanguage: "fr",
    });
    assert.equal(result.success, false);
  });

  it("accepts Hindi as a stored website preference", () => {
    const parsed = registerJobSeekerSchema.parse({
      fullName: "Ravi Kumar",
      whatsappNumber: "9876543210",
      preferredLanguage: "hi",
    });
    assert.equal(parsed.preferredLanguage, "hi");
  });

  it("updates preferredLanguage on the profile without touching spoken languages", () => {
    const parsed = updateJobSeekerProfileSchema.parse({
      preferredLanguage: "te",
    });
    assert.equal(parsed.preferredLanguage, "te");
    assert.equal(parsed.languages, undefined);
  });
});
