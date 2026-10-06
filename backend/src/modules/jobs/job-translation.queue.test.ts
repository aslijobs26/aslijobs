import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { JobModel } from "./job.model.js";
import { JobTranslationTaskModel } from "./job-translation-task.model.js";
import {
  processJobTranslationTask,
} from "./job-translation.queue.js";
import {
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
});
