import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import {
  detectCanonicalSourceLanguage,
  detectJobContentLanguage,
  parseJobContentLanguage,
  resolveJobSourceLanguage,
} from "./job-content-language.js";
import {
  buildJobContentTranslations,
  extractJobNumericLiterals,
  hashJobField,
  hashJobSource,
  hasMatchingHtmlStructure,
  HTML_BATCH_MAPPING_RETRIES,
  isHardSarvamProviderFailure,
  isTranslationRetryCoolingDown,
  isUsableFieldTranslation,
  languageNeedsTranslation,
  needsJobContentTranslation,
  normalizeInternationalNumerals,
  packHtmlSegmentBatches,
  parseHtmlSegmentTranslations,
  protectJobNumericLiterals,
  queueJobContentTranslation,
  resolveJobContent,
  resolvePublicJobTranslationView,
  restoreJobNumericLiterals,
  shouldSkipFailedTranslationRetry,
  translateJobContentOnDemand,
  translateJobField,
  translateJobHtmlField,
  translateRequestedJobLanguage,
  translationPreservesSourceNumbers,
  withTranslationInFlight,
  wrapHtmlSegment,
  type JobContentTranslations,
} from "./job-content-translation.js";
import { JobModel } from "./job.model.js";
import { jobTranslationSourceHash } from "./job-translation.policy.js";

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

function translateMarkedHtmlInput(input: string): string {
  return input.replace(
    /__AJ_SEG_(\d{4})__([\s\S]*?)__AJ_END__/g,
    (_match, id: string, text: string) => `__AJ_SEG_${id}__tr:${text}__AJ_END__`,
  );
}

function mockHtmlTranslate(calls: { count: number; bodies: string[] }): typeof fetch {
  return (async (_url, init) => {
    calls.count += 1;
    const body = JSON.parse(String(init?.body ?? "{}")) as { input?: string };
    const input = body.input ?? "";
    calls.bodies.push(input);
    const translated = /__AJ_SEG_\d{4}__/.test(input)
      ? translateMarkedHtmlInput(input)
      : `tr:${input}`;
    return new Response(JSON.stringify({ translated_text: translated }), {
      status: 200,
    });
  }) as typeof fetch;
}

function buildSegmentedHtml(count: number): string {
  return Array.from({ length: count }, (_, index) => {
    const label = `Text segment ${String(index + 1).padStart(2, "0")}`;
    return `<p>${label}</p>`;
  }).join("");
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

  it("normalizes site codes and language-name aliases", () => {
    const aliases: Array<[string, "en" | "hi" | "te" | "ta" | "kn" | "ml"]> = [
      ["en", "en"],
      ["english", "en"],
      ["EN", "en"],
      ["hi", "hi"],
      ["hindi", "hi"],
      ["te", "te"],
      ["telugu", "te"],
      ["ta", "ta"],
      ["tamil", "ta"],
      ["kn", "kn"],
      ["kannada", "kn"],
      ["ml", "ml"],
      ["malayalam", "ml"],
    ];
    for (const [alias, expected] of aliases) {
      assert.equal(parseJobContentLanguage(alias), expected);
    }
  });

  it("stores Telugu as the canonical source language for Telugu job copy", () => {
    const telugu = {
      jobTitle: "ప్లంబర్",
      description: "హైదరాబాద్‌లో ప్లంబర్ అవసరం",
      interviewInstructions: "ఐడి తీసుకురండి",
    };
    assert.equal(detectCanonicalSourceLanguage(telugu), "te");
    assert.equal(resolveJobSourceLanguage({ ...telugu, contentLanguage: "en" }), "te");
    assert.equal(resolveJobSourceLanguage({ ...source, contentLanguage: "en" }), "en");
  });
});

