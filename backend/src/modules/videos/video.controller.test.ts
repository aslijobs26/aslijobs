import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import type { Request, Response } from "express";
import { videoController } from "./video.controller.js";
import { storageService } from "../storage/storage.service.js";
import { getPublicMediaOrigin } from "../storage/public-media-url.js";
import type { StoredFileResult } from "../storage/storage.types.js";

afterEach(() => {
  mock.restoreAll();
});

test("video upload response returns a public URL and preserves MIME metadata", async () => {
  const stored: StoredFileResult = {
    storedName: "video-test.mp4",
    storagePath: "uploads/videos/video-test.mp4",
    storageProvider: "local",
    url: "/uploads/videos/video-test.mp4",
    mimeType: "video/mp4",
    fileSize: 1024,
    originalName: "video-test.mp4",
  };
  mock.method(storageService, "upload", async () => stored);

  const responseBody: { data?: Record<string, unknown> } = {};
  const response = {
    status() {
      return this;
    },
    json(body: { data?: Record<string, unknown> }) {
      Object.assign(responseBody, body);
      return this;
    },
  } as unknown as Response;
  const request = {
    file: {
      buffer: Buffer.from("video"),
      originalname: "video-test.mp4",
      mimetype: "video/mp4",
    },
  } as unknown as Request;

  await videoController.upload(request, response);

  assert.equal(responseBody.data?.url, `${getPublicMediaOrigin()}/uploads/videos/video-test.mp4`);
  assert.equal(responseBody.data?.mimeType, "video/mp4");
  assert.equal(responseBody.data?.storageProvider, "local");
});
