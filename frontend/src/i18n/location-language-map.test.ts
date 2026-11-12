import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { languageCodeForRegion } from "./location-language-map";

describe("location language mapping", () => {
  it("maps Andhra Pradesh and Telangana to Telugu", () => {
    assert.equal(
      languageCodeForRegion({
        countryCode: "IN",
        state: "Andhra Pradesh",
        stateCode: "IN-AP",
      }),
      "te",
    );
    assert.equal(
      languageCodeForRegion({ countryCode: "in", state: "Telangana", stateCode: "IN-TS" }),
      "te",
    );
    assert.equal(
      languageCodeForRegion({ country: "India", state: "Telengana", stateCode: "IN-TG" }),
      "te",
    );
  });

  it("maps Tamil Nadu to Tamil", () => {
    assert.equal(
      languageCodeForRegion({
        countryCode: "IN",
        state: "Tamil Nadu.",
        stateCode: "IN-TN",
      }),
      "ta",
    );
    assert.equal(languageCodeForRegion({ country: "India", state: "Tamilnadu" }), "ta");
  });

  it("maps Karnataka to Kannada", () => {
    assert.equal(
      languageCodeForRegion({ countryCode: "IN", state: "Karnataka", stateCode: "KA" }),
      "kn",
    );
  });

  it("maps Kerala to Malayalam", () => {
    assert.equal(
      languageCodeForRegion({ countryCode: "IN", state: "Kerala", stateCode: "IN-KL" }),
      "ml",
    );
  });

  it("maps Hindi-official states to Hindi", () => {
    for (const state of [
      "Uttar Pradesh",
      "Bihar",
      "Madhya Pradesh",
      "Rajasthan",
      "Haryana",
      "Himachal Pradesh",
      "Uttarakhand",
      "Jharkhand",
      "Chhattisgarh",
      "Delhi",
      "Chandigarh",
    ]) {
      assert.equal(languageCodeForRegion({ countryCode: "IN", state }), "hi", state);
    }
    assert.equal(
      languageCodeForRegion({
        country: "India",
        state: "National Capital Territory of Delhi",
      }),
      "hi",
    );
    assert.equal(
      languageCodeForRegion({ countryCode: "IN", state: "Jammu & Kashmir" }),
      "hi",
    );
    assert.equal(
      languageCodeForRegion({ countryCode: "IN", state: "Chattisgarh" }),
      "hi",
    );
  });

  it("uses English for Indian states without a supported language", () => {
    for (const state of ["Maharashtra", "Gujarat", "West Bengal", "Odisha", "Punjab", "Goa"]) {
      assert.equal(languageCodeForRegion({ countryCode: "IN", state }), null, state);
    }
  });

  it("uses English outside India even when a state name matches", () => {
    assert.equal(
      languageCodeForRegion({
        countryCode: "US",
        country: "United States",
        state: "California",
        stateCode: "US-CA",
      }),
      null,
    );
    assert.equal(
      languageCodeForRegion({ countryCode: "US", state: "Tamil Nadu", stateCode: "IN-TN" }),
      null,
    );
    assert.equal(
      languageCodeForRegion({ country: "United Kingdom", state: "Kerala" }),
      null,
    );
  });

  it("uses English when the state is missing", () => {
    assert.equal(languageCodeForRegion({ countryCode: "IN", country: "India" }), null);
    assert.equal(languageCodeForRegion({}), null);
  });
});
