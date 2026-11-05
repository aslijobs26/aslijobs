import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { POST_JOB_INITIAL_WIZARD_DATA } from "../constants/post-job";
import { postJobWizardMatchesBaseline } from "./post-job-draft";

describe("post job draft baseline", () => {
  it("treats the empty form and profile prefill as untouched", () => {
    const prefilled = structuredClone(POST_JOB_INITIAL_WIZARD_DATA);
    prefilled.jobInformation.industry = "Hospitality";
    prefilled.jobInformation.businessCategory = "Hotels";
    prefilled.jobInformation.companySize = "11-50";

    assert.equal(
      postJobWizardMatchesBaseline(
        POST_JOB_INITIAL_WIZARD_DATA,
        structuredClone(POST_JOB_INITIAL_WIZARD_DATA),
      ),
      true,
    );
    assert.equal(
      postJobWizardMatchesBaseline(prefilled, structuredClone(prefilled)),
      true,
    );
    assert.equal(
      postJobWizardMatchesBaseline(
        { ...prefilled, jobInformation: { ...prefilled.jobInformation, industry: "  Hospitality  " } },
        prefilled,
      ),
      true,
    );
  });

  it("treats a field the employer changed as draft content", () => {
    const baseline = structuredClone(POST_JOB_INITIAL_WIZARD_DATA);
    baseline.jobInformation.industry = "Hospitality";
    const edited = structuredClone(baseline);
    edited.jobInformation.jobTitle = "Front office executive";

    assert.equal(postJobWizardMatchesBaseline(edited, baseline), false);
  });
});

describe("employer jobs draft delete menu", () => {
  it("offers delete only for draft jobs in the row menu", () => {
    const source = readFileSync(
      new URL("../components/employer-jobs/EmployerJobsTable.tsx", import.meta.url),
      "utf8",
    );

    assert.match(source, /job\.status === "draft" && can\("jobs", "delete"\)/);
    assert.match(source, /\{canDeleteDraft \? \(/);
    assert.doesNotMatch(source, /\{canDeleteJobs \? \(/);
  });
});
