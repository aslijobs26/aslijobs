import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyAccountProgress } from "../accounts/phone-account.service.js";
import { formatAppliedFilters } from "./whatsapp-bot.criteria.js";
import {
  activeSearchContext,
  applyAccountAwareIntent,
  buildDeterministicReply,
  detectLanguage,
  employerVerificationCopy,
  publicJobFilters,
  registrationCopy,
  resolveTurnUnderstanding,
  roleRedirectCopy,
  serviceErrorCopy,
  understandLocally,
  unknownUserAction,
} from "./whatsapp-bot.logic.js";

const seekerUrl = "https://aslijobs.com/job-seeker/register";
const employerUrl = "https://aslijobs.com/employer/register";

function local(text: string) {
  return understandLocally(text);
}

describe("whatsapp role and account routing", () => {
  it("keeps a registered job seeker on job search", () => {
    const mapped = applyAccountAwareIntent(local("I need a safety supervisor job in Bihar"), "seeker");
    assert.equal(mapped.intent, "JOB_SEARCH");
    assert.equal(mapped.crossRole, "");
    assert.equal(mapped.scope, "PUBLIC_JOBS");
  });

  it("sends a job seeker who wants to post a job to employer registration", () => {
    const mapped = applyAccountAwareIntent(local("How can I post a job?"), "seeker");
    assert.equal(mapped.intent, "POST_JOB");
    assert.equal(mapped.crossRole, "employer");
    assert.equal(mapped.scope, "NONE");
    assert.equal(mapped.requiresAuth, false);
    const reply = roleRedirectCopy(mapped.language, "employer", employerUrl);
    assert.match(reply, /employer\/register/);
    assert.doesNotMatch(reply, /job-seeker\/register/);
  });

  it("keeps a registered employer on job posting", () => {
    const mapped = applyAccountAwareIntent(local("How can I post a job?"), "employer");
    assert.equal(mapped.intent, "POST_JOB");
    assert.equal(mapped.crossRole, "");
    assert.equal(mapped.scope, "OWN_EMPLOYER_DATA");
  });

  it("blocks an employer from candidate job search and redirects to seeker registration", () => {
    const mapped = applyAccountAwareIntent(local("Find me a job in Hyderabad"), "employer");
    assert.equal(mapped.intent, "JOB_SEARCH");
    assert.equal(mapped.crossRole, "seeker");
    assert.equal(mapped.scope, "NONE");
    const reply = roleRedirectCopy(mapped.language, "seeker", seekerUrl);
    assert.match(reply, /job-seeker\/register/);
    assert.match(reply, /Employer services only|Employer సేవలకు|Employer सेवाओं/i);
  });

  it("blocks employer seeker-profile intents instead of remapping them", () => {
    const skills = applyAccountAwareIntent(local("What are my skills?"), "employer");
    assert.equal(skills.intent, "MY_SKILLS");
    assert.equal(skills.crossRole, "seeker");
    const search = applyAccountAwareIntent(local("i wnat electrician jobseeker"), "employer");
    assert.equal(search.intent, "JOB_SEARCH");
    assert.equal(search.crossRole, "seeker");
    assert.equal(search.category, "Electrician");
    const applyHow = applyAccountAwareIntent(local("How do I apply for a job?"), "employer");
    assert.equal(applyHow.intent, "HOW_TO_APPLY");
    assert.equal(applyHow.crossRole, "seeker");
  });

  it("never routes electrician jobseeker phrases to employer posting for unregistered users", () => {
    for (const text of [
      "i wnat electrician jobseeker",
      "I want electrician job",
      "Naku electrician job kavali",
      "Electrician job chupinchu",
      "Mujhe electrician ki naukri chahiye",
    ]) {
      const mapped = applyAccountAwareIntent(local(text), "none");
      assert.equal(mapped.intent, "JOB_SEARCH", text);
      assert.equal(unknownUserAction(mapped), "public_jobs", text);
      assert.notEqual(mapped.intent, "POST_JOB", text);
      const asEmployer = applyAccountAwareIntent(local(text), "employer");
      assert.equal(asEmployer.intent, "JOB_SEARCH", text);
      assert.equal(asEmployer.crossRole, "seeker", text);
      const asSeeker = applyAccountAwareIntent(local(text), "seeker");
      assert.equal(asSeeker.crossRole, "", text);
    }
  });

  it("lets an unregistered person search public jobs and a hire request use employer registration", () => {
    const search = local("I need a job in Hyderabad");
    assert.equal(unknownUserAction(search), "public_jobs");
    assert.equal(search.crossRole, "");
    const hire = local("I want to hire five delivery executives");
    assert.equal(hire.intent, "POST_JOB");
    assert.equal(unknownUserAction(hire), "employer_register");
    const reply = buildDeterministicReply("en", {
      situation: "new_user",
      reason: "employer_account_required",
      registration: { employerRegisterUrl: employerUrl },
    });
    assert.match(reply ?? "", /employer\/register/);
  });

  it("answers a general question before asking which account to create", () => {
    const help = local("What can you do?");
    assert.equal(help.intent, "HELP");
    assert.equal(unknownUserAction(help), "greeting");
    const vague = local("Tell me something");
    assert.equal(unknownUserAction(vague), "clarify");
  });

  it("follows intent when the number has both accounts", () => {
    const search = applyAccountAwareIntent(local("Find me a job in Hyderabad"), "both");
    const post = applyAccountAwareIntent(local("How can I post a job?"), "both");
    assert.equal(search.crossRole, "");
    assert.equal(search.intent, "JOB_SEARCH");
    assert.equal(post.crossRole, "");
    assert.equal(post.intent, "POST_JOB");
  });

  it("does not describe a lookup failure as an unregistered number", () => {
    for (const language of ["en", "hi", "te", "ta", "kn", "ml"] as const) {
      const copy = serviceErrorCopy(language);
      assert.doesNotMatch(copy, /unregistered|register|no jobs|could not find/i);
    }
  });

  it("does not treat a user's claim of registration as a completed account", () => {
    const said = local("I registered");
    assert.equal(said.intent, "UNKNOWN");
    assert.equal(unknownUserAction(said), "clarify");
    const reply = buildDeterministicReply("en", { situation: "clarify", missing: "purpose" }) ?? "";
    assert.doesNotMatch(reply, /you are registered|registration (is|was) complete|account created/i);
  });

  it("tells an incomplete registration to continue, without calling it a new account", () => {
    assert.equal(classifyAccountProgress({ seekerStatus: "PENDING" }), "incomplete_seeker");
    assert.equal(classifyAccountProgress({ employerStatus: "pending" }), "incomplete_employer");
    assert.equal(classifyAccountProgress({}), "unregistered");
    assert.equal(
      classifyAccountProgress({ seekerStatus: "COMPLETED", employerStatus: "completed" }),
      "registered",
    );
    const reply = buildDeterministicReply("en", {
      situation: "new_user",
      reason: "incomplete_seeker",
      registration: { seekerRegisterUrl: seekerUrl },
    }) ?? "";
    assert.match(reply, /still open/);
    assert.match(reply, /job-seeker\/register/);
    assert.doesNotMatch(reply, /not linked/);
  });

  it("keeps a pending employer on review copy and a rejected employer on resubmit copy", () => {
    const pending = employerVerificationCopy({
      language: "en",
      verification: "pending",
      name: "Acme",
      profileUrl: "https://aslijobs.com/employer/company-profile",
    });
    assert.match(pending, /under review/);
    assert.doesNotMatch(pending, /is verified/);
    const rejected = employerVerificationCopy({
      language: "en",
      verification: "rejected",
      name: "Acme",
      profileUrl: "https://aslijobs.com/employer/company-profile",
    });
    assert.match(rejected, /not approved/);
    assert.match(rejected, /company-profile/);
  });

  it("localizes the cross-role replies in all six languages", () => {
    for (const language of ["en", "hi", "te", "ta", "kn", "ml"] as const) {
      const toEmployer = roleRedirectCopy(language, "employer", employerUrl);
      const toSeeker = roleRedirectCopy(language, "seeker", seekerUrl);
      assert.match(toEmployer, /employer\/register/);
      assert.match(toSeeker, /job-seeker\/register/);
      assert.notEqual(toEmployer, toSeeker);
    }
  });
});