describe("job numeric literal protection", () => {
  it("extracts salary amounts and plain numbers from job copy", () => {
    const literals = extractJobNumericLiterals(
      "Salary ₹18,000 /month for 2 openings. Range ₹15,000-₹20,000. Shift 09:30.",
    );
    assert.ok(literals.includes("₹18,000"));
    assert.ok(
      literals.includes("₹15,000-₹20,000") ||
        (literals.includes("₹15,000") && literals.includes("₹20,000")),
    );
    assert.ok(literals.includes("2"));
    assert.ok(literals.includes("09:30"));
  });

  it("masks numbers before Sarvam and restores them afterwards", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const sourceText =
      "Plumber needed. Salary ₹18,000 per month. Openings: 1.";
    const result = await translateJobField({
      text: sourceText,
      sourceLanguage: "en",
      targetLanguage: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.failed, false);
    assert.ok(calls.bodies[0]?.includes("__AJ"));
    assert.ok(!calls.bodies[0]?.includes("₹18,000"));
    assert.match(result.text, /₹18,000/);
    assert.match(result.text, /\b1\b/);
  });

  it("normalizes Indic digits back to international numerals", () => {
    assert.equal(normalizeInternationalNumerals("జీతం ౧౮,౦౦౦"), "జీతం 18,000");
    assert.equal(normalizeInternationalNumerals("वेतन १८,०००"), "वेतन 18,000");
  });

  it("marks translations that lost salary numbers as unusable", () => {
    assert.equal(
      translationPreservesSourceNumbers(
        "Salary ₹18,000",
        "జీతం ₹18,000",
      ),
      true,
    );
    assert.equal(
      translationPreservesSourceNumbers(
        "Salary ₹18,000",
        "జీతం పద్దెనిమిది వేలు",
      ),
      false,
    );
  });

  it("restores protected tokens after a mangled provider response", () => {
    const protectedText = protectJobNumericLiterals("Pay ₹18,000 now");
    assert.ok(protectedText.tokens.includes("₹18,000"));
    const restored = restoreJobNumericLiterals(
      `Pay ${protectedText.text.includes("__AJ0__") ? "__AJ0__" : protectedText.text} now`,
      protectedText.tokens,
    );
    assert.match(restored, /₹18,000/);
  });
});

