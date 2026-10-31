import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import type { TranslateTextResult } from "../../whatsapp/sarvam-translate.client.js";
import { SARVAM_TRANSLATE_INPUT_MAX } from "../../whatsapp/sarvam-translate.client.js";
import { INBOX_TRANSLATION_LANGUAGES } from "./inbox-translation.constants.js";
import {
  confidentInboxScript,
  detectInboxSourceLanguage,
  extractProtectedIdentifiers,
  hashInboxSourceText,
  isAlreadyTargetLanguage,
  isTranslatableInboxMessage,
  resetInboxTranslationCache,
  translateInboxText,
} from "./inbox-translation.helpers.js";

describe("inbox translation helpers", () => {
  it("hashes source text stably", () => {
    assert.equal(
      hashInboxSourceText("నాకు ఉద్యోగం కావాలి"),
      hashInboxSourceText("నాకు ఉద్యోగం కావాలి"),
    );
    assert.notEqual(
      hashInboxSourceText("hello"),
      hashInboxSourceText("hello!"),
    );
  });

  it("skips media placeholders and empty bodies", () => {
    assert.equal(
      isTranslatableInboxMessage({ messageType: "audio", body: "[Voice message]" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "image", body: "[Image]" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "document", body: "[Document] resume.pdf" }),
      false,
    );
    assert.equal(
      isTranslatableInboxMessage({ messageType: "text", body: "   " }),
      false,
    );
  });

  it("allows real captions and text messages", () => {
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "text",
        body: "నాకు ఉద్యోగం కావాలి",
      }),
      true,
    );
    assert.equal(
      isTranslatableInboxMessage({
        messageType: "image",
        body: "Site photo from Hyderabad",
      }),
      true,
    );
  });

  it("detects Indic scripts for source language", () => {
    assert.equal(detectInboxSourceLanguage("నాకు ఉద్యోగం కావాలి"), "te");
    assert.equal(detectInboxSourceLanguage("मुझे नौकरी चाहिए"), "hi");
    assert.equal(detectInboxSourceLanguage("Please share your resume"), "en");
  });

  it("recognizes a confident native script before calling a provider", () => {
    assert.equal(confidentInboxScript("నాకు ఉద్యోగం కావాలి"), "te");
    assert.equal(confidentInboxScript("Please share your resume"), null);
  });

  it("does not treat mixed English+Kannada bodies as already Kannada", () => {
    assert.equal(isAlreadyTargetLanguage("ನಮಸ್ಕಾರ\n\nಧನ್ಯವಾದಗಳು", "kn"), true);
    assert.equal(
      isAlreadyTargetLanguage(
        "ASLIJOBS\n\n🎉 ನಿಮ್ಮ AsliJobs ಖಾತೆ ಸಿದ್ಧವಾಗಿದೆ!\n\nYou can now search for jobs and apply.",
        "kn",
      ),
      false,
    );
    assert.equal(
      isAlreadyTargetLanguage(
        "Hi chandu,\n\nYour AsliJobs account has been created successfully!",
        "kn",
      ),
      false,
    );
    assert.equal(
      isAlreadyTargetLanguage("నమಸ్కార and also తెలుగు text here", "kn"),
      false,
    );
  });

  it("extracts URLs and phone numbers for protection", () => {
    const terms = extractProtectedIdentifiers(
      "Call +91 98765 43210 or open https://aslijobs.com/jobs/AJ-12345",
    );
    assert.ok(terms.some((term) => term.includes("98765")));
    assert.ok(terms.some((term) => term.includes("https://aslijobs.com")));
    assert.ok(terms.some((term) => /AJ[-_]?12345/i.test(term)));
  });

  it("protects urls, salaries, dates, emails, and emojis as whole tokens", () => {
    const terms = extractProtectedIdentifiers(
      "📧 team@aslijobs.com on 27/10/2026 💰 ₹17,000–₹22,000 https://www.aslijobs.com/jobs/AJ-2026-000030?lang=kn",
    );
    assert.ok(terms.includes("team@aslijobs.com"));
    assert.ok(terms.includes("27/10/2026"));
    assert.ok(terms.includes("₹17,000–₹22,000"));
    assert.ok(
      terms.includes("https://www.aslijobs.com/jobs/AJ-2026-000030?lang=kn"),
    );
    assert.ok(terms.includes("📧"));
    assert.ok(terms.includes("💰"));
  });
});

