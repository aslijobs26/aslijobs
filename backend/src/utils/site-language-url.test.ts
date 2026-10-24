import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendSiteLanguageQuery,
  parseSiteLanguageQuery,
  SITE_LANGUAGE_QUERY_PARAM,
} from "./site-language-url.js";

describe("site language URL helper", () => {
  it("accepts only supported language codes", () => {
    assert.equal(parseSiteLanguageQuery("te"), "te");
    assert.equal(parseSiteLanguageQuery("telugu"), "te");
    assert.equal(parseSiteLanguageQuery("en"), "en");
    assert.equal(parseSiteLanguageQuery("hi"), "hi");
    assert.equal(parseSiteLanguageQuery("fr"), null);
    assert.equal(parseSiteLanguageQuery("javascript:alert(1)"), null);
    assert.equal(parseSiteLanguageQuery(""), null);
  });

  it("appends lang for English and Telugu job-seeker destinations", () => {
    assert.equal(SITE_LANGUAGE_QUERY_PARAM, "lang");
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1", "en"),
      "https://aslijobs.com/jobs/AJ-1?lang=en",
    );
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1", "te"),
      "https://aslijobs.com/jobs/AJ-1?lang=te",
    );
    assert.equal(
      appendSiteLanguageQuery(
        "https://aslijobs.com/job-seeker/register",
        "telugu",
      ),
      "https://aslijobs.com/job-seeker/register?lang=te",
    );
  });

  it("keeps Hindi website locale and falls back to English for unknown values", () => {
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1?tab=overview", "hi"),
      "https://aslijobs.com/jobs/AJ-1?tab=overview&lang=hi",
    );
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1", "unknown"),
      "https://aslijobs.com/jobs/AJ-1?lang=en",
    );
    assert.equal(appendSiteLanguageQuery("not a url", "te"), "not a url");
  });

  it("replaces an existing lang parameter and preserves hash fragments", () => {
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1?lang=en&ref=wa", "hi"),
      "https://aslijobs.com/jobs/AJ-1?lang=hi&ref=wa",
    );
    assert.equal(
      appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1?lang=te#details", "ta"),
      "https://aslijobs.com/jobs/AJ-1?lang=ta#details",
    );
    for (const code of ["ta", "kn", "ml"] as const) {
      assert.equal(
        appendSiteLanguageQuery("https://aslijobs.com/jobs/AJ-1", code),
        `https://aslijobs.com/jobs/AJ-1?lang=${code}`,
      );
    }
  });
});