describe("job content translation", () => {
  it("does not call Sarvam until a language is requested", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const built = await buildJobContentTranslations({
      source,
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(built.contentLanguage, "en");
    assert.equal(built.translationStatus, "none");
    assert.equal(calls.count, 0);
    assert.equal(built.contentTranslations.en?.jobTitle, source.jobTitle);
    assert.equal(built.contentTranslations.te, undefined);
  });

  it("translates only the requested language", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const built = await buildJobContentTranslations({
      source,
      languages: ["te"],
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(built.translationStatus, "complete");
    assert.equal(calls.count, 3);
    assert.equal(built.contentTranslations.te?.jobTitle, `tr:${source.jobTitle}`);
    assert.equal(built.contentTranslations.hi, undefined);
    assert.ok(calls.bodies.every((body) => !body.includes("99999")));
  });

  it("does not call the API again when content hashes match", async () => {
    const firstCalls = { count: 0, bodies: [] as string[] };
    const first = await buildJobContentTranslations({
      source,
      languages: ["hi"],
      fetchImpl: mockTranslate(firstCalls),
    });
    const secondCalls = { count: 0, bodies: [] as string[] };
    const second = await buildJobContentTranslations({
      source,
      languages: ["hi"],
      existing: first.contentTranslations,
      fetchImpl: mockTranslate(secondCalls),
    });
    assert.equal(secondCalls.count, 0);
    assert.equal(second.translateCalls, 0);
    assert.equal(second.contentTranslations.hi?.description, first.contentTranslations.hi?.description);
  });

  it("retranslates only a changed field for the requested language", async () => {
    const first = await buildJobContentTranslations({
      source,
      languages: ["te"],
      fetchImpl: mockTranslate({ count: 0, bodies: [] }),
    });
    const calls = { count: 0, bodies: [] as string[] };
    const next = await buildJobContentTranslations({
      source: { ...source, description: "Updated description only." },
      languages: ["te"],
      existing: first.contentTranslations,
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(calls.count, 1);
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
    const built = await buildJobContentTranslations({
      source,
      languages: ["te"],
      fetchImpl,
    });
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
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(""),
      },
    };
    const viewed = resolveJobContent(
      { ...source, contentTranslations: stored, contactMobile: "9999999999" },
      "te",
    );
    assert.equal(viewed.jobTitle, "ఎలక్ట్రీషియన్");
    assert.equal(viewed.description, "అనుభవం");
    assert.equal(viewed.interviewInstructions, source.interviewInstructions);
    assert.equal(source.jobTitle, "Electrician");
  });

  it("shows the original text when a stored translation is stale", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ఎలక్ట్రీషియన్",
        description: "పాత వివరణ",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField("An older description."),
        interviewInstructionsHash: hashJobField(""),
      },
    };
    const job = { ...source, contentTranslations: stored };
    const viewed = resolveJobContent(job, "te");
    assert.equal(viewed.jobTitle, "ఎలక్ట్రీషియన్");
    assert.equal(viewed.description, source.description);
    assert.equal(needsJobContentTranslation(job, ["te"]), true);
  });

  it("flags jobs with missing translations and clears the flag once translated", async () => {
    assert.equal(needsJobContentTranslation(source), true);
    assert.equal(needsJobContentTranslation(source, ["en"]), false);
    const built = await buildJobContentTranslations({
      source,
      languages: ["hi", "te"],
      fetchImpl: mockTranslate({ count: 0, bodies: [] }),
    });
    assert.equal(
      needsJobContentTranslation({ ...source, contentTranslations: built.contentTranslations }, ["hi", "te"]),
      false,
    );
    assert.equal(
      needsJobContentTranslation({ ...source, contentTranslations: built.contentTranslations }, ["ta"]),
      true,
    );
  });

  it("translates HTML descriptions text-only and keeps every tag", async () => {
    const html =
      "<p>We need a <strong>Plumber</strong> today.</p><ul><li><p>Fix leaks.</p></li></ul><p></p>";
    const calls = { count: 0, bodies: [] as string[] };
    const built = await buildJobContentTranslations({
      source: { ...source, description: html },
      languages: ["te"],
      fetchImpl: mockHtmlTranslate(calls),
    });
    const telugu = built.contentTranslations.te?.description ?? "";
    assert.equal(
      telugu,
      "<p>tr:We need a <strong>tr:Plumber</strong> tr:today.</p><ul><li><p>tr:Fix leaks.</p></li></ul><p></p>",
    );
    assert.ok(calls.bodies.every((body) => !body.includes("<")));
    assert.ok(hasMatchingHtmlStructure(html, telugu));
  });

  it("retries a whole HTML batch once when segment markers cannot be mapped", async () => {
    const html = "<p>First line.</p><p>Second line.</p>";
    let callCount = 0;
    const fetchImpl = (async () => {
      callCount += 1;
      return new Response(JSON.stringify({ translated_text: "merged-into-one-line" }), {
        status: 200,
      });
    }) as typeof fetch;
    const result = await translateJobHtmlField({
      html,
      sourceLanguage: "en",
      targetLanguage: "te",
      fetchImpl,
    });
    assert.equal(result.failed, true);
    assert.equal(result.text, html);
    assert.equal(callCount, HTML_BATCH_MAPPING_RETRIES + 1);
    assert.equal(result.errorCode, "html_segment_mapping_failed");
  });

  it("ignores stored HTML translations whose tag structure is broken", async () => {
    const html = "<p>Intro.</p><ul><li><p>Point.</p></li></ul>";
    const broken = `tr:Intro.tr:Point.${"<br>".repeat(50)}</p></li></ul>`;
    const existing: JobContentTranslations = {
      te: {
        jobTitle: `tr:${source.jobTitle}`,
        description: broken,
        interviewInstructions: `tr:${source.interviewInstructions}`,
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(html),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
      },
    };
    const viewed = resolveJobContent(
      { ...source, description: html, contentTranslations: existing },
      "te",
    );
    assert.equal(viewed.description, html);
    assert.equal(
      needsJobContentTranslation(
        { ...source, description: html, contentTranslations: existing },
        ["te"],
      ),
      true,
    );

    const rebuilt = await buildJobContentTranslations({
      source: { ...source, description: html },
      existing,
      languages: ["te"],
      fetchImpl: mockHtmlTranslate({ count: 0, bodies: [] }),
    });
    assert.equal(
      rebuilt.contentTranslations.te?.description,
      "<p>tr:Intro.</p><ul><li><p>tr:Point.</p></li></ul>",
    );
    assert.equal(
      needsJobContentTranslation(
        { ...source, description: html, contentTranslations: rebuilt.contentTranslations },
        ["te"],
      ),
      false,
    );
  });

  it("maps marked HTML segments back in source order", () => {
    const mapped = parseHtmlSegmentTranslations(
      `${wrapHtmlSegment(0, "tr:First")} ${wrapHtmlSegment(1, "tr:Second")}`,
      [0, 1],
    );
    assert.equal(mapped?.get(0), "tr:First");
    assert.equal(mapped?.get(1), "tr:Second");
    assert.equal(parseHtmlSegmentTranslations("no markers", [0, 1]), null);
  });

  it("packs 31 short HTML text nodes into two Sarvam batches", () => {
    const html = buildSegmentedHtml(31);
    const segments = [...html.matchAll(/<p>([^<]+)<\/p>/g)].map((match) => match[1]);
    assert.equal(segments.length, 31);
    const batches = packHtmlSegmentBatches(segments);
    assert.equal(batches.length, 2);
    assert.equal(batches[0].length + batches[1].length, 31);
  });

  it("translates a 31-segment HTML job in 4 Sarvam calls, never 35", async () => {
    const html = buildSegmentedHtml(31);
    const calls = { count: 0, bodies: [] as string[] };
    const built = await buildJobContentTranslations({
      source: {
        jobTitle: "Plumber",
        description: html,
        interviewInstructions: "Bring ID proof.",
      },
      languages: ["te"],
      publicJobId: "AJ-2026-000072",
      fetchImpl: mockHtmlTranslate(calls),
    });
    const telugu = built.contentTranslations.te?.description ?? "";
    assert.equal(built.fieldCalls.jobTitle, 1);
    assert.equal(built.fieldCalls.description, 2);
    assert.equal(built.fieldCalls.interviewInstructions, 1);
    assert.equal(built.translateCalls, 4);
    assert.equal(calls.count, 4);
    assert.ok(calls.bodies.every((body) => !body.includes("<p>")));
    assert.ok(hasMatchingHtmlStructure(html, telugu));
    for (let index = 1; index <= 31; index += 1) {
      assert.match(telugu, new RegExp(`tr:Text segment ${String(index).padStart(2, "0")}`));
    }
    assert.match(telugu, /<p>tr:Text segment 01<\/p>/);
    assert.match(telugu, /<p>tr:Text segment 31<\/p>/);
  });

  it("keeps HTML numbers after marked batch translation", async () => {
    const html = "<p>Salary ₹18,000 for 2 years. Openings: 1.</p>";
    const result = await translateJobHtmlField({
      html,
      sourceLanguage: "en",
      targetLanguage: "te",
      fetchImpl: mockHtmlTranslate({ count: 0, bodies: [] }),
    });
    assert.equal(result.failed, false);
    assert.match(result.text, /₹18,000/);
    assert.match(result.text, /\b2\b/);
    assert.match(result.text, /\b1\b/);
    assert.ok(hasMatchingHtmlStructure(html, result.text));
    assert.equal(translationPreservesSourceNumbers(html, result.text), true);
  });

  it("stops remaining fields after a hard 402 on the title", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const fetchImpl = (async (_url, init) => {
      calls.count += 1;
      calls.bodies.push(JSON.parse(String(init?.body ?? "{}")).input ?? "");
      return new Response(
        JSON.stringify({
          error: { message: "No credits available.", code: "insufficient_quota_error" },
        }),
        { status: 402 },
      );
    }) as typeof fetch;
    const built = await buildJobContentTranslations({
      source,
      languages: ["te"],
      fetchImpl,
    });
    assert.equal(isHardSarvamProviderFailure({ httpStatus: 402, errorCode: "insufficient_quota_error" }), true);
    assert.equal(calls.count, 1);
    assert.equal(built.fieldCalls.jobTitle, 1);
    assert.equal(built.fieldCalls.description, 0);
    assert.equal(built.fieldCalls.interviewInstructions, 0);
    assert.equal(built.translationStatus, "failed");
  });

  it("falls back to the original for jobs that have no translations", () => {
    const viewed = resolveJobContent(source, "hi");
    assert.equal(viewed.jobTitle, source.jobTitle);
    assert.equal(viewed.description, source.description);
  });

  it("first Telugu request makes Sarvam calls and later Telugu requests do not", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const first = await translateRequestedJobLanguage({
      source,
      language: "te",
      publicJobId: "AJ-TEST-1",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(first.event, "TRANSLATION_CREATED");
    assert.equal(first.translateCalls, 3);
    assert.equal(first.content.jobTitle, `tr:${source.jobTitle}`);

    const second = await translateRequestedJobLanguage({
      source,
      existing: first.contentTranslations,
      language: "te",
      publicJobId: "AJ-TEST-1",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(second.event, "CACHE_HIT");
    assert.equal(second.translateCalls, 0);
    assert.equal(calls.count, 3);

    for (let index = 0; index < 20; index += 1) {
      const repeated = await translateRequestedJobLanguage({
        source,
        existing: first.contentTranslations,
        language: "te",
        fetchImpl: mockTranslate(calls),
      });
      assert.equal(repeated.event, "CACHE_HIT");
      assert.equal(repeated.translateCalls, 0);
    }
    assert.equal(calls.count, 3);
  });

  it("Telugu plus Hindi is two languages and unrequested Tamil stays untranslated", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const telugu = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    const hindi = await translateRequestedJobLanguage({
      source,
      existing: telugu.contentTranslations,
      language: "hi",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(telugu.translateCalls, 3);
    assert.equal(hindi.translateCalls, 3);
    assert.equal(calls.count, 6);
    assert.equal(hindi.contentTranslations.ta, undefined);
    assert.equal(needsJobContentTranslation({ ...source, contentTranslations: hindi.contentTranslations }, ["ta"]), true);
  });

  it("skips translation when the requested language is the source language", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source,
      language: "en",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.event, "TRANSLATION_SKIPPED_SOURCE_LANGUAGE");
    assert.equal(result.translateCalls, 0);
    assert.equal(calls.count, 0);
  });

  it("returns original content when Sarvam fails", async () => {
    const fetchImpl = (async () => {
      throw new Error("timeout");
    }) as typeof fetch;
    const result = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl,
    });
    assert.equal(result.event, "TRANSLATION_FAILED");
    assert.equal(result.content.jobTitle, source.jobTitle);
    assert.equal(result.contentTranslations.te?.status, "failed");
  });

  it("stores current source hashes on provider failure so the public API can cooldown", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          error: { message: "No credits available.", code: "insufficient_quota_error" },
        }),
        { status: 402 },
      )) as typeof fetch;
    const result = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl,
    });
    const stored = result.contentTranslations.te;
    assert.equal(result.event, "TRANSLATION_FAILED");
    assert.equal(stored?.jobTitleHash, hashJobField(source.jobTitle));
    assert.equal(stored?.descriptionHash, hashJobField(source.description));
    assert.equal(stored?.interviewInstructionsHash, hashJobField(source.interviewInstructions));
    assert.equal(shouldSkipFailedTranslationRetry(stored, source), true);
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: result.contentTranslations },
      "te",
    );
    assert.equal(view.translationStatus, "failed");
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.content.jobTitle, source.jobTitle);
  });

  it("applies retry cooldown after a failed translation of the same source", async () => {
    const failed: JobContentTranslations = {
      te: {
        jobTitle: "",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date().toISOString(),
        status: "failed",
      },
    };
    assert.equal(shouldSkipFailedTranslationRetry(failed.te, source), true);
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source,
      existing: failed,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.event, "TRANSLATION_SKIPPED");
    assert.equal(result.translateCalls, 0);
    assert.equal(calls.count, 0);
  });

  it("retries after an edit even if the previous attempt failed recently", async () => {
    const failed: JobContentTranslations = {
      te: {
        jobTitle: "",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date().toISOString(),
        status: "failed",
      },
    };
    const edited = { ...source, jobTitle: "Senior Electrician" };
    assert.equal(shouldSkipFailedTranslationRetry(failed.te, edited), false);
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source: edited,
      existing: failed,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.event, "TRANSLATION_CREATED");
    assert.ok(calls.count > 0);
  });

  it("deduplicates concurrent translation work for the same job and language", async () => {
    let runs = 0;
    const work = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "done";
    };
    const results = await Promise.all(
      Array.from({ length: 20 }, () => withTranslationInFlight("job:te", work)),
    );
    assert.equal(runs, 1);
    assert.ok(results.every((result) => result === "done"));
  });

  it("treats a recent failure timestamp as cooling down", () => {
    assert.equal(isTranslationRetryCoolingDown(new Date().toISOString()), true);
    assert.equal(
      isTranslationRetryCoolingDown(new Date(Date.now() - 31_000).toISOString()),
      false,
    );
    assert.equal(isTranslationRetryCoolingDown(null), false);
  });
});