function providerResult(
  text: string,
  overrides: Partial<TranslateTextResult> = {},
): TranslateTextResult {
  return {
    text,
    translated: true,
    skipped: false,
    failed: false,
    durationMs: 1,
    ...overrides,
  };
}

/**
 * Imitates Sarvam flattening newlines while still translating each side of a
 * protected separator. Placeholder tokens are left untouched.
 */
function translateFlattened(
  text: string,
  render: (segment: string) => string,
): string {
  return text
    .split(/(__AJ\d+__)/)
    .map((part) => {
      if (/^__AJ\d+__$/.test(part)) return part;
      const collapsed = part.replace(/\s*\n+\s*/g, " ").trim();
      return collapsed ? render(collapsed) : "";
    })
    .filter((part) => part.length > 0)
    .join(" ");
}

/** Imitates a provider that flattens newlines and rewrites protected values. */
function corruptProviderText(text: string): string {
  return text
    .replace(/\n/g, " ")
    .replace(/https?:\/\/\S+/gi, "URL")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "EMAIL")
    .replace(/\+?\d[\d\s()-]{8,}\d/g, "PHONE")
    .replace(/₹\s?[\d,]+(?:\s*[–—-]\s*₹?\s?[\d,]+)?/g, "MONEY")
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, "DATE")
    .replace(/\b(?:AJ|JOB)(?:[-_]\d+)+/gi, "JOB")
    .replace(/\p{Extended_Pictographic}/gu, "");
}

function jobList(count: number): string {
  const jobs = Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const id = String(n).padStart(6, "0");
    return [
      `${n}. Warehouse assistant — Employer ${n}`,
      "📍 Hyderabad",
      `💰 ₹${17 + n},000–₹${22 + n},000`,
      `👉 Apply Now: https://www.aslijobs.com/jobs/AJ-2026-${id}?lang=kn`,
    ].join("\n");
  });
  return ["Hyderabad has openings today.", "", jobs.join("\n\n")].join("\n");
}

function assertJobListStructure(text: string, count: number): void {
  const blocks = text.split(/\n\n/);
  assert.equal(blocks.length, count + 1);
  assert.match(blocks[0] ?? "", /openings/);
  for (let n = 1; n <= count; n += 1) {
    const lines = (blocks[n] ?? "").split("\n");
    const id = String(n).padStart(6, "0");
    assert.equal(lines.length, 4, `job ${n} should keep four lines`);
    assert.match(lines[0] ?? "", new RegExp(`^${n}\\. `));
    assert.match(lines[1] ?? "", /^📍 /);
    assert.match(lines[2] ?? "", /^💰 /);
    assert.equal(
      lines[2],
      `💰 ₹${17 + n},000–₹${22 + n},000`,
    );
    assert.match(lines[3] ?? "", /^👉 /);
    assert.ok(
      (lines[3] ?? "").includes(
        `https://www.aslijobs.com/jobs/AJ-2026-${id}?lang=kn`,
      ),
    );
    assert.equal((lines[3] ?? "").includes("URL"), false);
  }
}

