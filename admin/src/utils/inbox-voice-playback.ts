type StopHandler = () => void;

let activeMessageId: string | null = null;
let activeStop: StopHandler | null = null;

/** Ensures only one inbox voice message plays at a time. */
export function claimInboxVoicePlayback(messageId: string, stop: StopHandler): void {
  if (activeMessageId && activeMessageId !== messageId && activeStop) {
    activeStop();
  }
  activeMessageId = messageId;
  activeStop = stop;
}

export function releaseInboxVoicePlayback(messageId: string): void {
  if (activeMessageId === messageId) {
    activeMessageId = null;
    activeStop = null;
  }
}

export function formatVoiceClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Deterministic decorative waveform heights (0.28–1) from a stable seed. */
export function buildVoiceWaveformBars(seed: string, count = 32): number[] {
  const bars: number[] = [];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  for (let i = 0; i < count; i += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const unit = state / 0xffffffff;
    bars.push(0.28 + unit * 0.72);
  }
  return bars;
}

export function resolveAudioBlobType(
  blob: Blob,
  mediaMimeType: string | undefined,
): string {
  if (blob.type && blob.type !== "application/octet-stream") {
    return blob.type;
  }
  const mime = mediaMimeType?.trim() ?? "";
  if (mime) return mime;
  return "audio/ogg";
}
