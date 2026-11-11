import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clarityDashboardType,
  clarityPageType,
  clarityTagsFor,
  isClarityEntryUrl,
  isClarityRecordableUrl,
  isClaritySafeReferrer,
} from "./clarity-routes";

const ORIGIN = "https://www.aslijobs.com";
const OBJECT_ID = "6ae32e32f16563acf5a1c7c9";

function recordable(path: string): boolean {
  return isClarityRecordableUrl(new URL(path, ORIGIN));
}

describe("Clarity route rules", () => {
  it("records public pages, auth pages and reviewed dashboard pages", () => {
    for (const path of [
      "/",
      "/jobs",
      "/jobs/AJ1234?q=driver&city=hyderabad",
      "/privacy-policy",
      "/employer/login",
      "/employer/register",
      "/team-member/login?activated=1",
      "/employer/dashboard",
      "/employer/jobs?tab=draft",
      `/employer/jobs/${OBJECT_ID}/under-review`,
      "/employer/subscription",
      "/employer/settings?section=security",
      "/post-job",
      `/post-job/${OBJECT_ID}`,
      "/post-job/success",
      "/job-seeker/profile?tab=preferences",
      "/job-seeker/my-resume",
      "/job-seeker/applied-jobs?status=shortlisted",
      "/job-seeker/saved-jobs/",
    ]) {
      assert.equal(recordable(path), true, path);
    }
  });

  it("never records pages with candidate data, documents or tokens", () => {
    for (const path of [
      "/employer/candidates",
      `/employer/candidates/${OBJECT_ID}#resume`,
      "/employer/saved-candidates",
      "/employer/interviews",
      "/employer/messages",
      "/employer/team-management",
      `/employer/team-management/members/${OBJECT_ID}`,
      "/employer/team-member/profile",
      "/employer/company-profile",
      `/job-seeker/applied-jobs/${OBJECT_ID}`,
      `/job-seeker/application-success?applicationId=${OBJECT_ID}`,
      "/job-seeker/my-resume/uploaded-preview",
      "/team/accept-invitation?token=abc",
    ]) {
      assert.equal(recordable(path), false, path);
    }
  });

  it("drops any URL whose query carries an application id or token", () => {
    assert.equal(recordable(`/job-seeker/applied-jobs?application=${OBJECT_ID}`), false);
    assert.equal(recordable(`/employer/dashboard?selected=${OBJECT_ID}`), false);
    assert.equal(recordable("/?token=abc"), false);
  });

  it("keeps unreviewed signed-in pages out by default", () => {
    assert.equal(recordable("/employer/some-new-page"), false);
    assert.equal(recordable("/job-seeker/some-new-page"), false);
  });

  it("does not start a visit on a post-job link that may carry an employer id", () => {
    assert.equal(isClarityEntryUrl(new URL(`/post-job/${OBJECT_ID}`, ORIGIN)), false);
    assert.equal(isClarityEntryUrl(new URL("/post-job", ORIGIN)), true);
    assert.equal(isClarityEntryUrl(new URL("/post-job/success", ORIGIN)), true);
  });

  it("does not start a visit whose referrer is an excluded page", () => {
    assert.equal(isClaritySafeReferrer("", ORIGIN), true);
    assert.equal(isClaritySafeReferrer("https://www.google.com/", ORIGIN), true);
    assert.equal(isClaritySafeReferrer(`${ORIGIN}/jobs?q=driver`, ORIGIN), true);
    assert.equal(
      isClaritySafeReferrer(`${ORIGIN}/employer/candidates/${OBJECT_ID}`, ORIGIN),
      false,
    );
    assert.equal(isClaritySafeReferrer(`${ORIGIN}/team/accept-invitation?token=abc`, ORIGIN), false);
    assert.equal(isClaritySafeReferrer("not a url", ORIGIN), false);
  });
});

describe("Clarity tags", () => {
  it("uses fixed page types without ids", () => {
    assert.equal(clarityPageType("/"), "home");
    assert.equal(clarityPageType("/jobs/AJ1234"), "job_detail");
    assert.equal(clarityPageType(`/post-job/${OBJECT_ID}`), "post_job_edit");
    assert.equal(clarityPageType("/post-job/success"), "post_job_success");
    assert.equal(
      clarityPageType(`/employer/jobs/${OBJECT_ID}/under-review`),
      "employer_job_under_review",
    );
    assert.equal(clarityPageType("/employer/help-center"), "employer_help_center");
    assert.equal(clarityPageType("/job-seeker/saved-jobs/"), "job_seeker_saved_jobs");
    assert.equal(clarityPageType("/unknown/a1b2c3/deep"), "other");
  });

  it("maps each area to a dashboard type", () => {
    assert.equal(clarityDashboardType("/jobs"), "public_site");
    assert.equal(clarityDashboardType("/employer/login"), "auth");
    assert.equal(clarityDashboardType("/job-seeker/register"), "auth");
    assert.equal(clarityDashboardType("/team-member/login"), "auth");
    assert.equal(clarityDashboardType("/post-job"), "employer_dashboard");
    assert.equal(clarityDashboardType("/employer/jobs"), "employer_dashboard");
    assert.equal(clarityDashboardType("/job-seeker/profile"), "job_seeker_dashboard");
  });

  it("sends only the three safe tags", () => {
    assert.deepEqual(clarityTagsFor("/employer/dashboard", "employer"), {
      user_role: "employer",
      page_type: "employer_dashboard",
      dashboard_type: "employer_dashboard",
    });
  });
});
