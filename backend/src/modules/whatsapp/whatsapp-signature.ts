import { createHmac, timingSafeEqual } from "node:crypto";

export type VerifyWhatsAppSignatureOptions = {
  /**
   * When true, an empty Meta app secret never bypasses verification.
   * Controllers should pass true unless WHATSAPP_ALLOW_UNSIGNED_WEBHOOKS is set for local tooling.
   */
  requireSecret?: boolean;
};

/**
 * Validates Meta `X-Hub-Signature-256` against the raw request body.
 * Empty secret + requireSecret=false → allow (explicit local opt-in only).
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
