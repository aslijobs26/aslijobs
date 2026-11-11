import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SITE_URL, resolveSiteUrl } from "./site-url";

describe("resolveSiteUrl", () => {
  it("defaults to the canonical production origin", () => {
    assert.equal(DEFAULT_SITE_URL, "https://www.aslijobs.com");
    assert.equal(resolveSiteUrl(undefined), DEFAULT_SITE_URL);
    assert.equal(resolveSiteUrl("   "), DEFAULT_SITE_URL);
  });

  it("keeps a configured https origin without path or trailing slash", () => {
    assert.equal(
      resolveSiteUrl("https://www.aslijobs.com/"),
      "https://www.aslijobs.com",
    );
    assert.equal(
      resolveSiteUrl(" https://aslijobs.com/jobs?x=1 "),
      "https://aslijobs.com",
    );
  });

  it("never emits localhost, LAN, preview or insecure origins", () => {
    for (const value of [
      "http://localhost:3000",
      "https://localhost",
      "http://192.168.1.20:3000",
      "https://aslijobs-git-feature-team.vercel.app",
      "https://aslijobs-backend.onrender.com",
      "http://www.aslijobs.com",
      "not a url",
    ]) {
      assert.equal(resolveSiteUrl(value), DEFAULT_SITE_URL, value);
    }
  });
});
