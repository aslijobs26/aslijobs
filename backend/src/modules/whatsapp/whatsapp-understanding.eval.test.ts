import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jobOrdinalFromText } from "./whatsapp-bot.criteria.js";
import {
  competingPlaces,
  correctCitySpelling,
  correctRoleSpelling,
  disambiguationCopy,
  knownPlaceNames,
  knownRoleNames,
  renderJobSearchReply,
  resolveTurnUnderstanding,
  serviceErrorCopy,
  understandLocally,
} from "./whatsapp-bot.logic.js";
import { withSearchCatalog } from "./whatsapp-search-catalog.js";
import {
  openAiTransportFailure,
  parseUnderstandProposal,
} from "./openai-assist.client.js";
import { sarvamFallbackUnderstanding } from "./sarvam.client.js";
import {
  evaluateUnderstandingDataset,
  hallucinationChecks,
  safetyInvariants,
  WHATSAPP_UNDERSTANDING_EVAL,
} from "./whatsapp-understanding.eval.js";

describe("WhatsApp understanding evaluation dataset", () => {
  it("scores local understanding without a live model call", () => {
    const report = evaluateUnderstandingDataset();
    assert.deepEqual(report.failures, [], JSON.stringify(report.failures, null, 2));
    assert.equal(report.passed, WHATSAPP_UNDERSTANDING_EVAL.length);
    assert.equal(report.total, report.passed);
  });

  it("rejects hallucinated OpenAI slots and keeps application status grounded", () => {
    assert.deepEqual(hallucinationChecks(), []);
  });

  it("keeps locality, city, and search-failure distinctions", () => {
    assert.deepEqual(safetyInvariants(), []);
  });
});

function deletions(value: string): string[] {
  const compact = value.replace(/\s+/g, "");
  const out: string[] = [];
  for (let index = 1; index < compact.length - 1; index += 1) {
    out.push(`${compact.slice(0, index)}${compact.slice(index + 1)}`.toLowerCase());
  }
  return out;
}

describe("role and city correction accuracy", () => {
  it("corrects 100+ city spellings and does not substitute a different city", () => {
    const names = knownPlaceNames().filter((name) => name.length >= 8);
    const cases = names.flatMap((name) => deletions(name).map((token) => ({ token, expected: name })));
    assert.ok(cases.length >= 100, `city cases ${cases.length}`);
    let correct = 0;
    let wrong = 0;
    for (const item of cases) {
      const actual = correctCitySpelling(item.token);
      if (actual === item.expected) correct += 1;
      else if (actual) wrong += 1;
    }
    assert.equal(wrong, 0);
    assert.ok(correct / cases.length >= 0.85, `city accuracy ${correct}/${cases.length}`);
    assert.equal(correctCitySpelling("hyderbad"), "Hyderabad");
    assert.equal(correctCitySpelling("vijaywada"), "Vijayawada");
    assert.equal(correctCitySpelling("secundrabad"), "Secunderabad");
    assert.equal(correctCitySpelling("bhimavarm"), "Bhimavaram");
    assert.equal(correctCitySpelling("vizag"), "");
    assert.equal(understandLocally("vizag lo electrician jobs").location, "Visakhapatnam");
    assert.equal(correctCitySpelling("atlantis"), "");
    assert.equal(understandLocally("driver jobs in Atlantis").location === "Hyderabad", false);
  });

  it("corrects 100+ role spellings and does not map an unrelated trade", () => {
    const names = knownRoleNames().filter((name) => name.replace(/\s/g, "").length >= 6);
    const cases = names.flatMap((name) => deletions(name).map((token) => ({ token, expected: name })));
    assert.ok(cases.length >= 100, `role cases ${cases.length}`);
    let wrong = 0;
    let correct = 0;
    for (const item of cases) {
      const actual = correctRoleSpelling(item.token);
      if (actual === item.expected) correct += 1;
      else if (actual && actual !== item.expected) {
        wrong += 1;
        if (wrong === 1) {
          assert.fail(`${item.token} → ${actual}, expected ${item.expected}`);
        }
      }
    }
    assert.equal(wrong, 0);
    assert.ok(correct / cases.length >= 0.8, `role accuracy ${correct}/${cases.length}`);
    assert.equal(understandLocally("electrian jobs").category, "Electrician");
    assert.equal(correctRoleSpelling("plumber") === "Painter", false);
    assert.equal(understandLocally("basket weaver jobs in Hyderabad").category, "Basket Weaver");
  });

  it("maps a single catalog synonym and asks when several driver titles exist", () => {
    const mapped = withSearchCatalog({ titles: ["Commercial Driver"], cities: ["Hyderabad"] }, () =>
      understandLocally("driver jobs in Hyderabad"),
    );
    assert.equal(mapped.category, "Commercial Driver");
    assert.equal(mapped.clarifyField ?? "", "");

    const ambiguous = withSearchCatalog(
      { titles: ["Commercial Driver", "Car Driver"], cities: ["Hyderabad"] },
      () => understandLocally("driver jobs in Hyderabad"),
    );
    assert.equal(ambiguous.category, "");
    assert.equal(ambiguous.clarifyField, "which_role");
    assert.ok((ambiguous.clarifyOptions ?? []).length >= 2);

    const kept = understandLocally("electrician jobs in Hyderabad");
    assert.equal(kept.category, "Electrician");
    assert.equal(withSearchCatalog({ titles: Array.from({ length: 600 }, (_, i) => `Title ${i}`), cities: [] }, () =>
      understandLocally("basket weaver jobs").category,
    ), "Basket Weaver");
  });

  it("asks which city when two cities are named and keeps a locality inside its city", () => {
    assert.deepEqual(competingPlaces("driver jobs in Hyderabad and Chennai").sort(), ["Chennai", "Hyderabad"]);
    assert.deepEqual(competingPlaces("Madhapur Hyderabad jobs"), []);
    assert.equal(understandLocally("driver jobs in Hyderabad and Chennai").clarifyField, "which_city");
    assert.equal(understandLocally("Madhapur Hyderabad driver jobs").location, "Madhapur");
    assert.match(disambiguationCopy("en", "which_city", ["Vijayawada", "Guntur"]), /Vijayawada/);
  });
});