describe("public job translation view", () => {
  it("returns English immediately and does not enqueue", () => {
    const view = resolvePublicJobTranslationView(source, "en");
    assert.equal(view.translationStatus, "ready");
    assert.equal(view.sourceLanguage, "en");
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.isTranslated, false);
    assert.equal(view.content.jobTitle, source.jobTitle);
  });

  it("returns the original immediately when Telugu is missing and asks for one background task", () => {
    const view = resolvePublicJobTranslationView(source, "te");
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.isTranslated, false);
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.content.description, source.description);
  });

  it("returns a stored Telugu translation without enqueueing", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "tr:Electrician",
        description: "tr:We are looking for an experienced electrician.",
        interviewInstructions: "tr:Bring ID proof.",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "ready");
    assert.equal(view.isTranslated, true);
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.content.jobTitle, "tr:Electrician");
  });

  it("does not treat a completed Telugu cache as a Tamil translation", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "డ్రైవర్",
        description: "తెలుగు వివరణ",
        interviewInstructions: "తెలుగు సూచన",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "ta",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.isTranslated, false);
    assert.equal(view.content.jobTitle, source.jobTitle);
    assert.equal(view.content.description, source.description);
    assert.equal(languageNeedsTranslation({ ...source, contentTranslations: stored }, "ta"), true);
    assert.equal(languageNeedsTranslation({ ...source, contentTranslations: stored }, "te"), false);
  });

  it("does not enqueue again while a failed translation is cooling down", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date().toISOString(),
        status: "failed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "failed");
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.content.jobTitle, source.jobTitle);
  });

  it("retries a failed translation after the short throttle instead of blocking for ten minutes", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date(Date.now() - 31_000).toISOString(),
        status: "failed",
      },
    };
    assert.equal(shouldSkipFailedTranslationRetry(stored.te, source), false);
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.content.jobTitle, source.jobTitle);
    assert.equal(view.isTranslated, false);
  });

  it("never treats a failed empty row as a ready cache hit", () => {
    const stored: JobContentTranslations = {
      ta: {
        jobTitle: "",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date(Date.now() - 31_000).toISOString(),
        status: "failed",
      },
    };
    assert.equal(
      isUsableFieldTranslation(source.jobTitle, stored.ta, "jobTitle"),
      false,
    );
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "ta",
    );
    assert.notEqual(view.translationStatus, "ready");
    assert.equal(view.shouldEnqueue, true);
  });

  it("does not treat an identical English title as a usable Tamil translation", () => {
    const stored: JobContentTranslations = {
      ta: {
        jobTitle: source.jobTitle,
        description: source.description,
        interviewInstructions: source.interviewInstructions,
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    assert.equal(
      isUsableFieldTranslation(source.jobTitle, stored.ta, "jobTitle"),
      false,
    );
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "ta",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
  });

  it("hides a stale translation and queues a fresh one", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "పాత శీర్షిక",
        description: "పాత వివరణ",
        interviewInstructions: "పాత సూచన",
        jobTitleHash: hashJobField("Old title"),
        descriptionHash: hashJobField("Old description"),
        interviewInstructionsHash: hashJobField("Old instructions"),
        status: "completed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.content.jobTitle, source.jobTitle);
    assert.equal(view.content.description, source.description);
  });

  it("keeps a current Telugu title when only the description is missing", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(""),
        interviewInstructionsHash: hashJobField(""),
        status: "completed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.isTranslated, true);
    assert.equal(view.content.jobTitle, "ప్లంబర్");
    assert.equal(view.content.description, source.description);
    assert.equal(view.content.interviewInstructions, source.interviewInstructions);
  });

  it("keeps a current title when a description translation is stale", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "పాత వివరణ",
        interviewInstructions: "సూచన",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField("Old description"),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "pending");
    assert.equal(view.shouldEnqueue, true);
    assert.equal(view.content.jobTitle, "ప్లంబర్");
    assert.equal(view.content.description, source.description);
    assert.equal(view.content.interviewInstructions, "సూచన");
  });

  it("list and detail resolvers stay aligned for a partial Telugu cache", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: "",
        interviewInstructionsHash: "",
        status: "completed",
      },
    };
    const job = { ...source, contentTranslations: stored };
    const listed = resolveJobContent(job, "te");
    const detail = resolvePublicJobTranslationView(job, "te");
    assert.equal(detail.content.jobTitle, listed.jobTitle);
    assert.equal(detail.content.description, listed.description);
  });

  it("returns original content for Hindi Tamil Kannada and Malayalam until stored", () => {
    for (const language of ["hi", "ta", "kn", "ml"] as const) {
      const view = resolvePublicJobTranslationView(source, language);
      assert.equal(view.translationStatus, "pending");
      assert.equal(view.shouldEnqueue, true);
      assert.equal(view.isTranslated, false);
      assert.equal(view.content.jobTitle, source.jobTitle);
    }
  });

  it("failed cooldown still returns any usable field translation", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "",
        interviewInstructions: "",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        lastAttemptAt: new Date().toISOString(),
        status: "failed",
      },
    };
    const view = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(view.translationStatus, "failed");
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.content.jobTitle, "ప్లంబర్");
    assert.equal(view.content.description, source.description);
  });
});

