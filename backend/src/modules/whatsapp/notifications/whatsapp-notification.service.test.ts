import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { WhatsAppNotificationDispatchModel } from "./whatsapp-notification.model.js";
import * as notificationQueue from "./whatsapp-notification.queue.js";
import {
  enqueueWhatsAppNotification,
  scheduleWhatsAppNotification,
} from "./whatsapp-notification.service.js";
import { WhatsAppService } from "../whatsapp.service.js";

const payload = {
  event: "EMPLOYER_ACCOUNT_CREATED" as const,
  entityId: "64f000000000000000000001",
  phoneNumber: "9876543210",
  employerName: "Test Employer",
  preferredLanguage: "en",
};

describe("enqueueWhatsAppNotification", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("queues EMPLOYER_ACCOUNT_CREATED exactly once", async () => {
    let claimed = 0;
    const queued: unknown[] = [];
    const first = await enqueueWhatsAppNotification(payload, {
      claim: async () => {
        claimed += 1;
        return "claimed";
      },
      enqueueJob: async (job) => {
        queued.push(job);
      },
    });

    assert.equal(first, "queued");
    assert.equal(claimed, 1);
    assert.equal(queued.length, 1);
    const job = queued[0] as {
      templateName: string;
      bodyParameters: string[];
      urlButtonParameters?: string[];
    };
    assert.equal(job.templateName, "employer_account_created");
    assert.deepEqual(job.bodyParameters, ["Test Employer"]);
    assert.equal(job.urlButtonParameters, undefined);
  });

  it("queues EMPLOYER_ACCOUNT_APPROVED with the approved template, English, and post-job id", async () => {
    const queued: unknown[] = [];
    const result = await enqueueWhatsAppNotification(
      {
        event: "EMPLOYER_ACCOUNT_APPROVED",
        entityId: "6ac746ac72aed3c70a82de5b",
        phoneNumber: payload.phoneNumber,
        employerName: "Acme Pvt Ltd",
        preferredLanguage: "hi",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );

    assert.equal(result, "queued");
    const job = queued[0] as {
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
      urlButtonParameters: string[];
      idempotencyKey: string;
    };
    assert.equal(job.templateName, "aslijobs_account_approved");
    assert.equal(job.languageCode, "en");
    assert.deepEqual(job.bodyParameters, ["Acme Pvt Ltd"]);
    assert.deepEqual(job.urlButtonParameters, ["6ac746ac72aed3c70a82de5b"]);
    assert.equal(
      job.idempotencyKey,
      "EMPLOYER_ACCOUNT_APPROVED:6ac746ac72aed3c70a82de5b",
    );
  });

  it("queues EMPLOYER_PROFILE_COMPLETION_REQUIRED with the approved Meta template", async () => {
    const queued: unknown[] = [];
    const result = await enqueueWhatsAppNotification(
      {
        event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
        entityId: payload.entityId,
        phoneNumber: payload.phoneNumber,
        employerName: "Veeresh",
        preferredLanguage: "en",
      },
      {
        claim: async () => "claimed",
        enqueueJob: async (job) => {
          queued.push(job);
        },
      },
    );

    assert.equal(result, "queued");
    const job = queued[0] as {
      templateName: string;
      languageCode: string;
      bodyParameters: string[];
    };
    assert.equal(job.templateName, "employer_profile_completion_required");
    assert.equal(job.languageCode, "en");
    assert.deepEqual(job.bodyParameters, ["Veeresh"]);
  });

  it("does not queue a duplicate employer registration event", async () => {
    let queued = 0;
    const result = await enqueueWhatsAppNotification(payload, {
      claim: async () => "duplicate",
      enqueueJob: async () => {
        queued += 1;
      },
    });
    assert.equal(result, "skipped_duplicate");
    assert.equal(queued, 0);
  });

  it("does not throw when WhatsApp enqueue fails", async () => {
    mock.method(WhatsAppNotificationDispatchModel, "create", async () => {
      throw new Error("mongo unavailable");
    });

    scheduleWhatsAppNotification(payload);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
});

describe("deliverWhatsAppNotificationJob", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("calls sendTemplateMessage and records the WhatsApp message id", async () => {
    mock.method(
      WhatsAppService.prototype,
      "sendTemplateMessage",
      async () => ({ messageId: "wamid.job", messageStatus: "accepted" }),
    );
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));
    const marked: string[] = [];
    mock.method(
      WhatsAppNotificationDispatchModel,
      "updateOne",
      async (filter: { idempotencyKey?: string }) => {
        marked.push(filter.idempotencyKey ?? "");
        return { acknowledged: true };
      },
    );

    await notificationQueue.deliverWhatsAppNotificationJob({
      event: "EMPLOYER_ACCOUNT_CREATED",
      entityId: payload.entityId,
      phoneNumber: payload.phoneNumber,
      templateName: "employer_account_created",
      languageCode: "en",
      bodyParameters: ["Test Employer"],
      idempotencyKey: `EMPLOYER_ACCOUNT_CREATED:${payload.entityId}`,
    });

    assert.deepEqual(marked, [
      `EMPLOYER_ACCOUNT_CREATED:${payload.entityId}`,
    ]);
  });

  it("does not send again when the dispatch was already marked sent", async () => {
    let sendCount = 0;
    mock.method(
      WhatsAppService.prototype,
      "sendTemplateMessage",
      async () => {
        sendCount += 1;
        return { messageId: "wamid.retry", messageStatus: "accepted" };
      },
    );
    mock.method(
      WhatsAppNotificationDispatchModel,
      "findOne",
      () => ({
        select: () => ({
          lean: async () => ({ _id: "already-sent" }),
        }),
      }),
    );

    await notificationQueue.deliverWhatsAppNotificationJob({
      event: "EMPLOYER_PROFILE_COMPLETION_REQUIRED",
      entityId: payload.entityId,
      phoneNumber: payload.phoneNumber,
      templateName: "employer_profile_completion_required",
      languageCode: "en",
      bodyParameters: ["Test Employer"],
      idempotencyKey: `EMPLOYER_PROFILE_COMPLETION_REQUIRED:${payload.entityId}`,
    });

    assert.equal(sendCount, 0);
  });

  it("retries by throwing on WhatsApp API failure", async () => {
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));
    mock.method(
      WhatsAppService.prototype,
      "sendTemplateMessage",
      async () => {
        throw new Error("WhatsApp template delivery failed");
      },
    );

    await assert.rejects(
      () =>
        notificationQueue.deliverWhatsAppNotificationJob({
          event: "EMPLOYER_ACCOUNT_CREATED",
          entityId: payload.entityId,
          phoneNumber: payload.phoneNumber,
          templateName: "employer_account_created",
          languageCode: "en",
          bodyParameters: ["Test Employer"],
          idempotencyKey: `EMPLOYER_ACCOUNT_CREATED:${payload.entityId}`,
        }),
      /WhatsApp template delivery failed/,
    );
  });
});
