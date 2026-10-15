import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { WhatsAppNotificationDispatchModel } from "./whatsapp-notification.model.js";
import * as notificationQueue from "./whatsapp-notification.queue.js";
import {
  enqueueWhatsAppNotification,
  scheduleWhatsAppNotification,
} from "./whatsapp-notification.service.js";
import {
  WhatsAppService,
  WhatsAppTemplateDeliveryError,
} from "../whatsapp.service.js";

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
        employerName: "ABC Technologies",
        employerProfileType: "company",
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
    assert.deepEqual(job.bodyParameters, ["Company"]);
    assert.equal(job.bodyParameters.includes("ABC Technologies"), false);
    assert.deepEqual(job.urlButtonParameters, ["6ac746ac72aed3c70a82de5b"]);
    assert.equal(
      job.idempotencyKey,
      "EMPLOYER_ACCOUNT_APPROVED:6ac746ac72aed3c70a82de5b",
    );
  });

  it("maps every saved profile type and skips a missing or named value", async () => {
    const cases = [
      { employerProfileType: "consultancy", expected: ["Consultancy"] },
      { employerProfileType: "individual", expected: ["Individual"] },
    ] as const;

    for (const item of cases) {
      const queued: Array<{ bodyParameters: string[] }> = [];
      const result = await enqueueWhatsAppNotification(
        {
          event: "EMPLOYER_ACCOUNT_APPROVED",
          entityId: "6ac746ac72aed3c70a82de5b",
          phoneNumber: payload.phoneNumber,
          employerName: "ABC Technologies",
          employerProfileType: item.employerProfileType,
        },
        {
          claim: async () => "claimed",
          enqueueJob: async (job) => {
            queued.push(job);
          },
        },
      );
      assert.equal(result, "queued");
      assert.deepEqual(queued[0]?.bodyParameters, item.expected);
    }

    let claims = 0;
    const skipped = await enqueueWhatsAppNotification(
      {
        event: "EMPLOYER_ACCOUNT_APPROVED",
        entityId: "6ac746ac72aed3c70a82de5b",
        phoneNumber: payload.phoneNumber,
        employerName: "ABC Technologies",
        employerProfileType: "ABC Technologies",
      },
      {
        claim: async () => {
          claims += 1;
          return "claimed";
        },
        enqueueJob: async () => {
          throw new Error("must not queue");
        },
      },
    );
    assert.equal(skipped, "skipped_unconfigured");
    assert.equal(claims, 0);
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
    const updates: Array<{ status?: string; messageId?: string }> = [];
    mock.method(
      WhatsAppNotificationDispatchModel,
      "updateOne",
      async (
        _filter: { idempotencyKey?: string },
        update: { $set?: { status?: string; messageId?: string } },
      ) => {
        updates.push(update.$set ?? {});
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

    assert.equal(updates[0]?.status, "processing");
    assert.equal(updates.at(-1)?.status, "accepted");
    assert.equal(updates.at(-1)?.messageId, "wamid.job");
  });

  it("forwards a Hindi template and language code without switching language", async () => {
    const sent: Array<{ name: string; language: string; body: string[] }> = [];
    mock.method(
      WhatsAppService.prototype,
      "sendTemplateMessage",
      async (
        _phone: string,
        name: string,
        language: string,
        body: string[],
      ) => {
        sent.push({ name, language, body });
        return { messageId: "wamid.hi", messageStatus: "accepted" };
      },
    );
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));
    mock.method(WhatsAppNotificationDispatchModel, "updateOne", async () => ({
      acknowledged: true,
    }));

    await notificationQueue.deliverWhatsAppNotificationJob({
      event: "JOB_APPLICATION_SUBMITTED",
      entityId: payload.entityId,
      phoneNumber: payload.phoneNumber,
      templateName: "job_application_submitted_hi",
      languageCode: "hi",
      bodyParameters: ["Welder", "Northwind Services"],
      idempotencyKey: `JOB_APPLICATION_SUBMITTED:${payload.entityId}`,
    });

    assert.deepEqual(sent, [
      {
        name: "job_application_submitted_hi",
        language: "hi",
        body: ["Welder", "Northwind Services"],
      },
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
    mock.method(WhatsAppNotificationDispatchModel, "updateOne", async () => ({
      acknowledged: true,
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

  it("does not retry Meta error 132001 or mark it delivered", async () => {
    const updates: Array<{
      status?: string;
      failureClass?: string;
      lastError?: string;
      lastMetaCode?: string;
      messageId?: string;
    }> = [];
    let sends = 0;
    mock.method(WhatsAppNotificationDispatchModel, "findOne", () => ({
      select: () => ({
        lean: async () => null,
      }),
    }));
    mock.method(
      WhatsAppNotificationDispatchModel,
      "updateOne",
      async (
        _filter: unknown,
        update: {
          $set?: {
            status?: string;
            failureClass?: string;
            lastError?: string;
            lastMetaCode?: string;
            messageId?: string;
          };
        },
      ) => {
        updates.push(update.$set ?? {});
        return { acknowledged: true };
      },
    );
    mock.method(WhatsAppService.prototype, "sendTemplateMessage", async () => {
      sends += 1;
      throw new WhatsAppTemplateDeliveryError({
        status: 404,
        metaCode: 132001,
        detail: "Template name does not exist in the translation",
      });
    });

    await notificationQueue.deliverWhatsAppNotificationJob({
      event: "JOBSEEKER_ACCOUNT_CREATED",
      entityId: payload.entityId,
      phoneNumber: payload.phoneNumber,
      templateName: "jobseeker_account_created_te",
      languageCode: "te",
      bodyParameters: [],
      idempotencyKey: `JOBSEEKER_ACCOUNT_CREATED:${payload.entityId}`,
      correlationId: "corr-132001",
    });

    assert.equal(sends, 1);
    assert.equal(updates.at(-1)?.status, "failed");
    assert.equal(updates.at(-1)?.failureClass, "permanent");
    assert.equal(updates.at(-1)?.lastMetaCode, "132001");
    assert.match(updates.at(-1)?.lastError ?? "", /does not exist/);
    assert.notEqual(updates.at(-1)?.status, "delivered");
    assert.equal(updates.at(-1)?.messageId, undefined);
  });
});
