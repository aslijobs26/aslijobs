import assert from "node:assert/strict";
import test from "node:test";
import { aggregatePublishedVideos } from "./video.service.js";

const publishedAt = new Date("2026-11-26T10:00:00.000Z");

function standalone(overrides: Record<string, unknown> = {}) {
  return {
    _id: "video-id",
    title: "Video",
    description: "",
    source: "uploaded",
    youtubeUrl: "",
    youtubeVideoId: "",
    thumbnailUrl: "",
    uploadedVideo: null,
    category: "",
    status: "published",
    isFeatured: false,
    displayOrder: 0,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    ...overrides,
  };
}

function blogVideo(overrides: Record<string, unknown> = {}) {
  return {
    _id: "blog-id",
    title: "Blog",
    excerpt: "",
    status: "published",
    isFeatured: false,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    associatedVideo: {
      source: "uploaded",
      title: "Blog video",
      description: "",
      youtubeUrl: "",
      youtubeVideoId: "",
      thumbnailUrl: "",
      videoFile: null,
    },
    ...overrides,
  };
}

test("published aggregation includes uploaded MP4/WebM without YouTube IDs", () => {
  const mp4Url = "https://cdn.example.com/videos/hiring.mp4";
  const webmUrl = "https://cdn.example.com/videos/careers.webm";
  const result = aggregatePublishedVideos([
    standalone({
      _id: "youtube-id",
      title: "YouTube video",
      source: "youtube",
      youtubeVideoId: "dQw4w9WgXcQ",
      thumbnailUrl: "https://cdn.example.com/youtube.jpg",
    }),
    standalone({
      _id: "mp4-id",
      title: "MP4 upload",
      uploadedVideo: { url: mp4Url, mimeType: "video/mp4", fileSize: 1024 },
      thumbnailUrl: mp4Url,
    }),
    standalone({
      _id: "webm-id",
      title: "WebM upload",
      uploadedVideo: { url: webmUrl, mimeType: "video/webm", fileSize: 512 },
    }),
    standalone({ _id: "missing-url", uploadedVideo: null }),
  ], [], 12);

  assert.deepEqual(result.map((video) => video.title), [
    "YouTube video",
    "MP4 upload",
    "WebM upload",
  ]);
  assert.equal(result[1].source, "uploaded");
  assert.equal(result[1].youtubeVideoId, "");
  assert.equal(result[1].uploadedVideo.mimeType, "video/mp4");
  assert.equal(result[1].thumbnailUrl, "");
  assert.equal(result[2].uploadedVideo.mimeType, "video/webm");
});

test("blog videos keep custom thumbnails and deduplicate matching uploads and YouTube IDs", () => {
  const sharedUploadedUrl = "https://cdn.example.com/videos/shared.mp4";
  const standaloneYoutube = standalone({
    _id: "youtube-id",
    source: "youtube",
    youtubeVideoId: "dQw4w9WgXcQ",
  });
  const standaloneUpload = standalone({
    _id: "upload-id",
    uploadedVideo: { url: sharedUploadedUrl, mimeType: "video/mp4" },
  });
  const blogYoutube = blogVideo({
    _id: "youtube-blog",
    associatedVideo: {
      source: "youtube",
      youtubeVideoId: "dQw4w9WgXcQ",
      videoFile: null,
    },
  });
  const blogDuplicateUpload = blogVideo({
    _id: "duplicate-blog",
    associatedVideo: {
      source: "uploaded",
      videoFile: { url: sharedUploadedUrl, mimeType: "video/mp4" },
    },
  });
  const blogCustomThumbnail = blogVideo({
    _id: "custom-thumbnail-blog",
    associatedVideo: {
      source: "uploaded",
      thumbnailUrl: "https://cdn.example.com/thumbnails/careers.jpg",
      videoFile: { url: "https://cdn.example.com/videos/careers.webm", mimeType: "video/webm" },
    },
  });

  const result = aggregatePublishedVideos(
    [standaloneYoutube, standaloneUpload],
    [blogYoutube, blogDuplicateUpload, blogCustomThumbnail],
    12,
  );

  assert.equal(result.length, 3);
  assert.equal(result.filter((video) => video.source === "youtube").length, 1);
  assert.equal(result.filter((video) => video.uploadedVideo?.url === sharedUploadedUrl).length, 1);
  const blogUpload = result.find((video) => video.id === "blog-custom-thumbnail-blog");
  assert.equal(blogUpload?.uploadedVideo?.mimeType, "video/webm");
  assert.equal(blogUpload?.thumbnailUrl, "https://cdn.example.com/thumbnails/careers.jpg");
});
