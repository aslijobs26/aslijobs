import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectJobContentLanguage,
  parseJobContentLanguage,
} from "./job-content-language.js";
import {
  buildJobContentTranslations,
  hashJobField,
  resolveJobContent,
  type JobContentTranslations,
} from "./job-content-translation.js";

function mockTranslate(calls: { count: number; bodies: string[] }): typeof fetch {
  return (async (_url, init) => {
    calls.count += 1;
    const body = JSON.parse(String(init?.body ?? "{}")) as { input?: string };
    calls.bodies.push(body.input ?? "");
    return new Response(JSON.stringify({ translated_text: `tr:${body.input}` }), {
      status: 200,
    });
  }) as typeof fetch;
}

const source = {
  jobTitle: "Electrician",
  description: "We are looking for an experienced electrician.",
  interviewInstructions: "Bring ID proof.",
};

describe("job content language", () => {
  it("detects Indic scripts and keeps Latin as English", () => {
    assert.equal(detectJobContentLanguage("Electrician"), "en");
    assert.equal(detectJobContentLanguage("ఎలక్ట్రీషియన్"), "te");
    assert.equal(detectJobContentLanguage("बिजली मिस्त्री"), "hi");
    assert.equal(detectJobContentLanguage("மின்சார"), "ta");
    assert.equal(detectJobContentLanguage("ವಿದ್ಯುತ್"), "kn");
    assert.equal(detectJobContentLanguage("വൈദ്യുതി"), "ml");
    assert.equal(parseJobContentLanguage("telugu"), "te");
    assert.equal(parseJobContentLanguage("nope"), null);
  });
});

describe("job content translation", () => {
  it("translates an English job into the other five languages once", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const built = await buildJobContentTranslations({
      source,
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(built.contentLanguage, "en");
    assert.equal(built.translationStatus, "complete");
    assert.equal(calls.count, 15);
    assert.equal(built.contentTranslations.en?.jobTitle, source.jobTitle);
    assert.equal(built.contentTranslations.te?.jobTitle, `tr:${source.jobTitle}`);
    assert.equal(source.jobTitle, "Electrician");
    assert.ok(calls.bodies.every((body) => !body.includes("99999")));
  });

  it("does not call the API again when content hashes match", async () => {
    const firstCalls = { count: 0, bodies: [] as string[] };
    const first = await buildJobContentTranslations({
      source,
      fetchImpl: mockTranslate(firstCalls),
    });
    const secondCalls = { count: 0, bodies: [] as string[] };
    const second = await buildJobContentTranslations({
      source,
      existing: first.contentTranslations,
      fetchImpl: mockTranslate(secondCalls),
    });
    assert.equal(secondCalls.count, 0);
    assert.equal(second.translateCalls, 0);
    assert.equal(second.contentTranslations.hi?.description, first.contentTranslations.hi?.description);
  });

  it("retranslates only a changed field", async () => {
    const first = await buildJobContentTranslations({
      source,
      fetchImpl: mockTranslate({ count: 0, bodies: [] }),
    });
    const calls = { count: 0, bodies: [] as string[] };
    const next = await buildJobContentTranslations({
      source: { ...source, description: "Updated description only." },
      existing: first.contentTranslations,
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(calls.count, 5);
    assert.ok(calls.bodies.every((body) => body === "Updated description only."));
    assert.equal(next.contentTranslations.en?.jobTitle, "Electrician");
    assert.equal(
      next.contentTranslations.te?.jobTitleHash,
      hashJobField("Electrician"),
    );
  });

  it("keeps the original when the translation API fails", async () => {
    const fetchImpl = (async () => {
      throw new Error("timeout");
    }) as typeof fetch;
    const built = await buildJobContentTranslations({ source, fetchImpl });
    assert.equal(built.translationStatus, "failed");
    assert.equal(built.contentTranslations.en?.description, source.description);
    assert.equal(built.contentTranslations.te?.jobTitle, "");
  });

  it("resolves a stored language without translating", () => {
    const stored: JobContentTranslations = {
      en: {
        jobTitle: "Electrician",
        description: source.description,
        interviewInstructions: source.interviewInstructions,
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
      },
      te: {
        jobTitle: "ఎలక్ట్రీషియన్",
        description: "అనుభవం",
        interviewInstructions: "",
        jobTitleHash: "x",
        descriptionHash: "y",
        interviewInstructionsHash: hashJobField(""),
      },
    };
    const viewed = resolveJobContent(
      { ...source, contentTranslations: stored, contactMobile: "9999999999" },
      "te",
    );
    assert.equal(viewed.jobTitle, "ఎలక్ట్రీషియన్");
    assert.equal(viewed.interviewInstructions, source.interviewInstructions);
    assert.equal(source.jobTitle, "Electrician");
  });

  it("falls back to the original for jobs that have no translations", () => {
    const viewed = resolveJobContent(source, "hi");
    assert.equal(viewed.jobTitle, source.jobTitle);
    assert.equal(viewed.description, source.description);
  });
});
