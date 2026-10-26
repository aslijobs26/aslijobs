import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPublicMediaOrigin,
  toPublicMediaUrl,
} from "./public-media-url.js";

describe("toPublicMediaUrl", () => {
  it("returns empty for blank input", () => {
    assert.equal(toPublicMediaUrl(""), "");
    assert.equal(toPublicMediaUrl(null), "");
    assert.equal(toPublicMediaUrl(undefined), "");
    assert.equal(toPublicMediaUrl("   "), "");
  });

  it("passes through absolute http(s) URLs", () => {
    assert.equal(
      toPublicMediaUrl("https://res.cloudinary.com/aslijobs/image/upload/x.png"),
      "https://res.cloudinary.com/aslijobs/image/upload/x.png",
    );
    assert.equal(
      toPublicMediaUrl("http://localhost:5000/uploads/a.png?v=1"),
      "http://localhost:5000/uploads/a.png?v=1",
    );
  });

  it("absolutizes relative /uploads paths against PUBLIC_API_URL origin", () => {
    const origin = getPublicMediaOrigin();
    assert.ok(origin.length > 0);
    assert.equal(
      toPublicMediaUrl("/uploads/employer-logos/logo.png?v=9"),
      `${origin}/uploads/employer-logos/logo.png?v=9`,
    );
    assert.equal(
      toPublicMediaUrl("uploads/employer-logos/logo.png"),
      `${origin}/uploads/employer-logos/logo.png`,
    );
  });

  it("normalizes protocol-relative URLs", () => {
    assert.equal(
      toPublicMediaUrl("//cdn.example.com/a.png"),
      "https://cdn.example.com/a.png",
    );
  });
});
