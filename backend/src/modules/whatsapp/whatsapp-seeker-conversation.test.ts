import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeSearchContext,
  buildDeterministicReply,
  clearedTemporarySearchSessionFields,
  detectProtocolTurn,
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

describe("seeker conversation: complete NL requests + greeting reset", () => {
  it("interior designer in bhubaneswar extracts role + city and is ready to search", () => {
    const u = understandLocally("interior designer in bhubaneswar");
    assert.equal(u.intent, "JOB_SEARCH");
    assert.equal(u.category, "Interior Designer");
    assert.equal(u.location, "Bhubaneswar");
    assert.equal(u.openSearch, false);
    const filters = publicJobFilters(u);
    assert.equal(filters.search, "Interior Designer");
    assert.equal(filters.city, "Bhubaneswar");
    // Must not fall through to clarify role/location.
    assert.ok(u.category && u.location);
  });

  it("complete one-message requests search without asking optional salary/experience", () => {
    for (const text of [
      "I want car driver jobs in Hyderabad",
      "Electrician jobs in Madhapur",
      "Carpenter jobs Hyderabad lo kavali",
      "Driver jobs in Hyderabad, salary 20000",
      "Fresher electrician jobs in Hyderabad",
      "Security Guard jobs in Hyderabad",
    ]) {
      const u = understandLocally(text);
      assert.equal(u.intent, "JOB_SEARCH", text);
      assert.ok(u.category, text);
      assert.ok(u.location || u.anyLocation, text);
    }
    const fresher = understandLocally("Fresher electrician jobs in Hyderabad");
    assert.equal(fresher.experienceLevel, "fresher");
    const paid = understandLocally("Driver jobs in Hyderabad, salary 20000");
    assert.equal(paid.minSalary, 20000);
  });

  it("standalone Hi is a greeting protocol and clears temporary search slots", () => {
    assert.equal(detectProtocolTurn("Hi"), "greeting");
    assert.equal(detectProtocolTurn("Namaste"), "greeting");
    assert.equal(detectProtocolTurn("నమస్కారం"), "greeting");
    assert.equal(detectProtocolTurn("Hi, I want driver jobs in Hyderabad"), null);

    const cleared = clearedTemporarySearchSessionFields();
    assert.equal(cleared.lastCategory, "");
    assert.equal(cleared.lastLocation, "");
    assert.equal(cleared.lastMinSalary, null);
    assert.deepEqual(cleared.lastJobs, []);

    const ctx = activeSearchContext({
      phone: "9000000000",
      ...cleared,
    } as never);
    assert.equal(ctx?.category || "", "");
    assert.equal(ctx?.location || "", "");
    assert.equal(ctx?.minSalary ?? null, null);

    const followUp = resolveTurnUnderstanding(
      "Show me jobs",
      understandLocally("Show me jobs"),
      ctx,
      "",
    );
    assert.equal(followUp.intent, "JOB_SEARCH");
    assert.equal(followUp.category, "");
    assert.equal(followUp.minSalary, null);
    assert.equal(followUp.openSearch, true);
  });

  it("greeting plus a full request keeps the job search", () => {
    const u = understandLocally("Hi, I want driver jobs in Hyderabad");
    assert.equal(u.intent, "JOB_SEARCH");
    assert.equal(u.category, "Driver");
    assert.equal(u.location, "Hyderabad");
    assert.notEqual(detectProtocolTurn("Hi, I want driver jobs in Hyderabad"), "greeting");
  });

  it("short multi-turn: carpenter then Hyderabad searches; bare Hyderabad alone asks for role", () => {
    const role = understandLocally("carpenter");
    assert.equal(role.intent, "JOB_SEARCH");
    assert.equal(role.category, "Carpenter");
    assert.equal(role.location, "");

    const withCity = resolveTurnUnderstanding(
      "Hyderabad",
      understandLocally("Hyderabad"),
      toPending(role),
      "JOB_SEARCH",
    );
    assert.equal(withCity.category, "Carpenter");
    assert.equal(withCity.location, "Hyderabad");
    assert.equal(withCity.intent, "JOB_SEARCH");

    const bareCity = understandLocally("Hyderabad");
    assert.equal(bareCity.intent, "JOB_SEARCH");
    assert.equal(bareCity.category, "");
    assert.equal(bareCity.location, "Hyderabad");
  });

  it("menu-style profile and check application map to account workflows", () => {
    assert.equal(understandLocally("profile").intent, "ACCOUNT_STATUS");
    assert.equal(understandLocally("check application").intent, "MY_APPLICATIONS");
    assert.equal(understandLocally("Find Jobs").intent, "JOB_SEARCH");
  });

  it("search_failed remains distinct from successful empty jobs", () => {
    const empty = buildDeterministicReply("en", {
      situation: "jobs",
      location: "Bhubaneswar",
      role: "Interior Designer",
      empty: true,
      total: 0,
      jobs: [],
    });
    const failed = buildDeterministicReply("en", {
      situation: "search_failed",
      location: "Bhubaneswar",
      role: "Interior Designer",
    });
    assert.notEqual(empty, failed);
    assert.match(failed ?? "", /couldn't fetch/i);
  });

  it("previous menu pending role does not block a new complete job request", () => {
    const merged = resolveTurnUnderstanding(
      "interior designer in bhubaneswar",
      understandLocally("interior designer in bhubaneswar"),
      {
        intent: "JOB_SEARCH",
        category: "",
        location: "",
        openSearch: true,
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Interior Designer");
    assert.equal(merged.location, "Bhubaneswar");
    assert.equal(merged.openSearch, false);
  });
});
