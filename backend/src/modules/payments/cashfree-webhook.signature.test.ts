import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";
import {
  computeCashfreeWebhookSignature,
  hashWebhookPayload,
  verifyCashfreeWebhookSignature,
} from "./cashfree-webhook.signature.js";

const SECRET = "cf-test-secret-key";
const TIMESTAMP = "1763280000000";
const RAW = Buffer.from(
  JSON.stringify({
    data: { order: { order_id: "AJ_TEST_1", order_amount: 299 } },
    type: "PAYMENT_SUCCESS_WEBHOOK",
  }),
);

describe("Cashfree webhook signature", () => {
  it("matches the documented formula base64(HMAC_SHA256(timestamp + body))", () => {
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(TIMESTAMP + RAW.toString("utf8"))
      .digest("base64");
    assert.equal(
      computeCashfreeWebhookSignature({ timestamp: TIMESTAMP, rawBody: RAW, secretKey: SECRET }),
      expected,
    );
  });

  it("accepts a correctly signed payload", () => {
    const signature = computeCashfreeWebhookSignature({
      timestamp: TIMESTAMP,
      rawBody: RAW,
      secretKey: SECRET,
    });
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: TIMESTAMP, rawBody: RAW, secretKey: SECRET }),
      true,
    );
  });

  it("rejects a tampered body", () => {
    const signature = computeCashfreeWebhookSignature({
      timestamp: TIMESTAMP,
      rawBody: RAW,
      secretKey: SECRET,
    });
    const tampered = Buffer.from(RAW.toString("utf8").replace("299", "1"));
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: TIMESTAMP, rawBody: tampered, secretKey: SECRET }),
      false,
    );
  });

  it("rejects a changed timestamp, wrong secret, and missing inputs", () => {
    const signature = computeCashfreeWebhookSignature({
      timestamp: TIMESTAMP,
      rawBody: RAW,
      secretKey: SECRET,
    });
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: "1763280000001", rawBody: RAW, secretKey: SECRET }),
      false,
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: TIMESTAMP, rawBody: RAW, secretKey: "other" }),
      false,
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ signature: "", timestamp: TIMESTAMP, rawBody: RAW, secretKey: SECRET }),
      false,
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: TIMESTAMP, rawBody: undefined, secretKey: SECRET }),
      false,
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ signature, timestamp: TIMESTAMP, rawBody: RAW, secretKey: "" }),
      false,
    );
    assert.equal(
      verifyCashfreeWebhookSignature({ signature: "short", timestamp: TIMESTAMP, rawBody: RAW, secretKey: SECRET }),
      false,
    );
  });

  it("hashes identical payloads identically for dedupe", () => {
    assert.equal(hashWebhookPayload(RAW), hashWebhookPayload(Buffer.from(RAW)));
    assert.notEqual(hashWebhookPayload(RAW), hashWebhookPayload(Buffer.from("{}")));
  });
});
