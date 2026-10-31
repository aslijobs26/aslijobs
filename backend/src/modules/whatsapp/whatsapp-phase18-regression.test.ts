import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractSalaryBand } from "./whatsapp-bot.criteria.js";
import {
  buildDeterministicReply,
  nextClarifyLoopState,
  publicJobFilters,
  resolveTurnUnderstanding,
  understandLocally,
  type PendingSearchContext,
} from "./whatsapp-bot.logic.js";

function toPending(u: ReturnType<typeof resolveTurnUnderstanding>): PendingSearchContext {
  return {
    intent: u.intent,
    category: u.category,
    location: u.location,
    locationKind: u.locationKind,
    minSalary: u.minSalary,
    maxSalary: u.maxSalary,
    salaryBasis: u.salaryBasis,
    openSearch: u.openSearch,
    experienceLevel: u.experienceLevel,
    originalExperienceYears: u.originalExperienceYears,
    experienceRangeLabel: u.experienceRangeLabel,
  };
}

/** Simulate durable session merge across turns (same path as processInboundTurn). */
function playTurns(messages: string[]) {
  let previous: PendingSearchContext | null = null;
  let lastIntent = "";
  const turns: Array<ReturnType<typeof resolveTurnUnderstanding>> = [];
  for (const text of messages) {
    const raw = understandLocally(text);
    // Greetings do not wipe search memory in the service for protocol Hi;
    // resolveTurnUnderstanding leaves GREETING without merging — keep prior pending.
    if (raw.intent === "GREETING") {
      turns.push(raw);
      continue;
    }
    const merged = resolveTurnUnderstanding(text, raw, previous, lastIntent || previous?.intent);
    turns.push(merged);
    if (merged.intent === "JOB_SEARCH" || merged.intent === "JOB_COUNT" || merged.intent === "JOB_DETAILS") {
      previous = toPending(merged);
      lastIntent = merged.intent;
    }
  }
  return { turns, previous };
}

