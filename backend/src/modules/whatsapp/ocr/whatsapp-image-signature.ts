export type DetectedImageKind = "jpeg" | "png" | "webp" | null;

/**
 * Detect image type from magic bytes. Never trust declared MIME alone.
 */
export function detectImageKind(buffer: Buffer): DetectedImageKind {
  // JPEG FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "jpeg";
  }
  // PNG
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export function imageMimeForKind(kind: DetectedImageKind): string {
  if (kind === "jpeg") return "image/jpeg";
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  return "application/octet-stream";
}

/**
 * Read PNG/JPEG dimensions without a full image decoder.
 * Returns null when dimensions cannot be determined safely.
 */
export function readImageDimensions(
  buffer: Buffer,
  kind: DetectedImageKind,
): { width: number; height: number } | null {
  try {
    if (kind === "png" && buffer.length >= 24) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width > 0 && height > 0) return { width, height };
    }
    if (kind === "jpeg") {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1]!;
        const length = buffer.readUInt16BE(offset + 2);
        // SOF0 / SOF2
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) return { width, height };
          return null;
        }
        offset += 2 + length;
      }
    }
    // WebP VP8 dimensions are more involved; skip strict check (size limit still applies).
  } catch {
    return null;
  }
  return null;
}

export function declaredMimeMatchesImage(
  declaredMime: string,
  kind: DetectedImageKind,
): boolean {
  if (!kind) return false;
  const mime = declaredMime.trim().toLowerCase().split(";")[0] ?? "";
  if (!mime || mime === "application/octet-stream") return true;
  if (kind === "jpeg") return mime === "image/jpeg" || mime === "image/jpg";
  if (kind === "png") return mime === "image/png";
  if (kind === "webp") return mime === "image/webp";
  return false;
}
