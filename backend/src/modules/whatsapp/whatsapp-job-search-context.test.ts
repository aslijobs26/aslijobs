import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractSalaryBand } from "./whatsapp-bot.criteria.js";
import {
  applyAccountAwareIntent,
  buildDeterministicReply,
  jobSearchNoMatchCopy,
  publicJobFilters,
  resolveTurnUnderstanding,
  understandLocally,
} from "./whatsapp-bot.logic.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";

describe("job-search context: salary, show more, no-match", () => {
  it("A1. driver + hyderabad from romanized Telugu", () => {
    const u = understandLocally("Naku job kavali driver job hyderabad lo");
    assert.equal(u.intent, "JOB_SEARCH");
    assert.equal(u.category, "Driver");
    assert.equal(u.location, "Hyderabad");
  });

  it("A2. salary-only follow-up keeps Driver + Hyderabad and sets ₹40,000", () => {
    for (const text of [
      "Naku salary 40,000 kavali",
      "Naku salary 40000 kavali",
      "40k salary kavali",
      "Minimum 40,000",
      "At least 40000",
      "₹40,000 per month kavali",
    ]) {
      assert.equal(extractSalaryBand(text).min, 40000, text);
      const merged = resolveTurnUnderstanding(
        text,
        understandLocally(text),
        {
          location: "Hyderabad",
          category: "Driver",
          intent: "JOB_SEARCH",
          locationKind: "city",
        },
        "JOB_SEARCH",
      );
      assert.equal(merged.intent, "JOB_SEARCH", text);
      assert.equal(merged.category, "Driver", text);
      assert.equal(merged.location, "Hyderabad", text);
      assert.equal(merged.minSalary, 40000, text);
      const filters = publicJobFilters(merged);
      assert.equal(filters.minSalary, 40000, text);
      assert.equal(filters.search, "Driver", text);
      assert.equal(filters.city, "Hyderabad", text);
    }
  });

  it("A3. Driver confirmation preserves salary + location", () => {
    const merged = resolveTurnUnderstanding(
      "Driver",
      understandLocally("Driver"),
      {
        location: "Hyderabad",
        category: "Driver",
        intent: "JOB_SEARCH",
        minSalary: 40000,
        salaryBasis: "monthly",
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Driver");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.minSalary, 40000);
  });

  it("A4. Inka chuinu / show more reuses full prior criteria", () => {
    for (const text of [
      "Inka chuinu",
      "Inka jobs chupinchu",
      "More jobs",
      "Show more",
      "Vere jobs unnaya?",
      "Any other jobs?",
    ]) {
      const local = understandLocally(text);
      assert.equal(local.intent, "JOB_SEARCH", text);
      assert.equal(local.showMore, true, text);
      assert.equal(local.category, "", text);
      const merged = resolveTurnUnderstanding(
        text,
        local,
        {
          location: "Hyderabad",
          category: "Driver",
          intent: "JOB_SEARCH",
          minSalary: 40000,
          salaryBasis: "monthly",
          locationKind: "city",
        },
        "JOB_SEARCH",
      );
      assert.equal(merged.intent, "JOB_SEARCH", text);
      assert.equal(merged.category, "Driver", text);
      assert.equal(merged.location, "Hyderabad", text);
      assert.equal(merged.minSalary, 40000, text);
      assert.equal(merged.showMore, true, text);
    }
  });

  it("B5-8. no-match copy offers alternatives without claiming exact salary match", () => {
    const reply = jobSearchNoMatchCopy({
      language: "en",
      location: "Hyderabad",
      role: "Driver",
      minSalary: 40000,
      lowerSalaryCount: 2,
      undisclosedCount: 1,
      nearbyCity: "Secunderabad",
    });
    assert.match(reply, /couldn'?t find|Sorry/i);
    assert.match(reply, /40,000/);
    assert.match(reply, /lower salary/i);
    assert.match(reply, /not specified/i);
    assert.match(reply, /Secunderabad|near/i);
    assert.doesNotMatch(reply, /Looking at your question|kind of job are you looking/i);

    const te = jobSearchNoMatchCopy({
      language: "te",
      location: "Hyderabad",
      role: "Driver",
      minSalary: 40000,
      lowerSalaryCount: 1,
      undisclosedCount: 0,
      nearbyCity: "",
    });
    assert.match(te, /dorakaledhu|Sorry/i);
    assert.match(te, /takkuva salary/i);
    assert.doesNotMatch(te, /Looking at your question/i);
  });

  it("C11. explicit location change updates only location", () => {
    const merged = resolveTurnUnderstanding(
      "Chennai",
      understandLocally("Chennai"),
      {
        location: "Hyderabad",
        category: "Driver",
        intent: "JOB_SEARCH",
        minSalary: 40000,
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.location, "Chennai");
    assert.equal(merged.category, "Driver");
    assert.equal(merged.minSalary, 40000);
  });

  it("C12. new full search replaces prior role/city when both provided", () => {
    const merged = resolveTurnUnderstanding(
      "I need electrician jobs in Bangalore",
      understandLocally("I need electrician jobs in Bangalore"),
      {
        location: "Hyderabad",
        category: "Driver",
        intent: "JOB_SEARCH",
        minSalary: 40000,
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Electrician");
    assert.equal(merged.location, "Bangalore");
  });

  it("C13. profile status does not keep returning job search", () => {
    const mapped = applyAccountAwareIntent(
      understandLocally("naa profile status ela undhi?"),
      "seeker",
    );
    assert.equal(mapped.intent, "ACCOUNT_STATUS");
    assert.notEqual(mapped.intent, "JOB_SEARCH");
  });

  it("D17-18. role restrictions remain for cross-role job search / posting", () => {
    const employerSearch = applyAccountAwareIntent(
      understandLocally("Naku job kavali driver job hyderabad lo"),
      "employer",
    );
    assert.equal(employerSearch.crossRole, "seeker");
    assert.equal(
      authorizeWhatsAppRole({ account: "employer", intent: "JOB_SEARCH" }).allowed,
      false,
    );
    const seekerPost = applyAccountAwareIntent(
      understandLocally("I want to post an electrician vacancy"),
      "seeker",
    );
    assert.equal(seekerPost.crossRole, "employer");
  });

  it("relative salary bump raises prior minimum", () => {
    const merged = resolveTurnUnderstanding(
      "Salary konchem ekkuva undali",
      understandLocally("Salary konchem ekkuva undali"),
      {
        location: "Hyderabad",
        category: "Driver",
        intent: "JOB_SEARCH",
        minSalary: 30000,
        salaryBasis: "monthly",
        locationKind: "city",
      },
      "JOB_SEARCH",
    );
    assert.equal(merged.category, "Driver");
    assert.equal(merged.location, "Hyderabad");
    assert.equal(merged.minSalary, 35000);
  });

  it("salary range 30k to 40k parses both ends", () => {
    const band = extractSalaryBand("Naku 30k to 40k salary kavali");
    assert.equal(band.min, 30000);
    assert.equal(band.max, 40000);
  });

  it("deterministic no-match situation never asks for job title", () => {
    const reply = buildDeterministicReply("en", {
      situation: "job_search_no_match",
      location: "Hyderabad",
      role: "Driver",
      minSalary: 40000,
      lowerSalaryCount: 3,
      undisclosedCount: 0,
      nearbyCity: "",
    });
    assert.match(reply ?? "", /Driver/);
    assert.doesNotMatch(reply ?? "", /What kind of job are you looking for/i);
  });
});
