import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeSearchContext,
  askLocationCopy,
  buildDeterministicReply,
  publicJobFilters,
  renderJobSearchReply,
  resolveTurnUnderstanding,
  serviceErrorCopy,
  understandLocally,
} from "./whatsapp-bot.logic.js";

const safetySearch = "I need a safety supervisor vacancy in Bihar with one year experience. Salary 25k to 30k.";

describe("whatsapp conversation criteria", () => {
  it("keeps role, state, experience, and salary from one message", () => {
    const understood = understandLocally(safetySearch);
    assert.equal(understood.intent, "JOB_SEARCH");
    assert.equal(understood.category, "Safety Supervisor");
    assert.equal(understood.location, "Bihar");
    assert.equal(understood.locationKind, "state");
    assert.equal(understood.experienceLevel, "1_year");
    assert.equal(understood.minSalary, 25000);
    assert.equal(understood.maxSalary, 30000);
    assert.equal(understood.openSearch, false);

    const filters = publicJobFilters(understood);
    assert.equal(filters.search, "Safety Supervisor");
    assert.equal(filters.city, "");
    assert.equal(filters.state, "Bihar");
    assert.equal(filters.experience, "1_year");
    assert.equal(filters.minSalary, 25000);
    assert.equal(filters.maxSalary, 30000);
  });

  it("combines role, location, and experience sent as separate messages", () => {
    const role = resolveTurnUnderstanding("Need a safety supervisor job", understandLocally("Need a safety supervisor job"), null);
    assert.equal(role.category, "Safety Supervisor");
    assert.equal(role.location, "");

    const located = resolveTurnUnderstanding(
      "In Bihar",
      understandLocally("In Bihar"),
      activeSearchContext({
        pendingIntent: "JOB_SEARCH",
        pendingCategory: role.category,
        pendingLocation: "",
        lastLocation: "Hyderabad",
        lastCategory: "Driver",
      }),
    );
    assert.equal(located.location, "Bihar");
    assert.equal(located.category, "Safety Supervisor");
    assert.notEqual(located.location, "Hyderabad");

    const experienced = resolveTurnUnderstanding(
      "One year",
      understandLocally("One year"),
      {
        location: located.location,
        category: located.category,
        locationKind: "state",
        intent: "JOB_SEARCH",
      },
    );
    assert.equal(experienced.experienceLevel, "1_year");
    assert.equal(experienced.location, "Bihar");
    assert.equal(experienced.category, "Safety Supervisor");
  });

  it("replaces the active location when the user corrects it", () => {
    const corrected = resolveTurnUnderstanding(
      "Actually Bihar",
      understandLocally("Actually Bihar"),
      {
        location: "Bangalore",
        category: "Safety Supervisor",
        locationKind: "city",
        experienceLevel: "1_year",
        intent: "JOB_SEARCH",
      },
    );
    assert.equal(corrected.location, "Bihar");
    assert.equal(corrected.locationKind, "state");
    assert.equal(corrected.category, "Safety Supervisor");
    assert.equal(corrected.experienceLevel, "1_year");
    assert.equal(publicJobFilters(corrected).city, "");
    assert.equal(publicJobFilters(corrected).state, "Bihar");
  });

  it("reads short answers from the current search instead of asking for a known location", () => {
    const waiting = activeSearchContext({
      pendingIntent: "JOB_SEARCH",
      pendingCategory: "Accounts",
      pendingLocation: "",
      lastLocation: "Hyderabad",
    });
    assert.equal(waiting?.location, "");

    const bihar = resolveTurnUnderstanding("Bihar", understandLocally("Bihar"), waiting);
    assert.equal(bihar.location, "Bihar");
    assert.equal(bihar.category, "Accounts");
    assert.match(askLocationCopy("en"), /Which location/);

    const salary = resolveTurnUnderstanding(
      "25k",
      understandLocally("25k"),
      { location: "Bihar", category: "Accounts", locationKind: "state", intent: "JOB_SEARCH" },
    );
    assert.equal(salary.minSalary, 25000);
    assert.equal(salary.location, "Bihar");

    const anywhere = resolveTurnUnderstanding(
      "Anywhere",
      understandLocally("Anywhere"),
      { location: "Bihar", category: "Accounts", locationKind: "state", intent: "JOB_SEARCH" },
    );
    assert.equal(anywhere.anyLocation, true);
    assert.equal(anywhere.location, "");
    assert.equal(publicJobFilters(anywhere).city, "");
    assert.equal(publicJobFilters(anywhere).state, "");
  });

  it("does not guess when a short reply has no slot to attach", () => {
    const unclear = resolveTurnUnderstanding("No", understandLocally("No"), {
      location: "Bihar",
      category: "Safety Supervisor",
      intent: "JOB_SEARCH",
    });
    assert.equal(unclear.intent, "UNKNOWN");
  });

  it("uses the saved search again after the waiting state is cleared", () => {
    const resumed = resolveTurnUnderstanding(
      "one year",
      understandLocally("one year"),
      activeSearchContext({
        pendingIntent: "",
        lastLocation: "Bihar",
        lastCategory: "Safety Supervisor",
        locationKind: "state",
        lastExperience: "",
      }),
    );
    assert.equal(resumed.location, "Bihar");
    assert.equal(resumed.category, "Safety Supervisor");
    assert.equal(resumed.experienceLevel, "1_year");
  });

  it("resolves apply for the second shown job without claiming it was submitted", () => {
    const understood = understandLocally("Apply for the second job");
    assert.equal(understood.intent, "JOB_DETAILS");
    assert.equal(understood.jobOrdinal, 2);
    const reply = buildDeterministicReply("en", {
      situation: "job_details",
      accountType: "seeker",
      location: "Bihar",
      role: "Safety Supervisor",
      applyOrigin: "https://aslijobs.com",
      jobs: [
        {
          jobTitle: "Safety Supervisor",
          companyName: "North Plant",
          cityName: "Patna",
          salary: "₹28,000",
          jobId: "job-2",
        },
      ],
    });
    assert.match(reply ?? "", /Safety Supervisor/);
    assert.match(reply ?? "", /\/jobs\/job-2/);
    assert.doesNotMatch(reply ?? "", /submitted|application was sent/i);
  });

  it("says there are no matching jobs without inventing vacancies", () => {
    const reply = renderJobSearchReply({
      language: "en",
      location: "Bihar",
      jobTitle: "Safety Supervisor",
      jobs: [],
      total: 0,
      appliedFilters: "1 year experience, salary ₹25,000–₹30,000",
    });
    assert.match(reply, /could not find/i);
    assert.match(reply, /1 year experience/);
    assert.doesNotMatch(reply, /https?:\/\//);
    assert.doesNotMatch(reply, /Safety Supervisor at/i);
  });

  it("uses a different message for a search failure than for an empty result", () => {
    const empty = renderJobSearchReply({
      language: "en",
      location: "Bihar",
      jobTitle: "Safety Supervisor",
      jobs: [],
      total: 0,
    });
    const failed = serviceErrorCopy("en");
    assert.match(empty, /could not find/i);
    assert.match(failed, /couldn't fetch/i);
    assert.notEqual(empty, failed);
  });

  it("leaves a job search when the user asks about an application", () => {
    const switched = resolveTurnUnderstanding(
      "Did the employer review my application?",
      understandLocally("Did the employer review my application?"),
      { location: "Bihar", category: "Safety Supervisor", intent: "JOB_SEARCH" },
    );
    assert.equal(switched.intent, "APPLICATION_STATUS");
    assert.equal(switched.scope, "OWN_DATA");
  });

  it("does not ask for a location that was already stated", () => {
    const understood = understandLocally("Any safety supervisor vacancy in Bihar?");
    assert.equal(understood.location, "Bihar");
    assert.equal(understood.category, "Safety Supervisor");
    assert.notEqual(understood.location, "");
    assert.doesNotMatch(askLocationCopy("en"), new RegExp(understood.location, "i"));
  });

  it("keeps a fresher accounts search from asking for the role again", () => {
    const understood = understandLocally("Need a fresher job in accounts");
    assert.equal(understood.intent, "JOB_SEARCH");
    assert.equal(understood.category, "Accounts");
    assert.equal(understood.experienceLevel, "fresher");
    assert.equal(understood.location, "");
    assert.equal(understood.openSearch, false);
  });
});