describe("structure-aware inbox translation", { concurrency: 1 }, () => {
  beforeEach(() => {
    resetInboxTranslationCache();
  });
  it("keeps every job block, field line, emoji, salary, and url", async () => {
    const source = jobList(8);
    const requests: string[] = [];
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async (request) => {
        requests.push(request.text);
        return providerResult(
          translateFlattened(request.text, (segment) => `ಕನ್ನಡ ${corruptProviderText(segment)}`),
        );
      },
    });

    assert.equal(result.failed, false);
    assert.equal(result.translated, true);
    assert.equal(result.providerRequests, 1);
    assert.equal(requests.length, 1);
    assert.ok((requests[0]?.length ?? 0) <= SARVAM_TRANSLATE_INPUT_MAX);
    assert.equal(requests[0]?.includes("\n"), false);
    assertJobListStructure(result.text, 8);
    assert.equal(requests.some((request) => request.includes("https://")), false);
    assert.equal(requests.some((request) => request.includes("₹")), false);
    assert.equal(result.text.includes("ಕನ್ನಡ"), true);
  });

  it("preserves paragraph gaps without inserting extra blank lines", async () => {
    const source = [
      "Please share your resume.",
      "We will call you tomorrow.",
      "",
      "",
      "Bring a photo id.",
    ].join("\n");
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "hi",
      translateImpl: async (request) =>
        providerResult(translateFlattened(request.text, (segment) => `[hi] ${segment}`)),
    });

    assert.equal(
      result.text,
      [
        "[hi] Please share your resume.",
        "[hi] We will call you tomorrow.",
        "",
        "",
        "[hi] Bring a photo id.",
      ].join("\n"),
    );
  });

  it("joins a wrapped sentence and still keeps the following paragraph", async () => {
    const source = [
      "Your interview is scheduled",
      "for tomorrow at 10 AM.",
      "",
      "Please bring your resume.",
    ].join("\n");
    const requests: string[] = [];
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "ta",
      translateImpl: async (request) => {
        requests.push(request.text);
        return providerResult(
          translateFlattened(request.text, (segment) => `தமிழ் ${segment}`),
        );
      },
    });

    assert.equal(requests.length, 1);
    assert.match(requests[0] ?? "", /scheduled for tomorrow at 10 AM/);
    assert.match(requests[0] ?? "", /Please bring your resume/);
    assert.equal(
      result.text,
      "தமிழ் Your interview is scheduled for tomorrow at 10 AM.\n\nதமிழ் Please bring your resume.",
    );
  });

  it("restores urls, job ids, phones, emails, dates, and emojis after a destructive provider", async () => {
    const source = [
      "Call +91 98765 43210 or mail team@aslijobs.com.",
      "Interview on 27/10/2026.",
      "Reference AJ-2026-000044.",
      "👋 See you there.",
    ].join("\n");
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "ml",
      translateImpl: async (request) =>
        providerResult(
          translateFlattened(request.text, (segment) => `ml ${corruptProviderText(segment)}`),
        ),
    });

    assert.equal(result.failed, false, result.text);
    assert.ok(result.text.includes("+91 98765 43210"), result.text);
    assert.ok(result.text.includes("team@aslijobs.com"), result.text);
    assert.ok(result.text.includes("27/10/2026"), result.text);
    assert.ok(result.text.includes("AJ-2026-000044"), result.text);
    assert.match(result.text, /^👋 /m);
    assert.equal(result.text.includes("PHONE"), false);
    assert.equal(result.text.includes("EMAIL"), false);
    assert.equal(result.text.includes("DATE"), false);
    assert.equal(result.text.includes("JOB"), false);
  });

  it("keeps the same layout when the authored text is translated into each language", async () => {
    const source = jobList(2);
    assert.deepEqual(
      [...INBOX_TRANSLATION_LANGUAGES],
      ["en", "hi", "te", "ta", "kn", "ml"],
    );

    for (const language of INBOX_TRANSLATION_LANGUAGES) {
      const result = await translateInboxText({
        text: source,
        sourceLanguage: "te",
        targetLanguage: language,
        autoDetectSource: true,
        translateImpl: async (request) => {
          assert.equal(request.targetLanguage, language);
          assert.equal(request.autoDetectSource, true);
          return providerResult(
            translateFlattened(
              request.text,
              (segment) => `${language} ${corruptProviderText(segment)}`,
            ),
          );
        },
      });
      assert.equal(result.failed, false, language);
      assertJobListStructure(result.text, 2);
    }
  });

  it("does not collapse layout when a structured translation is translated again", async () => {
    const source = jobList(3);
    const telugu = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "te",
      translateImpl: async (request) =>
        providerResult(
          translateFlattened(request.text, (segment) => `తెలుగు ${corruptProviderText(segment)}`),
        ),
    });
    const kannada = await translateInboxText({
      text: telugu.text,
      sourceLanguage: "te",
      targetLanguage: "kn",
      autoDetectSource: true,
      translateImpl: async (request) =>
        providerResult(
          translateFlattened(request.text, (segment) => `ಕನ್ನಡ ${corruptProviderText(segment)}`),
        ),
    });

    assertJobListStructure(telugu.text, 3);
    assertJobListStructure(kannada.text, 3);
    assert.equal(kannada.text.split("\n\n").length, 4);
  });

  it("returns the original draft when any segment fails", async () => {
    const source = jobList(2);
    const httpFailure = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async (request) => {
        if (request.text.includes("Employer 2")) {
          return providerResult(request.text, {
            translated: false,
            failed: true,
            errorCode: "http_error",
          });
        }
        return providerResult(request.text);
      },
    });
    assert.equal(httpFailure.failed, true);
    assert.equal(httpFailure.translated, false);
    assert.equal(httpFailure.errorCode, "http_error");
    assert.equal(httpFailure.text, source);

    const thrown = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async () => {
        throw new Error("socket closed");
      },
    });
    assert.equal(thrown.failed, true);
    assert.equal(thrown.errorCode, "exception");
    assert.equal(thrown.text, source);

    const missingKey = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async () =>
        providerResult(source, {
          translated: false,
          failed: true,
          errorCode: "missing_key",
        }),
    });
    assert.equal(missingKey.errorCode, "missing_key");
    assert.equal(missingKey.text, source);
  });

  it("keeps the original draft when the provider drops layout markers", async () => {
    const source = jobList(2);
    let calls = 0;
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async (request) => {
        calls += 1;
        assert.ok(request.text.length <= SARVAM_TRANSLATE_INPUT_MAX);
        const stripped = request.text.replace(/__AJ\d+__/g, "").replace(/\n/g, " ").trim();
        return providerResult(stripped || "one flattened paragraph");
      },
    });

    assert.ok(calls >= 1);
    assert.equal(result.failed, true);
    assert.ok(
      result.errorCode === "layout_mismatch" ||
        result.errorCode === "protected_token",
    );
    assert.equal(result.text, source);
  });

  it("rejects a segment when the provider drops a protected url", async () => {
    const source = "Apply Now: https://www.aslijobs.com/jobs/AJ-2026-000030?lang=kn";
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async () => providerResult("link removed"),
    });
    assert.equal(result.failed, true);
    assert.equal(result.errorCode, "protected_token");
    assert.equal(result.text, source);
  });

  it("ignores newlines invented inside one translated line", async () => {
    const source = "Please share your resume.\nWe will call you tomorrow.";
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "te",
      translateImpl: async (request) =>
        providerResult(
          request.text.replace(
            "Please share your resume.",
            "Please\nshare your\nresume.",
          ),
        ),
    });
    assert.equal(result.failed, false);
    assert.equal(result.text, source);
    assert.equal(result.text.split("\n").length, 2);
  });

  it("leaves an already-target-language message unchanged", async () => {
    const source = "ನಮಸ್ಕಾರ\n\nಧನ್ಯವಾದಗಳು";
    let calls = 0;
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "kn",
      targetLanguage: "kn",
      translateImpl: async () => {
        calls += 1;
        return providerResult("changed");
      },
    });
    assert.equal(calls, 0);
    assert.equal(result.skipped, true);
    assert.equal(result.text, source);
  });

  it("translates leftover English in a mixed Kannada message when target is kn", async () => {
    const source = [
      "ASLIJOBS",
      "",
      "🎉 ನಿಮ್ಮ AsliJobs ಖಾತೆ ಸಿದ್ಧವಾಗಿದೆ!",
      "",
      "You can now search for jobs and apply.",
      "Our team will review your profile within 24 hours.",
    ].join("\n");
    let calls = 0;
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "kn",
      targetLanguage: "kn",
      translateImpl: async (request) => {
        calls += 1;
        return providerResult(
          translateFlattened(request.text, (segment) =>
            segment.includes("You can now")
              ? "ನೀವು ಈಗ ಉದ್ಯೋಗಗಳನ್ನು ಹುಡುಕಬಹುದು."
              : segment.includes("Our team")
                ? "ನಮ್ಮ ತಂಡವು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ."
                : `ಕನ್ನಡ ${segment}`,
          ),
        );
      },
    });
    assert.ok(calls >= 1);
    assert.equal(result.failed, false);
    assert.equal(result.skipped, false);
    assert.equal(result.translated, true);
    assert.match(result.text, /ನೀವು ಈಗ/);
    assert.equal(result.text.includes("You can now search"), false);
  });

  it("falls back to per-segment translation when batched layout markers are dropped", async () => {
    const source = [
      "Hi chandu,",
      "",
      "Your AsliJobs account has been created successfully!",
      "",
      "Our team is checking your account. This usually takes upto 24 hours.",
      "",
      "Once approved, you can start posting jobs and connecting with job seekers.",
    ].join("\n");
    let calls = 0;
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "kn",
      translateImpl: async (request) => {
        calls += 1;
        // First attempts (batched) drop separators/markers; later single-core
        // calls keep the payload so the fallback can succeed.
        if (request.text.includes("[[AJSEG") || request.text.includes("__AJ")) {
          const hasManyTokens = (request.text.match(/__AJ\d+__/g) ?? []).length > 1;
          if (hasManyTokens) {
            return providerResult(
              request.text.replace(/__AJ\d+__/g, " ").replace(/\s+/g, " ").trim(),
            );
          }
        }
        return providerResult(
          translateFlattened(request.text, (segment) => `ಕನ್ನಡ ${segment}`),
        );
      },
    });
    assert.ok(calls >= 2);
    assert.equal(result.failed, false);
    assert.equal(result.translated, true);
    assert.match(result.text, /ಕನ್ನಡ/);
    assert.equal(result.text.split("\n\n").length >= 3, true);
  });

  for (const target of INBOX_TRANSLATION_LANGUAGES.filter((code) => code !== "en")) {
    it(`translates English account-creation copy into ${target}`, async () => {
      const source = [
        "Hi chandu,",
        "",
        "Your AsliJobs account has been created successfully!",
        "",
        "Our team is checking your account. This usually takes upto 24 hours.",
      ].join("\n");
      const result = await translateInboxText({
        text: source,
        sourceLanguage: "en",
        targetLanguage: target,
        translateImpl: async (request) =>
          providerResult(
            translateFlattened(request.text, (segment) =>
              `${target}:${segment.replace(/[A-Za-z]+/g, (word) => `${target}_${word}`)}`,
            ),
          ),
      });
      assert.equal(result.failed, false);
      assert.equal(result.translated, true);
      assert.match(result.text, new RegExp(`${target}:`));
      assert.equal(
        result.text.includes("Your AsliJobs account has been created"),
        false,
      );
      assert.equal(result.text.split("\n\n").length, 3);
    });
  }

  it("splits an oversized paragraph instead of truncating it", async () => {
    const source = `${"alpha ".repeat(200)}end.`;
    const requests: string[] = [];
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "hi",
      translateImpl: async (request) => {
        requests.push(request.text);
        assert.ok(request.text.length <= 1000);
        return providerResult(request.text);
      },
    });
    assert.ok(requests.length >= 2);
    assert.equal(requests.join(" ").includes("alpha"), true);
    assert.ok(requests.some((request) => request.includes("end.")));
    assert.equal(result.failed, false);
    assert.ok(result.text.includes("end."));
    assert.equal(result.providerRequests, requests.length);
    assert.ok(requests.length < source.split(" ").length);
  });

  it("rejects deleted, duplicated, reordered, and corrupted placeholders", async () => {
    const source = jobList(2);
    const cases: Array<{ name: string; corrupt: (text: string) => string }> = [
      {
        name: "deleted",
        corrupt: (text) => text.replace(/__AJ\d+__/g, ""),
      },
      {
        name: "duplicated",
        corrupt: (text) => text.replace(/__AJ\d+__/, (token) => `${token}${token}`),
      },
      {
        name: "reordered",
        corrupt: swapInlinePlaceholders,
      },
      {
        name: "corrupted",
        corrupt: (text) => text.replace(/__AJ(\d+)__/g, "__AX$1__"),
      },
    ];

    for (const item of cases) {
      resetInboxTranslationCache();
      let calls = 0;
      const result = await translateInboxText({
        text: source,
        sourceLanguage: "en",
        targetLanguage: "hi",
        translateImpl: async (request) => {
          calls += 1;
          return providerResult(item.corrupt(request.text));
        },
      });
      assert.ok(calls >= 1, item.name);
      assert.equal(result.cacheHit, false, item.name);
      // Reordering tokens across a batched multi-job payload can still succeed
      // via per-segment fallback when each line only needs one protected value.
      if (item.name === "reordered" && !result.failed) {
        assert.equal(result.translated, true, item.name);
        assertJobListStructure(result.text, 2);
        continue;
      }
      assert.equal(result.failed, true, item.name);
      assert.equal(result.translated, false, item.name);
      assert.equal(result.text, source, item.name);
    }
  });

  it("serves an identical translation from cache and misses a different language", async () => {
    const source = "Please confirm the Monday interview.";
    let calls = 0;
    const translateImpl = async (request: { text: string }) => {
      calls += 1;
      return providerResult(translateFlattened(request.text, (segment) => `te ${segment}`));
    };
    const first = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "te",
      translateImpl,
    });
    const second = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "te",
      translateImpl,
    });
    const hindi = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "hi",
      translateImpl,
    });

    assert.equal(first.failed, false);
    assert.equal(first.providerRequests, 1);
    assert.equal(first.cacheHit, false);
    assert.equal(second.providerRequests, 0);
    assert.equal(second.cacheHit, true);
    assert.equal(second.text, first.text);
    assert.equal(hindi.cacheHit, false);
    assert.equal(hindi.providerRequests, 1);
    assert.equal(calls, 2);
  });

  it("does not cache a failed translation", async () => {
    const source = "Please confirm the Tuesday interview.";
    let calls = 0;
    const translateImpl = async () => {
      calls += 1;
      return providerResult(source, {
        translated: false,
        failed: true,
        errorCode: "http_error",
      });
    };
    const first = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "ta",
      translateImpl,
    });
    const second = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "ta",
      translateImpl,
    });
    assert.equal(first.failed, true);
    assert.equal(first.text, source);
    assert.equal(second.failed, true);
    assert.equal(second.cacheHit, false);
    assert.equal(calls, 2);
  });

  it("joins concurrent requests for the same draft into one provider call", async () => {
    const source = "Concurrent draft should call the provider once.";
    let calls = 0;
    let release = (): void => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const translateImpl = async (request: { text: string }) => {
      calls += 1;
      await gate;
      return providerResult(translateFlattened(request.text, (segment) => `hi ${segment}`));
    };
    const pending = Promise.all([
      translateInboxText({
        text: source,
        sourceLanguage: "en",
        targetLanguage: "hi",
        translateImpl,
      }),
      translateInboxText({
        text: source,
        sourceLanguage: "en",
        targetLanguage: "hi",
        translateImpl,
      }),
    ]);
    for (let attempt = 0; attempt < 20 && calls === 0; attempt += 1) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    assert.equal(calls, 1);
    release();
    const [first, second] = await pending;
    assert.equal(calls, 1);
    assert.equal(first.providerRequests + second.providerRequests, 1);
    assert.equal(first.text, second.text);
    assert.equal(first.failed, false);
  });

  it("packs a long job list into the fewest chunks that fit the provider limit", async () => {
    const source = jobList(40);
    const requests: string[] = [];
    const result = await translateInboxText({
      text: source,
      sourceLanguage: "en",
      targetLanguage: "ml",
      translateImpl: async (request) => {
        requests.push(request.text);
        assert.ok(request.text.length <= SARVAM_TRANSLATE_INPUT_MAX);
        return providerResult(
          translateFlattened(request.text, (segment) => `മലയാളം ${corruptProviderText(segment)}`),
        );
      },
    });

    const contentLines = source.split("\n").filter((line) => line.trim()).length;
    assert.equal(result.failed, false);
    assertJobListStructure(result.text, 40);
    assert.equal(result.providerRequests, requests.length);
    assert.ok(requests.length > 1);
    assert.ok(requests.length < contentLines);
    assert.ok(requests.every((request) => request.length <= SARVAM_TRANSLATE_INPUT_MAX));
    for (let n = 1; n <= 40; n += 1) {
      const id = String(n).padStart(6, "0");
      assert.ok(result.text.includes(`AJ-2026-${id}?lang=kn`));
    }
  });
});

function swapInlinePlaceholders(text: string): string {
  const inline = [...text.matchAll(/ __AJ\d+__/g)].map((match) => match[0].slice(1));
  const first = inline[0];
  const second = inline[1];
  if (!first || !second) return `${text} reordered`;
  const start = text.indexOf(first);
  const next = text.indexOf(second, start + first.length);
  if (start < 0 || next < 0) return `${text} reordered`;
  return (
    text.slice(0, start) +
    second +
    text.slice(start + first.length, next) +
    first +
    text.slice(next + second.length)
  );
}
