import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveCloudinaryDeliveryUrlForPublicUpload,
  resolveExistingCloudinaryDeliveryUrlForPublicUpload,
} from "./cloudinary-public-uploads.js";

describe("resolveCloudinaryDeliveryUrlForPublicUpload", () => {
  it("returns null for sensitive upload prefixes", () => {
    assert.equal(
      resolveCloudinaryDeliveryUrlForPublicUpload("/resumes/secret.pdf"),
      null,
    );
    assert.equal(
      resolveCloudinaryDeliveryUrlForPublicUpload(
        "/employer-documents/gst.pdf",
      ),
      null,
    );
    assert.equal(
      resolveCloudinaryDeliveryUrlForPublicUpload(
        "/job-seekers/abc/profile/photo.jpg",
      ),
      null,
    );
  });

  it("returns null for invalid or extension-less paths", () => {
    assert.equal(resolveCloudinaryDeliveryUrlForPublicUpload("/"), null);
    assert.equal(
      resolveCloudinaryDeliveryUrlForPublicUpload("/employer-logos"),
      null,
    );
    assert.equal(
      resolveCloudinaryDeliveryUrlForPublicUpload(
        "/employer-logos/no-extension",
      ),
      null,
    );
  });

  it("builds a secure Cloudinary image URL when credentials are configured", () => {
    const url = resolveCloudinaryDeliveryUrlForPublicUpload(
      "/employer-logos/company-logo-1788763381176-31e6891a.png?v=1",
    );

    if (!url) {
      // Credentials may be empty in CI — skip delivery assertion.
      return;
    }

    assert.match(url, /^https:\/\/res\.cloudinary\.com\//);
    assert.match(url, /employer-logos\/company-logo-1788763381176-31e6891a/);
  });

  it("does not claim missing Cloudinary assets exist", async () => {
    const existing = await resolveExistingCloudinaryDeliveryUrlForPublicUpload(
      "/employer-logos/company-logo-1788763381176-31e6891a.png",
    );
    // This basename is only a local orphan in aslijobs_test — not on Cloudinary.
    assert.equal(existing, null);
  });
});
