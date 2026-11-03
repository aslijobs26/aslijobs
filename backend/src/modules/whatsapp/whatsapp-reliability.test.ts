import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import {
  classifyWhatsAppTemplateFailure,
  parseWhatsAppRetryAfterMs,
  WhatsAppTemplateDeliveryError,
} from "./whatsapp.service.js";
import {
  isBullMqDuplicateJobError,
  withQueueEnqueueTimeout,
} from "./whatsapp-redis.js";
describe("WhatsApp reliability — Redis enqueue timeout", () => {
  it("rejects a stalled enqueue so inline fallback can run", async () => {
    await assert.rejects(
      () =>
        withQueueEnqueueTimeout(
          new Promise(() => {
            /* never settles */
          }),
          30,
        ),
      /WhatsAppQueueEnqueueTimeout/,
    );
  });

  it("resolves when the enqueue finishes before the timeout", async () => {
    const value = await withQueueEnqueueTimeout(Promise.resolve("queued"), 200);
    assert.equal(value, "queued");
  });
});

describe("WhatsApp reliability — duplicate job error matching", () => {
  it("matches BullMQ duplicate wording narrowly", () => {
    assert.equal(
      isBullMqDuplicateJobError(new Error("Job 123 already exists")),
      true,
    );
    assert.equal(
      isBullMqDuplicateJobError(new Error("Duplicated job")),
      true,
    );
  });

  it("does not treat unrelated jobid/duplicate text as a benign duplicate", () => {
    assert.equal(
      isBullMqDuplicateJobError(new Error("JobId cannot be '0'")),
      false,
    );
    assert.equal(
      isBullMqDuplicateJobError(new Error("duplicate key error on mongo")),
      false,
    );
  });
});

describe("WhatsApp reliability — Graph Retry-After and failure classes", () => {
  it("parses Retry-After seconds and HTTP-date", () => {
    assert.equal(parseWhatsAppRetryAfterMs("5"), 5_000);
    assert.equal(parseWhatsAppRetryAfterMs("0"), 0);
    assert.equal(parseWhatsAppRetryAfterMs(""), 0);
    const future = new Date(Date.now() + 8_000).toUTCString();
    const ms = parseWhatsAppRetryAfterMs(future);
    assert.ok(ms >= 6_000 && ms <= 10_000);
  });

  it("classifies 429/5xx as retryable and timeouts as ambiguous", () => {
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 429 }),
      "retryable",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 503 }),
      "retryable",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 0, timedOut: true }),
      "ambiguous",
    );
    assert.equal(
      classifyWhatsAppTemplateFailure({ status: 400, metaCode: 132001 }),
      "permanent",
    );
  });

  it("stores retryAfterMs on delivery errors", () => {
    const error = new WhatsAppTemplateDeliveryError({
      status: 429,
      retryAfterMs: 7_000,
      failureClass: "retryable",
    });
    assert.equal(error.retryAfterMs, 7_000);
    assert.equal(error.failureClass, "retryable");
  });
});

describe("WhatsApp reliability — translation fallback preserves facts", () => {
  it("falls back to the verified draft instead of serviceErrorCopy on translate failure", () => {
    const source = readFileSync(
      new URL("./sarvam-translate.client.ts", import.meta.url),
      "utf8",
    );
    const start = source.indexOf("if (localized.failed)");
    assert.ok(start > 0);
    const slice = source.slice(start, start + 400);
    assert.match(slice, /restoreProperNouns\(protectedText\.text/);
    assert.doesNotMatch(slice, /serviceErrorCopy\(input\.language\)/);
  });
});

describe("WhatsApp reliability — architecture guards", () => {
  it("uses a fail-fast producer Redis and claim release on route failure", () => {
    const redisSource = readFileSync(
      new URL("./whatsapp-redis.ts", import.meta.url),
      "utf8",
    );
    assert.match(redisSource, /enableOfflineQueue:\s*false/);
    assert.match(redisSource, /maxRetriesPerRequest:\s*1/);

    const inbound = readFileSync(
      new URL("./whatsapp-inbound.queue.ts", import.meta.url),
      "utf8",
    );
    assert.match(inbound, /openWhatsAppProducerRedis/);
    assert.match(inbound, /withQueueEnqueueTimeout/);
    assert.match(inbound, /handleConversationalMessage/);

    const webhook = readFileSync(
      new URL("./whatsapp-webhook.controller.ts", import.meta.url),
      "utf8",
    );
    assert.match(webhook, /releaseWhatsAppEvent/);
    assert.match(webhook, /route_failed/);

    const bot = readFileSync(
      new URL("./whatsapp-bot.service.ts", import.meta.url),
      "utf8",
    );
    assert.match(bot, /REPLY_FAILED/);
    assert.match(bot, /sendBotTextMessage/);
    assert.match(bot, /WhatsAppSendRetryable/);

    const notification = readFileSync(
      new URL("./notifications/whatsapp-notification.queue.ts", import.meta.url),
      "utf8",
    );
    assert.match(notification, /activeQueue\.remove\(jobId\)/);
    assert.match(notification, /openWhatsAppProducerRedis/);
  });

  it("exports claim release for enqueue failure recovery", () => {
    const processed = readFileSync(
      new URL("./whatsapp-processed-event.model.ts", import.meta.url),
      "utf8",
    );
    assert.match(processed, /export async function releaseWhatsAppEvent/);
  });
});
