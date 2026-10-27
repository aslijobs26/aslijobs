import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVoiceWaveformBars,
  formatVoiceClock,
  resolveAudioBlobType,
} from "./inbox-voice-playback.ts";

describe("formatVoiceClock", () => {
  it("formats seconds as m:ss", () => {
    assert.equal(formatVoiceClock(0), "0:00");
    assert.equal(formatVoiceClock(8), "0:08");
    assert.equal(formatVoiceClock(24), "0:24");
    assert.equal(formatVoiceClock(75), "1:15");
  });

  it("guards invalid values", () => {
    assert.equal(formatVoiceClock(Number.NaN), "0:00");
    assert.equal(formatVoiceClock(-3), "0:00");
  });
});

describe("buildVoiceWaveformBars", () => {
  it("returns a stable decorative waveform for a seed", () => {
    const first = buildVoiceWaveformBars("msg-1", 8);
    const second = buildVoiceWaveformBars("msg-1", 8);
    assert.deepEqual(first, second);
    assert.equal(first.length, 8);
    for (const height of first) {
      assert.ok(height >= 0.28 && height <= 1);
    }
  });

  it("varies bars across different seeds", () => {
    const a = buildVoiceWaveformBars("alpha", 12);
    const b = buildVoiceWaveformBars("beta", 12);
    assert.notDeepEqual(a, b);
  });
});

describe("resolveAudioBlobType", () => {
  it("prefers a real blob MIME type", () => {
    const blob = new Blob([new Uint8Array([1])], { type: "audio/mpeg" });
    assert.equal(resolveAudioBlobType(blob, "audio/ogg"), "audio/mpeg");
  });

  it("falls back to stored media MIME when blob type is empty", () => {
    const blob = new Blob([new Uint8Array([1])]);
    assert.equal(
      resolveAudioBlobType(blob, "audio/ogg; codecs=opus"),
      "audio/ogg; codecs=opus",
    );
  });

  it("defaults to audio/ogg when nothing is known", () => {
    const blob = new Blob([new Uint8Array([1])], {
      type: "application/octet-stream",
    });
    assert.equal(resolveAudioBlobType(blob, undefined), "audio/ogg");
  });
});
