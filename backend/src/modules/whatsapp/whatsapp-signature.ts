import { createHmac, timingSafeEqual } from "node:crypto";

export type VerifyWhatsAppSignatureOptions = {
  /**
   * When true (production), an empty Meta app secret never bypasses verification.
   * Local/dev may leave the secret empty so unsigned local webhook tests still work.
   */
  requireSecret?: boolean;
};

/**
 * Validates Meta `X-Hub-Signature-256` against the raw request body.
 * Empty secret + requireSecret=false → allow (local only).
 * Empty secret + requireSecret=true → reject.
 */
export function verifyWhatsAppSignature(
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
  appSecret: string,
  options: VerifyWhatsAppSignatureOptions = {},
): boolean {
  const secret = appSecret.trim();
  if (!secret) {
    return options.requireSecret !== true;
  }
  if (!rawBody || !signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length).trim();
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(received, "utf8");
  if (expectedBuf.length !== receivedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, receivedBuf);
}
