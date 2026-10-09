import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { JobModel } from "./job.model.js";
import { JobTranslationTaskModel } from "./job-translation-task.model.js";
import {
  processJobTranslationTask,
  serveJobDetailTranslation,
} from "./job-translation.queue.js";
import {
  hashJobField,
  hashJobSource,
  type JobContentTranslations,
} from "./job-content-translation.js";

const source = {
  jobTitle: "Driver",
  description: "We are looking for an experienced driver in Hyderabad.",
  interviewInstructions: "Bring a valid licence.",
};

function mockTranslate(calls: { count: number }): typeof fetch {
  return (async (_url, init) => {
    calls.count += 1;
    const body = JSON.parse(String(init?.body ?? "{}")) as { input?: string };
    return new Response(JSON.stringify({ translated_text: `tr:${body.input}` }), {
      status: 200,
    });
  }) as typeof fetch;
}

describe("job translation worker persistence", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("enqueue → worker → Sarvam mock → Mongo persist → subsequent cache hit", async () => {
    const mongoId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();
    const store = {
      _id: mongoId,
      ...source,
      contentLanguage: "en",
      contentTranslations: {} as JobContentTranslations,
      status: "active",
    };
    const task = {
      _id: taskId,
      jobMongoId: mongoId,
      publicJobId: "AJ-2026-000014",
      language: "te",
      sourceHash: hashJobSource(source),
      attempts: 0,
    };

    mock.method(JobModel, "findById", () => ({
      select: async () => store,
    }));
    mock.method(
      JobModel,
      "updateOne",
      async (_filter: unknown, update: { $set?: Record<string, unknown> }) => {
        for (const [key, value] of Object.entries(update.$set ?? {})) {
          if (key.startsWith("contentTranslations.")) {
            const language = key.slice(
              "contentTranslations.".length,
            ) as keyof JobContentTranslations;
            store.contentTranslations[language] = value as JobContentTranslations["te"];
          }
        }
      },
    );

    let taskStatus = "pending";
    mock.method(JobTranslationTaskModel, "findOneAndUpdate", async () => {
      if (taskStatus !== "pending") {
        return null;
      }
      taskStatus = "processing";
      task.attempts += 1;
      return task;
    });
    mock.method(JobTranslationTaskModel, "updateOne", async (_filter: unknown, update: { $set?: { status?: string } }) => {
      if (update.$set?.status) {
        taskStatus = update.$set.status;
      }
    });

    const calls = { count: 0 };
    await processJobTranslationTask(taskId.toString(), mockTranslate(calls));

    assert.equal(calls.count, 3);
    assert.equal(taskStatus, "completed");
    assert.ok(store.contentTranslations.te);
    assert.match(store.contentTranslations.te?.jobTitle ?? "", /^tr:/);
    assert.equal(store.jobTitle, "Driver");

    const secondCalls = { count: 0 };
    taskStatus = "pending";
    await processJobTranslationTask(taskId.toString(), mockTranslate(secondCalls));
    assert.equal(secondCalls.count, 0);
    assert.equal(taskStatus, "completed");
    assert.equal(store.contentTranslations.te?.jobTitle, "tr:Driver");
  });

  it("returns failed instead of pending when the task for this source is exhausted", async () => {
    const mongoId = new mongoose.Types.ObjectId();
    let jobLoads = 0;
    mock.method(JobModel, "findById", () => {
      jobLoads += 1;
      return { select: async () => null };
    });
    mock.method(JobTranslationTaskModel, "findOne", () => ({
      select: async () => ({
        status: "failed",
        attempts: 3,
        nextAttemptAt: new Date(Date.now() - 60_000),
      }),
    }));
    mock.method(JobTranslationTaskModel, "create", async () => {
      throw new Error("exhausted task must not be recreated");
    });

    const served = await serveJobDetailTranslation({
      jobMongoId: mongoId.toString(),
      language: "te",
      job: {
        ...source,
        contentLanguage: "en",
        contentTranslations: {
          te: {
            jobTitle: "టెలిసేల్స్",
            description: "",
            interviewInstructions: "",
            jobTitleHash: hashJobField(source.jobTitle),
            descriptionHash: "",
            interviewInstructionsHash: "",
            status: "partial",
          },
        },
      },
    });

    assert.equal(served.translationStatus, "failed");
    assert.equal(served.isTranslated, false);
    assert.equal(served.language, "te");
    assert.equal(served.sourceLanguage, "en");
    assert.equal(served.content.jobTitle, "టెలిసేల్స్");
    assert.equal(served.content.description, source.description);
    assert.equal(jobLoads, 0);
  });

  it("requeues an eligible failed task without resetting its attempt count", async () => {
    const mongoId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();
    const updates: Array<{ $set?: { attempts?: number; status?: string } }> = [];
    mock.method(JobModel, "findById", () => ({
      select: async () => ({
        _id: mongoId,
        jobId: "AJ-2026-000030",
        status: "active",
        ...source,
        contentLanguage: "en",
        contentTranslations: null,
      }),
    }));
    mock.method(JobTranslationTaskModel, "findOne", () => ({
      select: async () => ({
        _id: taskId,
        status: "failed",
        attempts: 1,
        nextAttemptAt: new Date(Date.now() - 1_000),
      }),
    }));
    mock.method(JobTranslationTaskModel, "findOneAndUpdate", async (_filter: unknown, update: { $set?: { attempts?: number; status?: string } }) => {
      updates.push(update);
      return { _id: taskId, attempts: 1 };
    });
    mock.method(JobTranslationTaskModel, "create", async () => {
      throw new Error("eligible retry must update the existing task");
    });

    const served = await serveJobDetailTranslation({
      jobMongoId: mongoId.toString(),
      language: "te",
      job: {
        ...source,
        contentLanguage: "en",
        contentTranslations: null,
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(served.translationStatus, "pending");
    assert.equal(updates.length, 1);
    assert.equal(updates[0]?.$set?.status, "pending");
    assert.equal(updates[0]?.$set?.attempts, undefined);
  });

  it("does not create a second task when the same detail request is repeated", async () => {
    const mongoId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();
    let created = 0;
    mock.method(JobModel, "findById", () => ({
      select: async () => ({
        _id: mongoId,
        jobId: "AJ-2026-000030",
        status: "active",
        ...source,
        contentLanguage: "en",
        contentTranslations: null,
      }),
    }));
    mock.method(JobTranslationTaskModel, "findOne", () => ({
      select: async () =>
        created === 0
          ? null
          : {
              _id: taskId,
              status: "pending",
              attempts: 0,
              nextAttemptAt: new Date(),
            },
    }));
    mock.method(JobTranslationTaskModel, "create", async () => {
      created += 1;
      return { _id: taskId, attempts: 0 };
    });

    const job = {
      ...source,
      contentLanguage: "en" as const,
      contentTranslations: null,
    };
    const first = await serveJobDetailTranslation({
      jobMongoId: mongoId.toString(),
      language: "te",
      job,
    });
    const second = await serveJobDetailTranslation({
      jobMongoId: mongoId.toString(),
      language: "te",
      job,
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(first.translationStatus, "pending");
    assert.equal(second.translationStatus, "pending");
    assert.equal(created, 1);
  });
});