describe("whatsapp multilingual understanding", () => {
  const samples: Array<{ text: string; language: "en" | "hi" | "te" | "ta" | "kn" | "ml"; location: string }> = [
    { text: "I need a safety supervisor job in Bihar.", language: "en", location: "Bihar" },
    { text: "Naaku Hyderabad lo software job kavali.", language: "te", location: "Hyderabad" },
    { text: "Hyderabad lo fresher developer jobs unnaya?", language: "te", location: "Hyderabad" },
    { text: "Mujhe Hyderabad mein naukri chahiye.", language: "hi", location: "Hyderabad" },
    { text: "Hyderabad la job venum.", language: "ta", location: "Hyderabad" },
    { text: "Nanage Hyderabad alli job beku.", language: "kn", location: "Hyderabad" },
    { text: "Enikku Hyderabadil oru job venam.", language: "ml", location: "Hyderabad" },
    { text: "बिहार में नौकरी चाहिए", language: "hi", location: "Bihar" },
    { text: "బీహార్ లో safety supervisor ఉద్యోగం కావాలి", language: "te", location: "Bihar" },
  ];

  for (const sample of samples) {
    it(`reads ${sample.language} from: ${sample.text}`, () => {
      const understood = local(sample.text);
      assert.equal(understood.language, sample.language);
      assert.equal(understood.intent, "JOB_SEARCH");
      assert.equal(understood.location, sample.location);
      if (sample.location === "Bihar") assert.equal(understood.locationKind, "state");
      if (sample.location === "Hyderabad") assert.equal(understood.locationKind, "city");
    });
  }

  it("keeps a misspelled city and does not invent a city from a state", () => {
    const city = local("safety supervisor jobs in hyderbad");
    assert.equal(city.location, "Hyderabad");
    assert.equal(city.category, "Safety Supervisor");
    const state = local("jobs in Telangana");
    assert.equal(state.location, "Telangana");
    assert.equal(state.locationKind, "state");
    assert.equal(publicJobFilters(state).city, "");
    assert.equal(publicJobFilters(state).state, "Telangana");
  });

  it("changes language without dropping the role already collected", () => {
    const corrected = resolveTurnUnderstanding(
      "హైదరాబాద్",
      local("హైదరాబాద్"),
      { location: "Bihar", category: "Safety Supervisor", locationKind: "state", intent: "JOB_SEARCH" },
    );
    assert.equal(corrected.language, "te");
    assert.equal(corrected.location, "Hyderabad");
    assert.equal(corrected.category, "Safety Supervisor");
  });
});