describe("public job translation cost", () => {
  it("English detail and list-style resolve never call Sarvam", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const english = await translateRequestedJobLanguage({
      source,
      language: "en",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(english.translateCalls, 0);
    const listed = resolveJobContent(source, "te");
    assert.equal(listed.jobTitle, source.jobTitle);
    assert.equal(calls.count, 0);
  });

  it("a Telugu cache miss translates only Telugu", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.translateCalls, 3);
    assert.equal(result.contentTranslations.hi, undefined);
    assert.equal(result.contentTranslations.ta, undefined);
    assert.equal(result.contentTranslations.kn, undefined);
    assert.equal(result.contentTranslations.ml, undefined);
    assert.ok(result.contentTranslations.te);
  });

  it("does not translate a Telugu job into Telugu", async () => {
    const telugu = {
      jobTitle: "ప్లంబర్",
      description: "హైదరాబాద్‌లో ప్లంబర్ అవసరం",
      interviewInstructions: "ఐడి తీసుకురండి",
    };
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source: telugu,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.event, "TRANSLATION_SKIPPED_SOURCE_LANGUAGE");
    assert.equal(result.translateCalls, 0);
    assert.equal(calls.count, 0);
    const view = resolvePublicJobTranslationView(telugu, "te");
    assert.equal(view.translationStatus, "ready");
    assert.equal(view.shouldEnqueue, false);
    assert.equal(view.content.jobTitle, telugu.jobTitle);
  });

  it("keeps an existing Telugu translation when Sarvam returns empty text", async () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "వివరణ",
        interviewInstructions: "సూచన",
        jobTitleHash: hashJobField("Old title"),
        descriptionHash: hashJobField("Old description"),
        interviewInstructionsHash: hashJobField("Old instructions"),
        status: "completed",
      },
    };
    const emptyFetch = (async () =>
      new Response(JSON.stringify({ translated_text: "   " }), {
        status: 200,
      })) as typeof fetch;
    const result = await translateRequestedJobLanguage({
      source,
      existing: stored,
      language: "te",
      fetchImpl: emptyFetch,
    });
    assert.equal(result.contentTranslations.te?.jobTitle, "ప్లంబర్");
    assert.equal(result.contentTranslations.te?.description, "వివరణ");
    assert.notEqual(result.contentTranslations.te?.status, "completed");
  });

  it("does not enqueue translations from publish-time queueJobContentTranslation", () => {
    queueJobContentTranslation("507f1f77bcf86cd799439011");
  });
});

