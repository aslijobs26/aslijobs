import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WHATSAPP_CONTACT_URL } from "@/constants/cta";
import {
  hasPrivateUrlData,
  isSafeFreeText,
  sanitizeAnalyticsReferrer,
  sanitizeAnalyticsUrl,
} from "./analytics-url";
import {
  ctaNameForLink,
  firebaseEventFor,
  isSamePageView,
} from "./firebase-events";

const ORIGIN = "https://www.aslijobs.com";
const OBJECT_ID = "6ae32e32f16563acf5a1c7c9";

function at(path: string): URL {
  return new URL(path, ORIGIN);
}

describe("analytics URL sanitizing", () => {
  it("replaces database ids and drops private query parameters and hashes", () => {
    assert.equal(
      sanitizeAnalyticsUrl(`${ORIGIN}/employer/candidates/${OBJECT_ID}#resume`),
      `${ORIGIN}/employer/candidates/:id`,
    );
    assert.equal(
      sanitizeAnalyticsUrl(`${ORIGIN}/team/accept-invitation?token=abc&utm_source=mail`),
      `${ORIGIN}/team/accept-invitation?utm_source=mail`,
    );
    assert.equal(
      sanitizeAnalyticsUrl(
        `${ORIGIN}/job-seeker/application-success?applicationId=${OBJECT_ID}`,
      ),
      `${ORIGIN}/job-seeker/application-success`,
    );
  });

  it("keeps public job ids and job search filters", () => {
    assert.equal(
      sanitizeAnalyticsUrl(`${ORIGIN}/jobs/AJ1234`),
      `${ORIGIN}/jobs/AJ1234`,
    );
    assert.equal(
      sanitizeAnalyticsUrl(`${ORIGIN}/jobs?q=driver&state=telangana&job=AJ1234`),
      `${ORIGIN}/jobs?q=driver&state=telangana&job=AJ1234`,
    );
  });

  it("drops typed search text that looks like a phone number or email", () => {
    assert.equal(isSafeFreeText("delivery executive"), true);
    assert.equal(isSafeFreeText("9876543210"), false);
    assert.equal(isSafeFreeText("me@example.com"), false);
    assert.equal(
      sanitizeAnalyticsUrl(`${ORIGIN}/jobs?q=9876543210&city=hyderabad`),
      `${ORIGIN}/jobs?city=hyderabad`,
    );
  });

  it("detects URLs the Google tag must not read unfiltered", () => {
    assert.equal(hasPrivateUrlData(`${ORIGIN}/jobs?q=driver&utm_source=whatsapp&fbclid=abc`), false);
    assert.equal(hasPrivateUrlData(`${ORIGIN}/jobs?minSalary=15000&maxSalary=100000`), false);
    assert.equal(hasPrivateUrlData(`${ORIGIN}/employer/candidates/${OBJECT_ID}`), true);
    assert.equal(hasPrivateUrlData(`${ORIGIN}/team/accept-invitation?token=abc`), true);
    assert.equal(
      hasPrivateUrlData(
        `${ORIGIN}/employer/login?returnUrl=${encodeURIComponent(`/employer/candidates/${OBJECT_ID}`)}`,
      ),
      true,
    );
    assert.equal(hasPrivateUrlData(`${ORIGIN}/jobs?q=9876543210`), true);
    assert.equal(hasPrivateUrlData(`${ORIGIN}/register?ref=me@example.com`), true);
  });

  it("sanitizes same-site referrers and reduces others to their origin", () => {
    assert.equal(
      sanitizeAnalyticsReferrer(`${ORIGIN}/team/accept-invitation?token=abc`, ORIGIN),
      `${ORIGIN}/team/accept-invitation`,
    );
    assert.equal(
      sanitizeAnalyticsReferrer("https://www.google.com/search?q=jobs", ORIGIN),
      "https://www.google.com/",
    );
    assert.equal(sanitizeAnalyticsReferrer("", ORIGIN), "");
  });
});

describe("Firebase event mapping", () => {
  it("leaves page views to the page tracker", () => {
    assert.equal(firebaseEventFor({ eventName: "page_view" }, at("/")), null);
  });

  it("maps registration to sign_up with the role and no personal data", () => {
    assert.deepEqual(
      firebaseEventFor(
        { eventName: "registration_completed", portal: "employer", audience: "employer" },
        at("/employer/register"),
      ),
      { name: "sign_up", params: { method: "whatsapp_otp", user_role: "employer" } },
    );
  });

  it("maps job search to search with the keyword and filters", () => {
    assert.deepEqual(
      firebaseEventFor(
        { eventName: "job_search", audience: "job_seeker" },
        at("/jobs?q=driver&state=telangana&city=hyderabad&jobType=full-time&gender=male"),
      ),
      {
        name: "search",
        params: {
          search_term: "driver",
          location_state: "telangana",
          location_city: "hyderabad",
          job_type: "full-time",
        },
      },
    );
    assert.deepEqual(
      firebaseEventFor({ eventName: "job_search" }, at("/jobs?q=me@example.com")),
      { name: "search", params: {} },
    );
  });

  it("adds the public job id to job events", () => {
    assert.deepEqual(
      firebaseEventFor(
        { eventName: "job_application_submitted", path: "/jobs/AJ1234", audience: "job_seeker" },
        at("/jobs/AJ1234"),
      ),
      {
        name: "job_application_submitted",
        params: { job_id: "AJ1234", user_role: "job_seeker" },
      },
    );
    assert.deepEqual(
      firebaseEventFor(
        { eventName: "employer_job_posted", portal: "employer", audience: "employer" },
        at("/post-job"),
      ),
      { name: "employer_job_posted", params: { user_role: "employer" } },
    );
  });
});

describe("CTA links", () => {
  it("names AsliJobs CTAs and ignores ordinary links", () => {
    assert.equal(ctaNameForLink(at("/post-job"), ORIGIN), "post_job");
    assert.equal(ctaNameForLink(at("/employer/register/"), ORIGIN), "employer_register");
    assert.equal(ctaNameForLink(at("/job-seeker/login?returnUrl=%2Fjobs"), ORIGIN), "job_seeker_login");
    assert.equal(ctaNameForLink(at("/contact"), ORIGIN), "contact");
    assert.equal(ctaNameForLink(at("/jobs"), ORIGIN), null);
    assert.equal(ctaNameForLink(new URL("https://evil.example/post-job"), ORIGIN), null);
  });

  it("counts only AsliJobs' own WhatsApp number", () => {
    const official = new URL(WHATSAPP_CONTACT_URL);
    official.searchParams.set("text", "Hi");
    assert.equal(ctaNameForLink(official, ORIGIN), "whatsapp");
    assert.equal(ctaNameForLink(new URL("https://wa.me/919999999999"), ORIGIN), null);
  });
});

describe("page view de-duplication", () => {
  it("treats the post-job draft URL swap as the same page", () => {
    assert.equal(isSamePageView("/jobs", "/jobs"), true);
    assert.equal(isSamePageView("/post-job", "/post-job/:id"), true);
    assert.equal(isSamePageView("/", "/jobs"), false);
    assert.equal(isSamePageView("/post-job/:id", "/post-job/success"), false);
  });
});
