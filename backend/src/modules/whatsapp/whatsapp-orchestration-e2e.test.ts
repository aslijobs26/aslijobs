import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyAccountAwareIntent,
  publicJobFilters,
  resolveTurnUnderstanding,
  understandLocally,
  buildDeterministicReply,
} from "./whatsapp-bot.logic.js";
import {
  applyNoMatchChoiceToSearch,
  resolveNoMatchChoice,
  WHATSAPP_TURN_STAGES,
} from "./whatsapp-conversation-orchestrator.js";
import { selectWhatsAppTool } from "./whatsapp-bot-tools.js";
import { authorizeWhatsAppRole } from "./whatsapp-role-policy.js";

/**
 * Multi-turn orchestration tests using the real classify/merge/authorize path
 * (external APIs mocked by not calling them).
 */
describe("whatsapp orchestration e2e (multi-turn)", () => {
  it("exposes a single documented turn pipeline", () => {
    assert.ok(WHATSAPP_TURN_STAGES.includes("authorize_role"));
    assert.ok(WHATSAPP_TURN_STAGES.includes("select_tool"));
    assert.ok(WHATSAPP_TURN_STAGES.includes("optional_openai_assist"));
    assert.equal(WHATSAPP_TURN_STAGES[0], "validate_inbound");
  });

  it("Example 1: Driver Hyderabad → salary 40k → Inka chuinu", () => {
    const t1 = applyAccountAwareIntent(
      understandLocally("Driver job Hyderabad lo kavali"),
      "seeker",
    );
    assert.equal(t1.intent, "JOB_SEARCH");
    assert.equal(t1.category, "Driver");
    assert.equal(t1.location, "Hyderabad");
    assert.equal(selectWhatsAppTool(t1.intent), "search_public_jobs");
    assert.equal(authorizeWhatsAppRole({ account: "seeker", intent: t1.intent }).allowed, true);

    const t2 = applyAccountAwareIntent(
      resolveTurnUnderstanding(
        "Naku salary 40000 kavali",
        understandLocally("Naku salary 40000 kavali"),
        {
          location: t1.location,
          category: t1.category,
          intent: t1.intent,
          locationKind: "city",
        },
        "JOB_SEARCH",
      ),
      "seeker",
    );
    assert.equal(t2.category, "Driver");
    assert.equal(t2.location, "Hyderabad");
    assert.equal(t2.minSalary, 40000);
    const filters = publicJobFilters(t2);
    assert.equal(filters.minSalary, 40000);
    assert.equal(filters.search, "Driver");
    assert.equal(filters.city, "Hyderabad");

    const t3 = applyAccountAwareIntent(
      resolveTurnUnderstanding(
        "Inka chuinu",
        understandLocally("Inka chuinu"),
        {
          location: t2.location,
          category: t2.category,
          intent: "JOB_SEARCH",
          minSalary: t2.minSalary,
          locationKind: "city",
        },
        "JOB_SEARCH",
      ),
      "seeker",
    );
    assert.equal(t3.showMore, true);
    assert.equal(t3.category, "Driver");
    assert.equal(t3.location, "Hyderabad");
    assert.equal(t3.minSalary, 40000);
    assert.doesNotMatch(
      buildDeterministicReply("en", {
        situation: "job_search_no_match",
        location: "Hyderabad",
        role: "Driver",
        minSalary: 40000,
        lowerSalaryCount: 1,
        undisclosedCount: 0,
        nearbyCity: "",
      }) ?? "",
      /Looking at your question|What kind of job/i,
    );
  });

  it("Example 1b: no-match option 1 relaxes salary only", () => {
    assert.equal(resolveNoMatchChoice("1"), "relax_salary");
    const next = applyNoMatchChoiceToSearch(
      "relax_salary",
      {
        lastCategory: "Driver",
        lastLocation: "Hyderabad",
        lastMinSalary: 40000,
        locationKind: "city",
        pendingNearbyCity: "Secunderabad",
      },
      "te",
    );
    assert.notEqual(next, null);
    assert.notEqual(next, "wait");
    if (next && typeof next === "object") {
      assert.equal(next.category, "Driver");
      assert.equal(next.location, "Hyderabad");
      assert.equal(next.minSalary, null);
    }
  });

  it("Example 1c: no-match option 2 switches to nearby city with consent", () => {
    assert.equal(resolveNoMatchChoice("2"), "use_nearby");
    const next = applyNoMatchChoiceToSearch(
      "use_nearby",
      {
        lastCategory: "Driver",
        lastLocation: "Hyderabad",
        lastMinSalary: 40000,
        pendingNearbyCity: "Secunderabad",
        locationKind: "city",
      },
      "en",
    );
    assert.notEqual(next, null);
    assert.notEqual(next, "wait");
    if (next && typeof next === "object") {
      assert.equal(next.location, "Secunderabad");
      assert.equal(next.minSalary, 40000);
    }
  });

  it("Example 2: Carpenter Hyderabad search", () => {
    const u = applyAccountAwareIntent(
      understandLocally("Naku Hyderabad lo Carpenter job kavali"),
      "seeker",
    );
    assert.equal(u.intent, "JOB_SEARCH");
    assert.equal(u.category, "Carpenter");
    assert.equal(u.location, "Hyderabad");
  });

  it("Example 3: Employer posted-job status uses employer tool path", () => {
    const u = applyAccountAwareIntent(
      understandLocally("nenu post chesina jobs status kavali"),
      "employer",
    );
    assert.equal(u.intent, "EMPLOYER_JOB_STATUS");
    assert.equal(u.crossRole, "");
    assert.equal(selectWhatsAppTool(u.intent), "list_employer_jobs");
    assert.equal(
      authorizeWhatsAppRole({ account: "employer", intent: u.intent }).allowed,
      true,
    );
  });

  it("Example 4: Seeker profile verify uses ACCOUNT_STATUS, not job search", () => {
    const u = applyAccountAwareIntent(
      understandLocally("Naa profile verify ayyindha?"),
      "seeker",
    );
    assert.equal(u.intent, "ACCOUNT_STATUS");
    assert.equal(selectWhatsAppTool(u.intent), "none");
    assert.notEqual(u.intent, "JOB_SEARCH");
  });

  it("Example 5: Unregistered driver search stays public_jobs / seeker path", () => {
    const u = understandLocally("Naku job kavali Driver Hyderabad lo");
    assert.equal(u.intent, "JOB_SEARCH");
    assert.equal(u.category, "Driver");
    assert.equal(u.location, "Hyderabad");
    assert.equal(applyAccountAwareIntent(u, "none").crossRole, "");
  });

  it("Example 6-ish: Employer personal job search remains blocked", () => {
    const u = applyAccountAwareIntent(
      understandLocally("Driver job Hyderabad lo kavali"),
      "employer",
    );
    assert.equal(u.crossRole, "seeker");
    assert.equal(
      authorizeWhatsAppRole({ account: "employer", intent: "JOB_SEARCH" }).allowed,
      false,
    );
  });

  it("option 4 wait does not invent jobs", () => {
    assert.equal(resolveNoMatchChoice("4"), "wait");
    assert.equal(
      applyNoMatchChoiceToSearch(
        "wait",
        { lastCategory: "Driver", lastLocation: "Hyderabad", lastMinSalary: 40000 },
        "en",
      ),
      "wait",
    );
  });
});