describe("Phase 18 mandatory salary-correction multi-turn regression", () => {
  it("parses Telugu salary show cues including chunchandi / chudu", () => {
    for (const text of [
      "20,000 lo chunchandi",
      "20000 lo chudu",
      "20k lo chupinchi",
      "₹20,000",
      "Rs 20000",
      "Salary 20k",
      "Change salary to 20000",
    ]) {
      assert.equal(extractSalaryBand(text).min, 20000, text);
      const u = understandLocally(text);
      assert.equal(u.minSalary, 20000, text);
      assert.equal(u.intent, "JOB_SEARCH", text);
    }
    assert.equal(extractSalaryBand("40k vaddu, 20k chudu").min, 20000);
  });

  it("Driver → Hi → electrician → I want jobs → 40k context → 20k chunchandi → Electrician → Hyderabad", () => {
    // Seed: prior turn established ₹40,000 preference (the bug report state).
    let previous: PendingSearchContext = {
      intent: "JOB_SEARCH",
      category: "Electrician",
      location: "Hyderabad",
      locationKind: "city",
      minSalary: 40000,
      maxSalary: null,
      salaryBasis: "monthly",
      openSearch: false,
    };

    // Exact bug phrase: must update salary to 20k and keep role+city.
    const salaryFix = resolveTurnUnderstanding(
      "20,000 lo chunchandi",
      understandLocally("20,000 lo chunchandi"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(salaryFix.intent, "JOB_SEARCH");
    assert.equal(salaryFix.category, "Electrician");
    assert.equal(salaryFix.location, "Hyderabad");
    assert.equal(salaryFix.minSalary, 20000);
    assert.notEqual(salaryFix.minSalary, 40000);
    const filtersAfterSalary = publicJobFilters(salaryFix);
    assert.equal(filtersAfterSalary.minSalary, 20000);
    assert.equal(filtersAfterSalary.search, "Electrician");
    assert.equal(filtersAfterSalary.city, "Hyderabad");
    previous = toPending(salaryFix);

    // Repeating role must not wipe salary or location.
    const roleAgain = resolveTurnUnderstanding(
      "Electrician",
      understandLocally("Electrician"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(roleAgain.category, "Electrician");
    assert.equal(roleAgain.location, "Hyderabad");
    assert.equal(roleAgain.minSalary, 20000);
    previous = toPending(roleAgain);

    const locAgain = resolveTurnUnderstanding(
      "Hyderabad lo kavali",
      understandLocally("Hyderabad lo kavali"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(locAgain.category, "Electrician");
    assert.equal(locAgain.location, "Hyderabad");
    assert.equal(locAgain.minSalary, 20000);
    previous = toPending(locAgain);

    const roleThird = resolveTurnUnderstanding(
      "Electrician",
      understandLocally("Electrician"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(roleThird.category, "Electrician");
    assert.equal(roleThird.location, "Hyderabad");
    assert.equal(roleThird.minSalary, 20000);
    assert.equal(publicJobFilters(roleThird).minSalary, 20000);
  });

  it("full natural flow: Driver typo, greeting, electrician, I want jobs, salary correct, show more", () => {
    const { turns, previous } = playTurns([
      "Driver job ka ali",
      "Hi",
      "Naku electrician job kavali",
      "I want jobs",
    ]);

    assert.equal(turns[0]?.category, "Driver");
    assert.equal(turns[1]?.intent, "GREETING");
    assert.equal(turns[2]?.category, "Electrician");
    // Greeting must not erase role; vague "I want jobs" keeps Electrician.
    assert.equal(turns[3]?.category, "Electrician");
    assert.equal(previous?.category, "Electrician");

    // User later sets location + old salary, then corrects with chunchandi.
    const withCity = resolveTurnUnderstanding(
      "Hyderabad lo kavali",
      understandLocally("Hyderabad lo kavali"),
      previous,
      "JOB_SEARCH",
    );
    assert.equal(withCity.location, "Hyderabad");
    assert.equal(withCity.category, "Electrician");

    const with40k = resolveTurnUnderstanding(
      "Naku salary 40,000 kavali",
      understandLocally("Naku salary 40,000 kavali"),
      toPending(withCity),
      "JOB_SEARCH",
    );
    assert.equal(with40k.minSalary, 40000);

    const with20k = resolveTurnUnderstanding(
      "20,000 lo chunchandi",
      understandLocally("20,000 lo chunchandi"),
      toPending(with40k),
      "JOB_SEARCH",
    );
    assert.equal(with20k.minSalary, 20000);
    assert.equal(with20k.category, "Electrician");
    assert.equal(with20k.location, "Hyderabad");

    const showMore = resolveTurnUnderstanding(
      "Inka jobs chupinchu",
      understandLocally("Inka jobs chupinchu"),
      toPending(with20k),
      "JOB_SEARCH",
    );
    assert.equal(showMore.showMore, true);
    assert.equal(showMore.minSalary, 20000);
    assert.equal(showMore.category, "Electrician");
    assert.equal(showMore.location, "Hyderabad");
    assert.equal(publicJobFilters(showMore).minSalary, 20000);
  });

  it("location change Vijayawada keeps role + corrected salary", () => {
    const merged = resolveTurnUnderstanding(
      "Hyderabad badhulu Vijayawada lo chudu",
      understandLocally("Hyderabad badhulu Vijayawada lo chudu"),
      {
        intent: "JOB_SEARCH",
        category: "Electrician",
        location: "Hyderabad",
        locationKind: "city",
        minSalary: 20000,
        salaryBasis: "monthly",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.location, "Vijayawada");
    assert.equal(merged.category, "Electrician");
    assert.equal(merged.minSalary, 20000);
  });

  it("no-match copy uses latest salary not the stale 40k after correction", () => {
    const reply = buildDeterministicReply("en", {
      situation: "job_search_no_match",
      location: "Hyderabad",
      role: "Electrician",
      minSalary: 20000,
      lowerSalaryCount: 2,
      undisclosedCount: 0,
      nearbyCity: "",
    });
    assert.match(reply ?? "", /20,000/);
    assert.doesNotMatch(reply ?? "", /40,000/);
  });

  it("clarify loop breaks after repeated same missing field", () => {
    const first = nextClarifyLoopState({
      situation: "clarify",
      missing: "location",
      priorMissing: "",
      priorAttempts: 0,
    });
    assert.equal(first.attempts, 1);
    assert.equal(first.exhausted, false);

    const second = nextClarifyLoopState({
      situation: "clarify",
      missing: "location",
      priorMissing: "location",
      priorAttempts: 1,
    });
    assert.equal(second.attempts, 2);
    assert.equal(second.exhausted, false);

    const third = nextClarifyLoopState({
      situation: "clarify",
      missing: "location",
      priorMissing: "location",
      priorAttempts: 2,
    });
    assert.equal(third.exhausted, true);
    assert.equal(third.attempts, 0);

    const copy = buildDeterministicReply("en", {
      situation: "clarify_exhausted",
      missing: "location",
      knownRole: "Electrician",
      knownLocation: "",
      knownMinSalary: 20000,
    });
    assert.match(copy ?? "", /Electrician/i);
    assert.match(copy ?? "", /location/i);
  });

  it("multi-city location corrections prefer the target city", () => {
    const prior: PendingSearchContext = {
      intent: "JOB_SEARCH",
      category: "Driver",
      location: "Hyderabad",
      locationKind: "city",
      minSalary: 25000,
      salaryBasis: "monthly",
      openSearch: false,
    };
    const cases: Array<{ text: string; location: string }> = [
      { text: "Hyderabad badhulu Vijayawada lo chudu", location: "Vijayawada" },
      { text: "Chennai instead of Hyderabad", location: "Chennai" },
      { text: "Location change to Bangalore", location: "Bangalore" },
      { text: "Vijayawada ki marchu", location: "Vijayawada" },
      { text: "rather than Hyderabad show Chennai", location: "Chennai" },
    ];
    for (const { text, location } of cases) {
      const merged = resolveTurnUnderstanding(text, understandLocally(text), prior, "JOB_SEARCH");
      assert.equal(merged.location, location, text);
      assert.equal(merged.category, "Driver", text);
      assert.equal(merged.minSalary, 25000, text);
    }
  });

  it("clarify loops reset when the missing field changes, and exhaust separately", () => {
    const roleAsk = nextClarifyLoopState({
      situation: "clarify",
      missing: "role",
      priorMissing: "location",
      priorAttempts: 2,
    });
    assert.equal(roleAsk.attempts, 1);
    assert.equal(roleAsk.missing, "role");
    assert.equal(roleAsk.exhausted, false);

    const roleRepeat = nextClarifyLoopState({
      situation: "clarify",
      missing: "role",
      priorMissing: "role",
      priorAttempts: 2,
    });
    assert.equal(roleRepeat.exhausted, true);

    // Non location/role clarify situations do not accumulate the job-search loop.
    const whichJob = nextClarifyLoopState({
      situation: "clarify",
      missing: "which_job",
      priorMissing: "role",
      priorAttempts: 2,
    });
    assert.equal(whichJob.attempts, 0);
    assert.equal(whichJob.exhausted, false);

    const purpose = nextClarifyLoopState({
      situation: "clarify",
      missing: "purpose",
      priorMissing: "purpose",
      priorAttempts: 5,
    });
    assert.equal(purpose.exhausted, false);
  });

  it("search_failed copy is distinct from a successful empty job search", () => {
    const empty = buildDeterministicReply("en", {
      situation: "jobs",
      location: "Hyderabad",
      role: "Electrician",
      empty: true,
      total: 0,
      jobs: [],
    });
    const failed = buildDeterministicReply("en", {
      situation: "search_failed",
      location: "Hyderabad",
      role: "Electrician",
    });
    assert.match(empty ?? "", /could not find|couldn't find|no .*job/i);
    assert.match(failed ?? "", /couldn't fetch/i);
    assert.notEqual(empty, failed);
    assert.doesNotMatch(failed ?? "", /could not find any/i);
  });
});

describe("Phase 18 rapid consecutive turns (ordered merge)", () => {
  it("applies rapid consecutive updates in arrival order without stale salary/location", async () => {
    const { runInPhoneOrder } = await import("./whatsapp-phone-order.js");
    let previous: PendingSearchContext = {
      intent: "JOB_SEARCH",
      category: "Electrician",
      location: "Hyderabad",
      locationKind: "city",
      minSalary: 40000,
      salaryBasis: "monthly",
      openSearch: false,
    };
    const snapshots: Array<{ min: number | null | undefined; loc: string; cat: string }> = [];

    const turn = (text: string) =>
      runInPhoneOrder("9000999918", async () => {
        const merged = resolveTurnUnderstanding(
          text,
          understandLocally(text),
          previous,
          "JOB_SEARCH",
        );
        previous = toPending(merged);
        snapshots.push({
          min: merged.minSalary,
          loc: merged.location,
          cat: merged.category,
        });
      });

    // Fire overlapping promises; per-phone order must serialize merges.
    const p1 = turn("20,000 lo chunchandi");
    const p2 = turn("Vijayawada ki marchu");
    const p3 = turn("Inka jobs chupinchu");
    await Promise.all([p1, p2, p3]);

    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]?.min, 20000);
    assert.equal(snapshots[0]?.loc, "Hyderabad");
    assert.equal(snapshots[1]?.min, 20000);
    assert.equal(snapshots[1]?.loc, "Vijayawada");
    assert.equal(snapshots[2]?.min, 20000);
    assert.equal(snapshots[2]?.loc, "Vijayawada");
    assert.equal(snapshots[2]?.cat, "Electrician");
    assert.equal(previous.minSalary, 20000);
    assert.equal(previous.location, "Vijayawada");
    assert.equal(previous.category, "Electrician");
  });
});
