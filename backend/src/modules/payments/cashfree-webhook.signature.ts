import crypto from "node:crypto";

/**
 * Cashfree PG webhook signature:
 *   base64( HMAC-SHA256( x-webhook-timestamp + rawBody, secretKey ) )
 *
 * Must be computed over the exact raw bytes Cashfree sent, never a
 * re-serialized JSON object.
 */
export function computeCashfreeWebhookSignature(input: {
  timestamp: string;
  rawBody: Buffer | string;
  secretKey: string;
}): string {
  const body =
    typeof input.rawBody === "string" ? input.rawBody : input.rawBody.toString("utf8");
  return crypto
    .createHmac("sha256", input.secretKey)
    .update(input.timestamp + body)
    .digest("base64");
}

export function verifyCashfreeWebhookSignature(input: {
  signature: string | undefined | null;
  timestamp: string | undefined | null;
  rawBody: Buffer | string | undefined | null;
  secretKey: string;
}): boolean {
  const signature = String(input.signature ?? "").trim();
  const timestamp = String(input.timestamp ?? "").trim();
  if (!signature || !timestamp || input.rawBody == null || !input.secretKey) {
    return false;
  }

  const expected = computeCashfreeWebhookSignature({
    timestamp,
    rawBody: input.rawBody,
    secretKey: input.secretKey,
  });

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function hashWebhookPayload(rawBody: Buffer | string): string {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
