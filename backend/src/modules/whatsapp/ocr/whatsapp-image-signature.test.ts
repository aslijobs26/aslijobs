import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  declaredMimeMatchesImage,
  detectImageKind,
  readImageDimensions,
} from "./whatsapp-image-signature.js";

describe("image signature detection", () => {
  it("detects JPEG / PNG / WEBP magic bytes", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    assert.equal(detectImageKind(jpeg), "jpeg");

    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 10, 0, 0, 0, 20,
    ]);
    assert.equal(detectImageKind(png), "png");

    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0);
    webp.write("WEBP", 8);
    assert.equal(detectImageKind(webp), "webp");

    assert.equal(detectImageKind(Buffer.from("%PDF")), null);
  });

  it("rejects MIME spoofing when magic does not match", () => {
    assert.equal(declaredMimeMatchesImage("image/png", "jpeg"), false);
    assert.equal(declaredMimeMatchesImage("image/jpeg", "jpeg"), true);
    assert.equal(declaredMimeMatchesImage("application/octet-stream", "jpeg"), true);
  });

  it("reads PNG dimensions", () => {
    const png = Buffer.alloc(24);
    png[0] = 0x89;
    png[1] = 0x50;
    png[2] = 0x4e;
    png[3] = 0x47;
    png.writeUInt32BE(320, 16);
    png.writeUInt32BE(240, 20);
    assert.deepEqual(readImageDimensions(png, "png"), { width: 320, height: 240 });
  });
});
