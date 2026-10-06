import assert from "node:assert/strict";
import { describe, it } from "node:test";
import en from "./locales/en.json" with { type: "json" };
import hi from "./locales/hi.json" with { type: "json" };
import kn from "./locales/kn.json" with { type: "json" };
import ml from "./locales/ml.json" with { type: "json" };
import ta from "./locales/ta.json" with { type: "json" };
import te from "./locales/te.json" with { type: "json" };
import { translate } from "./translate";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

const catalogs = { en, hi, te, ta, kn, ml };

describe("static i18n catalogs", () => {
  it("defaults English copy for shared actions", () => {
    assert.equal(translate("en", "common.save"), "Save");
    assert.equal(translate("en", "jobs.applyNow"), "Apply Now");
    assert.equal(translate("en", "navbar.jobSeeker"), "Job Seeker");
  });

  it("changes static UI copy for every supported language", () => {
    assert.notEqual(translate("te", "jobs.applyNow"), translate("en", "jobs.applyNow"));
    assert.notEqual(translate("hi", "jobs.applyNow"), translate("en", "jobs.applyNow"));
    assert.notEqual(translate("ta", "jobs.applyNow"), translate("en", "jobs.applyNow"));
    assert.notEqual(translate("kn", "jobs.applyNow"), translate("en", "jobs.applyNow"));
    assert.notEqual(translate("ml", "jobs.applyNow"), translate("en", "jobs.applyNow"));
    assert.equal(translate("te", "navbar.jobSeeker"), "ఉద్యోగార్థి");
    assert.equal(translate("hi", "jobs.fullTime"), "पूर्णकालिक");
    assert.notEqual(translate("te", "jobs.locationNotSpecified"), "Location not specified");
    assert.equal(translate("ta", "jobs.office"), "அலுவலகம்");
    assert.equal(translate("kn", "footer.contactUs"), "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ");
    assert.equal(translate("te", "footer.employers"), "యజమానుల కోసం");
    assert.equal(translate("te", "footer.faqs"), "తరచుగా అడిగే ప్రశ్నలు");
    assert.equal(translate("hi", "footer.support"), "सहायता");
    assert.equal(translate("hi", "footer.terms"), "नियम और शर्तें");
    assert.notEqual(translate("ta", "footer.helpCenter"), translate("en", "footer.helpCenter"));
    assert.equal(translate("ml", "nav.profile"), "പ്രൊഫൈൽ");
    assert.notEqual(translate("te", "faqs.subtitle"), translate("en", "faqs.subtitle"));
    assert.equal(translate("hi", "faqs.categories.general.whatIsAslijobs.question"), "AsliJobs क्या है?");
    assert.equal(translate("te", "guidelines.meta.title"), "మార్గదర్శకాలు");
    assert.equal(translate("hi", "publicContent.postAJob.title"), "नौकरी पोस्ट करें");
    assert.equal(translate("hi", "terms.meta.title"), "नियम और शर्तें");
    assert.equal(translate("hi", "privacy.meta.title"), "गोपनीयता नीति");
    assert.notEqual(
      translate("te", "privacy.sections.overview.p1"),
      translate("en", "privacy.sections.overview.p1"),
    );
    assert.notEqual(
      translate("te", "terms.sections.overview.p1"),
      translate("en", "terms.sections.overview.p1"),
    );
    assert.notEqual(
      translate("te", "publicContent.postAJob.intro"),
      translate("en", "publicContent.postAJob.intro"),
    );
    assert.notEqual(
      translate("hi", "guidelines.sections.introduction.p1"),
      translate("en", "guidelines.sections.introduction.p1"),
    );
  });

  it("falls back to English when a language is missing a key", () => {
    const jobs = te.jobs as { applyNow?: string };
    const original = jobs.applyNow;
    delete jobs.applyNow;
    try {
      assert.equal(translate("te", "jobs.applyNow"), "Apply Now");
    } finally {
      jobs.applyNow = original;
    }
  });

  it("keeps the same keys in every locale", () => {
    const englishKeys = leafPaths(en).sort();
    for (const [code, catalog] of Object.entries(catalogs)) {
      assert.deepEqual(leafPaths(catalog).sort(), englishKeys, code);
    }
  });

  it("does not call fetch while resolving static copy", () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      throw new Error("static i18n must not fetch");
    }) as typeof fetch;
    try {
      for (const code of ["en", "te", "hi", "ta", "kn", "ml"] as const) {
        translate(code, "jobs.applyNow");
        translate(code, "jobs.fullTime");
        translate(code, "jobs.jobDescription");
        translate(code, "jobs.verified");
        translate(code, "footer.rights");
        translate(code, "footer.employers");
        translate(code, "footer.faqs");
        translate(code, "footer.helpCenter");
        translate(code, "faqs.pageTitle");
        translate(code, "guidelines.meta.title");
        translate(code, "common.somethingWentWrong");
      }
      assert.equal(calls, 0);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("interpolates counts without leaving the placeholder", () => {
    assert.equal(translate("en", "jobs.minutesAgo", { count: 4 }), "4m ago");
    assert.match(translate("hi", "jobs.jobsFound", { count: 3 }), /3/);
    assert.doesNotMatch(translate("te", "jobs.hoursAgo", { count: 2 }), /\{count\}/);
  });

  it("localizes Find Jobs static labels independently of job body copy", () => {
    assert.equal(translate("en", "jobs.jobDescription"), "Job Description");
    assert.equal(translate("en", "jobs.employmentType"), "Employment Type");
    assert.notEqual(translate("te", "jobs.jobDescription"), "Job Description");
    assert.notEqual(translate("te", "jobs.salary"), translate("en", "jobs.salary"));
    assert.notEqual(translate("hi", "jobs.verified"), translate("en", "jobs.verified"));
    assert.notEqual(translate("ta", "jobs.backToJobs"), translate("en", "jobs.backToJobs"));
    assert.notEqual(translate("kn", "jobs.shareJobAction"), translate("en", "jobs.shareJobAction"));
    assert.notEqual(translate("ml", "jobs.similarJobs"), translate("en", "jobs.similarJobs"));
    assert.match(translate("te", "jobs.postedPrefix", { time: "5 రోజుల క్రితం" }), /5 రోజుల క్రితం/);
  });
});