describe("list vs detail translation triggers", () => {
  it("list resolve uses stored Telugu without enqueue metadata", () => {
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ప్లంబర్",
        description: "వివరణ",
        interviewInstructions: "సూచన",
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    const listed = resolveJobContent(
      { ...source, contentTranslations: stored },
      "te",
    );
    const detail = resolvePublicJobTranslationView(
      { ...source, contentTranslations: stored },
      "te",
    );
    assert.equal(listed.jobTitle, "ప్లంబర్");
    assert.equal(detail.shouldEnqueue, false);
    assert.equal(detail.translationStatus, "ready");
  });

  it("list resolve of a missing language stays on the original and does not imply enqueue", () => {
    const listed = resolveJobContent(source, "hi");
    const detail = resolvePublicJobTranslationView(source, "hi");
    assert.equal(listed.jobTitle, source.jobTitle);
    assert.equal(detail.shouldEnqueue, true);
  });
});

describe("translation cache contract", () => {
  it("uses the same aggregate source hash for the queue task and the resolver", () => {
    const sourceHash = hashJobSource(source);
    assert.equal(sourceHash, jobTranslationSourceHash(source));
    assert.notEqual(sourceHash, hashJobField(source.jobTitle));
  });

  it("does not treat an English clone as a Telugu cache hit", async () => {
    const clone: JobContentTranslations = {
      te: {
        jobTitle: source.jobTitle,
        description: source.description,
        interviewInstructions: source.interviewInstructions,
        jobTitleHash: hashJobField(source.jobTitle),
        descriptionHash: hashJobField(source.description),
        interviewInstructionsHash: hashJobField(source.interviewInstructions),
        status: "completed",
      },
    };
    assert.equal(
      isUsableFieldTranslation(source.description, clone.te, "description"),
      false,
    );
    assert.equal(
      languageNeedsTranslation({ ...source, contentTranslations: clone }, "te"),
      true,
    );
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source,
      existing: clone,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(result.event, "TRANSLATION_CREATED");
    assert.ok(result.translateCalls > 0);
    assert.ok(calls.count > 0);
    assert.notEqual(result.content.description, source.description);
  });

  it("retranslates a number-stripped description and keeps a valid title", async () => {
    const sourceWithPay = {
      ...source,
      description: "Pay ₹18,000 each month for an experienced electrician.",
    };
    const stored: JobContentTranslations = {
      te: {
        jobTitle: "ఎలక్ట్రీషియన్",
        description: "ప్రతి నెల అనుభవం ఉన్న ఎలక్ట్రీషియన్‌కు జీతం.",
        interviewInstructions: "tr:Bring ID proof.",
        jobTitleHash: hashJobField(sourceWithPay.jobTitle),
        descriptionHash: hashJobField(sourceWithPay.description),
        interviewInstructionsHash: hashJobField(sourceWithPay.interviewInstructions),
        status: "completed",
      },
    };
    assert.equal(
      isUsableFieldTranslation(sourceWithPay.jobTitle, stored.te, "jobTitle"),
      true,
    );
    assert.equal(
      isUsableFieldTranslation(sourceWithPay.description, stored.te, "description"),
      false,
    );
    const calls = { count: 0, bodies: [] as string[] };
    const result = await translateRequestedJobLanguage({
      source: sourceWithPay,
      existing: stored,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(calls.count, 1);
    assert.equal(result.content.jobTitle, "ఎలక్ట్రీషియన్");
    assert.match(result.content.description, /₹18,000/);
  });

  it("100 concurrent in-flight Telugu translations share one run", async () => {
    let runs = 0;
    const work = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return "te";
    };
    const results = await Promise.all(
      Array.from({ length: 100 }, () => withTranslationInFlight("job-100:te", work)),
    );
    assert.equal(runs, 1);
    assert.equal(results.length, 100);
    assert.ok(results.every((result) => result === "te"));
  });

  it("1,000 later Telugu readers reuse the Mongo translation with zero Sarvam calls", async () => {
    const calls = { count: 0, bodies: [] as string[] };
    const first = await translateRequestedJobLanguage({
      source,
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(first.event, "TRANSLATION_CREATED");
    const createdCalls = calls.count;
    for (let index = 0; index < 1_000; index += 1) {
      const repeated = await translateRequestedJobLanguage({
        source,
        existing: first.contentTranslations,
        language: "te",
        fetchImpl: mockTranslate(calls),
      });
      assert.equal(repeated.event, "CACHE_HIT");
      assert.equal(repeated.translateCalls, 0);
    }
    assert.equal(calls.count, createdCalls);
  });
});

describe("on-demand Mongo persistence", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("worker path calls Sarvam, persists Telugu, and later requests are cache hits", async () => {
    const mongoId = "507f1f77bcf86cd799439011";
    const store: {
      _id: string;
      jobTitle: string;
      description: string;
      interviewInstructions: string;
      contentLanguage: string;
      contentTranslations: JobContentTranslations;
      status: string;
    } = {
      _id: mongoId,
      ...source,
      contentLanguage: "en",
      contentTranslations: {},
      status: "active",
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
          } else if (key === "contentLanguage") {
            store.contentLanguage = String(value);
          }
        }
      },
    );

    const calls = { count: 0, bodies: [] as string[] };
    const first = await translateJobContentOnDemand({
      jobMongoId: mongoId,
      publicJobId: "AJ-2026-000014",
      language: "te",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(first.event, "TRANSLATION_CREATED");
    assert.ok(first.translateCalls > 0);
    assert.equal(calls.count, 3);
    assert.equal(store.contentLanguage, "en");
    assert.ok(store.contentTranslations.te);
    assert.notEqual(store.contentTranslations.te?.description, source.description);
    assert.equal(store.jobTitle, source.jobTitle);
    assert.equal(first.stillNeedsTranslation, false);

    const secondCalls = { count: 0, bodies: [] as string[] };
    const second = await translateJobContentOnDemand({
      jobMongoId: mongoId,
      publicJobId: "AJ-2026-000014",
      language: "te",
      fetchImpl: mockTranslate(secondCalls),
    });
    assert.equal(second.event, "CACHE_HIT");
    assert.equal(second.translateCalls, 0);
    assert.equal(secondCalls.count, 0);
    assert.equal(second.content.description, store.contentTranslations.te?.description);
  });

  it("does not overwrite canonical English fields when Hindi is requested", async () => {
    const mongoId = "507f1f77bcf86cd799439012";
    const store = {
      _id: mongoId,
      ...source,
      contentLanguage: "en",
      contentTranslations: {} as JobContentTranslations,
      status: "active",
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
            store.contentTranslations[language] = value as JobContentTranslations["hi"];
          }
        }
      },
    );
    const calls = { count: 0, bodies: [] as string[] };
    const hindi = await translateJobContentOnDemand({
      jobMongoId: mongoId,
      publicJobId: "AJ-2026-000004",
      language: "hi",
      fetchImpl: mockTranslate(calls),
    });
    assert.equal(hindi.event, "TRANSLATION_CREATED");
    assert.equal(store.jobTitle, "Electrician");
    assert.equal(store.contentTranslations.te, undefined);
    assert.ok(store.contentTranslations.hi);
    assert.notEqual(store.contentTranslations.hi?.jobTitle, store.jobTitle);
  });

  it("replaces stale empty hashes when Sarvam returns 402 so overlay can cooldown", async () => {
    const mongoId = "507f1f77bcf86cd799439013";
    const emptyHash = hashJobField("");
    const store: {
      _id: string;
      jobTitle: string;
      description: string;
      interviewInstructions: string;
      contentLanguage: string;
      contentTranslations: JobContentTranslations;
      status: string;
    } = {
      _id: mongoId,
      ...source,
      contentLanguage: "en",
      contentTranslations: {
        te: {
          jobTitle: "",
          description: "",
          interviewInstructions: "",
          jobTitleHash: emptyHash,
          descriptionHash: emptyHash,
          interviewInstructionsHash: emptyHash,
          lastAttemptAt: "2026-01-01T00:00:00.000Z",
          status: "failed",
        },
      },
      status: "active",
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
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({
          error: { message: "No credits available.", code: "insufficient_quota_error" },
        }),
        { status: 402 },
      )) as typeof fetch;
    const result = await translateJobContentOnDemand({
      jobMongoId: mongoId,
      publicJobId: "AJ-2026-000072",
      language: "te",
      forceRetry: true,
      fetchImpl,
    });
    assert.equal(result.event, "TRANSLATION_FAILED");
    assert.equal(store.contentTranslations.te?.jobTitleHash, hashJobField(source.jobTitle));
    assert.equal(store.contentTranslations.te?.status, "failed");
    assert.equal(store.jobTitle, source.jobTitle);
    assert.equal(
      resolvePublicJobTranslationView(
        { ...source, contentTranslations: store.contentTranslations },
        "te",
      ).translationStatus,
      "failed",
    );
  });
});
