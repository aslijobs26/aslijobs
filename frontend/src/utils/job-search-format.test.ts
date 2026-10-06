import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatJobSearchEducation,
  formatJobSearchExperience,
  formatJobSearchJobType,
  formatJobSearchLocation,
  formatJobSearchWorkMode,
} from "./job-search-format";

describe("job search format localization", () => {
  it("localizes employment type with the requested language, not English fallback", () => {
    assert.equal(formatJobSearchJobType("full-time", "en"), "Full Time");
    assert.equal(formatJobSearchJobType("full-time", "te"), "పూర్తి సమయం");
    assert.notEqual(formatJobSearchJobType("full-time", "te"), "Full Time");
    assert.equal(formatJobSearchJobType("full-time", "hi"), "पूर्णकालिक");
  });

  it("localizes structured job details independently of canonical English source", () => {
    assert.equal(formatJobSearchExperience("10_year", "te"), "10+ సంవత్సరాలు");
    assert.equal(formatJobSearchEducation("graduate", "te"), "గ్రాడ్యుయేట్");
    assert.equal(formatJobSearchWorkMode("office", "te"), "ఆఫీస్");
    assert.notEqual(
      formatJobSearchLocation("", "", undefined, undefined, "te"),
      "Location not specified",
    );
    assert.equal(
      formatJobSearchLocation("Hyderabad", "Telangana", undefined, undefined, "te"),
      "Hyderabad, Telangana",
    );
  });
});