describe("catalog, aliases, and fallbacks", () => {
  it("parses a salary follow-up without dropping the prior role", () => {
    const merged = resolveTurnUnderstanding(
      "20000 lo chunchandi",
      understandLocally("20000 lo chunchandi"),
      {
        location: "Hyderabad",
        category: "Electrician",
        intent: "JOB_SEARCH",
        minSalary: 40000,
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Electrician");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.minSalary, 20000);
  });

  it("corrects experience without asking for the role again", () => {
    const merged = resolveTurnUnderstanding(
      "3 years",
      understandLocally("3 years"),
      {
        location: "Hyderabad",
        category: "Driver",
        intent: "JOB_SEARCH",
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Driver");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.originalExperienceYears, 3);
  });

  it("does not resolve a job number that was not shown", () => {
    assert.equal(jobOrdinalFromText("apply for the second job"), 2);
    assert.equal(jobOrdinalFromText("apply for the 9th job"), null);
    const shown = [{ jobId: "J1" }, { jobId: "J2" }];
    const ordinal = jobOrdinalFromText("apply for the second job") ?? 0;
    assert.equal(shown[ordinal - 1]?.jobId, "J2");
    assert.equal(shown[4], undefined);
  });

  it("uses a different sentence for a database failure than for no matching jobs", () => {
    const empty = renderJobSearchReply({
      language: "en",
      location: "Hyderabad",
      jobTitle: "Driver",
      jobs: [],
    });
    const failed = serviceErrorCopy("en");
    assert.notEqual(empty, failed);
    assert.match(failed, /try again|could not|unable|problem/i);
  });

  it("keeps the local understanding when Sarvam falls back", () => {
    const text = "driver jobs in Hyderabad";
    const fallback = sarvamFallbackUnderstanding(text);
    assert.equal(fallback.source, "fallback");
    assert.equal(fallback.understanding.intent, understandLocally(text).intent);
    assert.equal(fallback.understanding.category, "Driver");
    assert.equal(fallback.understanding.location, "Hyderabad");
  });

  it("rejects malformed OpenAI JSON and classifies timeouts", () => {
    assert.equal(parseUnderstandProposal("not json"), null);
    assert.equal(parseUnderstandProposal('{"intent":'), null);
    const parsed = parseUnderstandProposal(
      '{"intent":"JOB_SEARCH","language":"en","location":"Hyderabad","category":"Driver"}',
    );
    assert.equal(parsed?.intent, "JOB_SEARCH");
    assert.equal(parsed?.category, "Driver");
    const timeout = new Error("aborted");
    timeout.name = "TimeoutError";
    assert.equal(openAiTransportFailure(timeout), "timeout");
    assert.equal(openAiTransportFailure(new Error("boom")), "failed");
  });
});
