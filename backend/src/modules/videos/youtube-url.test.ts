import assert from "node:assert/strict";
import test from "node:test";
import { videoWriteSchema } from "./video.validation.js";
import { extractYouTubeVideoId } from "./youtube-url.js";

test("extracts IDs from supported YouTube URL formats", () => {
  const expected = "dQw4w9WgXcQ";
  assert.equal(extractYouTubeVideoId(`https://www.youtube.com/watch?v=${expected}`), expected);
  assert.equal(extractYouTubeVideoId(`https://youtu.be/${expected}`), expected);
  assert.equal(extractYouTubeVideoId(`https://m.youtube.com/shorts/${expected}`), expected);
  assert.equal(extractYouTubeVideoId(`https://youtube.com/embed/${expected}`), expected);
});

test("rejects malformed or non-YouTube URLs", () => {
  assert.equal(extractYouTubeVideoId("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ"), "");
  assert.equal(extractYouTubeVideoId("https://youtube.com/watch?v=short"), "");
});

test("validates a YouTube URL without requiring the client to provide a video ID", () => {
  const result = videoWriteSchema.safeParse({
    title: "Test video",
    source: "youtube",
    youtubeUrl: "https://youtu.be/dQw4w9WgXcQ",
  });
  assert.equal(result.success, true);
});

test("validates uploaded MP4 and WebM payloads without YouTube fields", () => {
  for (const mimeType of ["video/mp4", "video/webm"]) {
    const result = videoWriteSchema.safeParse({
      title: "Uploaded video",
      source: "uploaded",
      status: "published",
      uploadedVideo: {
        url: `https://cdn.example.com/video.${mimeType === "video/mp4" ? "mp4" : "webm"}`,
        mimeType,
      },
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.source, "uploaded");
      assert.equal(result.data.youtubeVideoId, "");
      assert.equal(result.data.uploadedVideo?.mimeType, mimeType);
    }
  }
});

test("rejects uploaded videos without a stored public URL", () => {
  const result = videoWriteSchema.safeParse({
    title: "Missing upload",
    source: "uploaded",
    status: "published",
  });
  assert.equal(result.success, false);
});
