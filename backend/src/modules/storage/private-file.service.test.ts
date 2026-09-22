import assert from "node:assert/strict";
import { mock, describe, it } from "node:test";
import { AppError } from "../../middleware/error.middleware.js";
import { readPrivateFileBuffer } from "./private-file.service.js";

describe("readPrivateFileBuffer", () => {
  it("fetches Cloudinary assets via secure URL instead of treating public_id as a local path", async () => {
    const imageBytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const fetchMock = mock.method(globalThis, "fetch", async () => {
      return new Response(imageBytes, {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      });
    });

    try {
      const result = await readPrivateFileBuffer({
        storagePath: "aslijobs/job-seekers/abc/profile/profile-photo-1",
        storageProvider: "cloudinary",
        publicId: "aslijobs/job-seekers/abc/profile/profile-photo-1",
        url: "https://res.cloudinary.com/demo/image/upload/v1/aslijobs/job-seekers/abc/profile/profile-photo-1.jpg",
        mimeType: "image/jpeg",
        originalName: "profile-photo.jpg",
      });

      assert.equal(result.mimeType, "image/jpeg");
      assert.equal(result.fileName, "profile-photo.jpg");
      assert.deepEqual(result.buffer, imageBytes);
      assert.equal(fetchMock.mock.callCount(), 1);
    } finally {
      fetchMock.mock.restore();
    }
  });

  it("does not resolve Cloudinary public_id against the local uploads directory", async () => {
    await assert.rejects(
      () =>
        readPrivateFileBuffer({
          storagePath: "aslijobs/job-seekers/abc/profile/profile-photo-1",
          storageProvider: "cloudinary",
          publicId: "aslijobs/job-seekers/abc/profile/profile-photo-1",
          url: "",
          mimeType: "image/jpeg",
          originalName: "profile-photo.jpg",
        }),
      (error: unknown) =>
        error instanceof AppError && error.message === "File not found",
    );
  });
});
