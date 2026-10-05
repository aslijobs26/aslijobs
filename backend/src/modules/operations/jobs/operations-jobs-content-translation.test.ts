import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectJobContentLanguage } from "../../jobs/job-content-language.js";
import {
  hashJobField,
  languageNeedsTranslation,
  resolveJobContent,
  translateRequestedJobLanguage,
  withTranslationInFlight,
  type JobContentTranslations,
} from "../../jobs/job-content-translation.js";

const source = {
  jobTitle: "Plumber required in Hyderabad",
  description: "We need an experienced plumber for residential work.",
  interviewInstructions: "Bring ID proof to the interview.",
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

describe("operations job preview translation reuse", () => {
  it("detects English as the source language for Operations preview defaults", () => {
    assert.equal(
      detectJobContentLanguage(
        `${source.jobTitle}\n${source.description}\n${source.interviewInstructions}`,
      ),
      "en",
    );
  });

  it("returns a stored Telugu translation with zero Sarvam calls", async () => {
    const calls = { count: 0 };
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "tr:title",
        description: "tr:description",
        interviewInstructions: "tr:instructions",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };

    const result = await translateRequestedJobLanguage({
      source,
      existing: stored,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });

    assert.equal(result.event, "CACHE_HIT");
    assert.equal(result.translateCalls, 0);
    assert.equal(calls.count, 0);
    assert.equal(result.content.jobTitle, "tr:title");
    assert.equal(
      resolveJobContent({ ...source, contentTranslations: stored }, "te").description,
      "tr:description",
    );
  });

  it("generates Telugu once, then reuses it for a second request", async () => {
    const calls = { count: 0 };
    const first = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(first.event, "TRANSLATION_CREATED");
    assert.ok(first.translateCalls > 0);
    const firstCallCount = calls.count;

    const second = await translateRequestedJobLanguage({
      source,
      existing: first.contentTranslations,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(second.event, "CACHE_HIT");
    assert.equal(second.translateCalls, 0);
    assert.equal(calls.count, firstCallCount);
  });

  it("translates Hindi independently without regenerating Telugu", async () => {
    const calls = { count: 0 };
    const telugu = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    const afterTelugu = calls.count;

    const hindi = await translateRequestedJobLanguage({
      source,
      existing: telugu.contentTranslations,
      language: "hi",
      fetchImpl: mockTranslate(calls),
    });

    assert.equal(hindi.event, "TRANSLATION_CREATED");
    assert.ok(calls.count > afterTelugu);
    assert.equal(
      languageNeedsTranslation(
        { ...source, contentTranslations: hindi.contentTranslations },
        "te",
      ),
      false,
    );
    assert.equal(hindi.contentTranslations.ta, undefined);
  });

  it("keeps original English fields unchanged after translating", async () => {
    const calls = { count: 0 };
    const result = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(source.jobTitle, "Plumber required in Hyderabad");
    assert.notEqual(result.content.jobTitle, source.jobTitle);
  });

  it("marks a stored translation stale after the English source changes", async () => {
    const calls = { count: 0 };
    const first = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    const edited = {
      ...source,
      description: "Updated plumber role with night shift.",
    };
    assert.equal(
      languageNeedsTranslation(
        { ...edited, contentTranslations: first.contentTranslations },
        "te",
      ),
      true,
    );

    const regenerated = await translateRequestedJobLanguage({
      source: edited,
      existing: first.contentTranslations,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(regenerated.event, "TRANSLATION_CREATED");
    assert.ok(regenerated.translateCalls > 0);
  });

  it("deduplicates concurrent Operations preview requests for the same language", async () => {
    let runs = 0;
    const work = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return "shared";
    };
    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        withTranslationInFlight("ops-preview:job:te", work),
      ),
    );
    assert.equal(runs, 1);
    assert.ok(results.every((result) => result === "shared"));
  });
});