describe("whatsapp experience, salary, and context", () => {
  it("keeps 7, 8, and 9 years instead of collapsing them onto one bucket silently", () => {
    const seven = local("safety supervisor jobs in Bihar with seven years experience");
    assert.equal(seven.experienceLevel, "6_year");
    assert.equal(seven.originalExperienceYears, 7);
    assert.match(formatAppliedFilters(seven), /7 years \(searched as 6 or more years experience\)/);
    const eight = local("I need a job in Bihar with 8 years experience");
    assert.equal(eight.experienceLevel, "10_year");
    assert.equal(eight.originalExperienceYears, 8);
    const nine = local("I need a job in Bihar with nine years experience");
    assert.equal(nine.originalExperienceYears, 9);
    assert.equal(nine.experienceLevel, "10_year");
    const ten = local("I need a job in Bihar with ten years experience");
    assert.equal(ten.experienceLevel, "10_year");
    assert.match(formatAppliedFilters(ten), /10 or more years experience/);
    assert.doesNotMatch(formatAppliedFilters(ten), /searched as/);
  });

  it("states a year range honestly when the API has one experience level", () => {
    const ranged = local("React developer jobs in Hyderabad with one to three years experience");
    assert.equal(ranged.category, "React Developer");
    assert.equal(ranged.experienceLevel, "1_year");
    assert.match(formatAppliedFilters(ranged), /1 to 3 years \(searched as 1 year experience\)/);
    assert.equal(publicJobFilters(ranged).experience, "1_year");
  });

  it("converts LPA to a monthly filter and leaves negotiable salary empty", () => {
    const lpa = local("accountant jobs in Hyderabad around 3 LPA");
    assert.equal(lpa.category, "Accountant");
    assert.equal(lpa.minSalary, 25000);
    assert.equal(lpa.salaryBasis, "annual");
    assert.match(formatAppliedFilters(lpa), /₹25,000 per month/);
    assert.notEqual(lpa.minSalary, 300000);
    const band = local("jobs in Hyderabad salary ₹30,000 per month");
    assert.equal(band.minSalary, 30000);
    assert.equal(band.salaryBasis, "monthly");
    const open = local("software jobs in Hyderabad salary negotiable");
    assert.equal(open.minSalary, null);
    assert.equal(open.maxSalary, null);
  });

  it("replaces salary and keeps the role when the user corrects it", () => {
    const corrected = resolveTurnUnderstanding(
      "Actually 4.5 LPA",
      local("Actually 4.5 LPA"),
      {
        location: "Hyderabad",
        category: "Accountant",
        intent: "JOB_SEARCH",
        minSalary: 15000,
        experienceLevel: "2_year",
      },
    );
    assert.equal(corrected.category, "Accountant");
    assert.equal(corrected.location, "Hyderabad");
    assert.equal(corrected.minSalary, 37500);
    assert.equal(corrected.experienceLevel, "2_year");
  });

  it("does not treat yes or no as a city", () => {
    const previous = { location: "Bihar", category: "Safety Supervisor", intent: "JOB_SEARCH" };
    const yes = resolveTurnUnderstanding("Yes", local("Yes"), previous);
    const no = resolveTurnUnderstanding("No", local("No"), previous);
    assert.notEqual(yes.location, "Yes");
    assert.notEqual(no.location, "No");
    assert.equal(yes.intent, "UNKNOWN");
    assert.equal(no.intent, "UNKNOWN");
  });

  it("inherits the conversation language for a short acknowledgement", () => {
    assert.equal(detectLanguage("ok", "te"), "te");
    assert.equal(detectLanguage("Yes", "hi"), "hi");
  });

  it("restores a saved search after the pending question is cleared", () => {
    const resumed = resolveTurnUnderstanding(
      "Bihar",
      local("Bihar"),
      activeSearchContext({
        pendingIntent: "",
        lastLocation: "Bihar",
        lastCategory: "Safety Supervisor",
        lastExperience: "6_year",
        lastExperienceYears: 7,
        lastExperienceRange: "",
        locationKind: "state",
      }),
    );
    assert.equal(resumed.location, "Bihar");
    assert.equal(resumed.category, "Safety Supervisor");
    assert.equal(resumed.originalExperienceYears, 7);
  });

  it("uses the verified registration routes", () => {
    const seeker = registrationCopy({ language: "en", role: "seeker", url: seekerUrl });
    const employer = registrationCopy({ language: "ta", role: "employer", url: employerUrl });
    assert.match(seeker, /\/job-seeker\/register/);
    assert.match(employer, /\/employer\/register/);
    assert.doesNotMatch(employer, /lang=/);
  });
});
