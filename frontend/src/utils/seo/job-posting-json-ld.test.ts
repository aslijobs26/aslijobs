import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFallbackJobMetadata,
  buildJobPageMetadata,
  buildUnavailableJobMetadata,
} from "./job-page-metadata";
import {
  buildJobPostingJsonLd,
  serializeJsonLd,
  toJobPostingDescriptionHtml,
  type JobPostingJsonLd,
} from "./job-posting-json-ld";
import {
  normalizePublicJobId,
  parsePublicJobSeoResponse,
  type PublicJobSeo,
} from "./public-job-seo";

const SITE = "https://www.aslijobs.com";

const COMPLETE_JOB: PublicJobSeo = {
  publicJobId: "AJ-2026-000123",
  jobTitle: "Delivery Boy",
  description: "<p>Deliver parcels across Hyderabad.</p><ul><li>Two-wheeler required</li></ul>",
  companyName: "ABC Services",
  companyLogoUrl: "https://res.cloudinary.com/demo/image/upload/abc-logo.png",
  companyWebsite: "https://www.abcservices.example/",
  jobType: "full-time",
  workMode: "field",
  address: "Plot 12, Madhapur",
  city: "hyderabad",
  cityName: "Hyderabad",
  state: "telangana",
  stateName: "Telangana",
  salaryType: "range",
  salaryPeriod: "per-month",
  fixedSalary: null,
  minimumSalary: 15000,
  maximumSalary: 20000,
  publishedAt: "2026-10-07T05:29:28.147Z",
  createdAt: "2026-10-06T10:00:00.000Z",
};

function build(overrides: Partial<PublicJobSeo> = {}): JobPostingJsonLd {
  const jsonLd = buildJobPostingJsonLd({ ...COMPLETE_JOB, ...overrides }, SITE);
  assert.ok(jsonLd, "expected JobPosting structured data");
  return jsonLd;
}

function roundTrip(jsonLd: JobPostingJsonLd): Record<string, unknown> {
  return JSON.parse(serializeJsonLd(jsonLd)) as Record<string, unknown>;
}

describe("buildJobPostingJsonLd", () => {
  it("1. maps an active job with complete information to a valid JobPosting", () => {
    assert.deepEqual(roundTrip(build()), {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Delivery Boy",
      description: "<p>Deliver parcels across Hyderabad.</p><ul><li>Two-wheeler required</li></ul>",
      identifier: { "@type": "PropertyValue", name: "AsliJobs", value: "AJ-2026-000123" },
      url: "https://www.aslijobs.com/jobs/AJ-2026-000123",
      datePosted: "2026-10-07T05:29:28.147Z",
      employmentType: "FULL_TIME",
      hiringOrganization: {
        "@type": "Organization",
        name: "ABC Services",
        sameAs: "https://www.abcservices.example/",
        logo: "https://res.cloudinary.com/demo/image/upload/abc-logo.png",
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Plot 12, Madhapur",
          addressLocality: "Hyderabad",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
      },
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: { "@type": "QuantitativeValue", minValue: 15000, maxValue: 20000, unitText: "MONTH" },
      },
      directApply: false,
    });
  });

  it("2. omits baseSalary when no salary was entered (undisclosed)", () => {
    const jsonLd = build({ salaryType: "", fixedSalary: null, minimumSalary: null, maximumSalary: null });
    assert.equal("baseSalary" in jsonLd, false);
  });

  it("3. omits the logo when the company has none or it is not public https", () => {
    assert.equal("logo" in (build({ companyLogoUrl: "" }).hiringOrganization as object), false);
    assert.equal(
      "logo" in (build({ companyLogoUrl: "http://localhost:5000/uploads/logo.png" }).hiringOrganization as object),
      false,
    );
  });

  it("4. uses a single value for a fixed salary, with the yearly unit when applicable", () => {
    assert.deepEqual(build({ salaryType: "fixed", fixedSalary: 300000, salaryPeriod: "per-year" }).baseSalary, {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: { "@type": "QuantitativeValue", value: 300000, unitText: "YEAR" },
    });
  });

  it("5. uses minValue/maxValue for a range and handles open-ended or invalid ranges", () => {
    const range = build().baseSalary as { value: Record<string, unknown> };
    assert.equal(range.value.minValue, 15000);
    assert.equal(range.value.maxValue, 20000);

    const from = build({ salaryType: "range", maximumSalary: null }).baseSalary as { value: Record<string, unknown> };
    assert.deepEqual(from.value, { "@type": "QuantitativeValue", minValue: 15000, unitText: "MONTH" });

    const equal = build({ minimumSalary: 18000, maximumSalary: 18000 }).baseSalary as { value: Record<string, unknown> };
    assert.deepEqual(equal.value, { "@type": "QuantitativeValue", value: 18000, unitText: "MONTH" });

    assert.equal("baseSalary" in build({ minimumSalary: 30000, maximumSalary: 20000 }), false);
  });

  it("6. on-site (office) jobs get a physical jobLocation and are not remote", () => {
    const jsonLd = build({ workMode: "office" });
    assert.ok(jsonLd.jobLocation);
    assert.equal("jobLocationType" in jsonLd, false);
    assert.equal("applicantLocationRequirements" in jsonLd, false);
  });

  it("7. Work from Home jobs are TELECOMMUTE with an India applicant requirement", () => {
    const jsonLd = build({ workMode: "home" });
    assert.equal(jsonLd.jobLocationType, "TELECOMMUTE");
    assert.deepEqual(jsonLd.applicantLocationRequirements, { "@type": "Country", name: "India" });
    assert.equal("jobLocation" in jsonLd, false);
  });

  it("8. Office + Field (hybrid) jobs stay on-site and are never marked remote", () => {
    const jsonLd = build({ workMode: "both" });
    assert.ok(jsonLd.jobLocation);
    assert.equal("jobLocationType" in jsonLd, false);
  });

  it("9. still produces valid data without optional fields", () => {
    const jsonLd = build({
      companyLogoUrl: "",
      companyWebsite: "",
      jobType: "",
      address: "",
      cityName: "",
      city: "",
      salaryType: "",
      minimumSalary: null,
      maximumSalary: null,
      publishedAt: null,
    });
    assert.deepEqual(jsonLd.hiringOrganization, { "@type": "Organization", name: "ABC Services" });
    assert.deepEqual(jsonLd.jobLocation, {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressRegion: "Telangana", addressCountry: "IN" },
    });
    assert.equal(jsonLd.datePosted, "2026-10-06T10:00:00.000Z");
    for (const key of ["employmentType", "baseSalary", "validThrough"]) {
      assert.equal(key in jsonLd, false, key);
    }
  });

  it("16. returns null when a required property is missing or malformed", () => {
    const cases: Array<Partial<PublicJobSeo>> = [
      { jobTitle: "  " },
      { description: "" },
      { description: "<p> </p>" },
      { description: "Delivery Boy" },
      { companyName: "" },
      { publishedAt: null, createdAt: null },
      { publishedAt: "not-a-date", createdAt: null },
      { workMode: "office", city: "", cityName: "", state: "", stateName: "" },
    ];
    for (const overrides of cases) {
      assert.equal(buildJobPostingJsonLd({ ...COMPLETE_JOB, ...overrides }, SITE), null, JSON.stringify(overrides));
    }
  });

  it("never sets validThrough, since AsliJobs has no application deadline field", () => {
    assert.equal("validThrough" in build(), false);
  });
});

describe("structured data safety", () => {
  const ATTACK = `<p>Join us</p></script><script>alert("xss")</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">apply</a>`;

  it("17. sanitizes description HTML like the job page", () => {
    const html = toJobPostingDescriptionHtml(ATTACK);
    assert.ok(html.startsWith("<p>Join us</p>"));
    for (const unsafe of ["<script", "onerror", "<img", "javascript:"]) {
      assert.ok(!html.includes(unsafe), unsafe);
    }
  });

  it("17. never lets JSON-LD text close the script element", () => {
    const serialized = serializeJsonLd(
      build({
        jobTitle: `Driver </script><script>alert(1)</script>`,
        companyName: `ABC & Sons <b>`,
        description: ATTACK,
      }),
    );
    assert.ok(!serialized.includes("<"));
    assert.ok(!serialized.includes(">"));
    assert.ok(!/<\/script/i.test(serialized));
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    assert.equal(parsed.title, `Driver </script><script>alert(1)</script>`);
    assert.equal((parsed.hiringOrganization as Record<string, unknown>).name, "ABC & Sons <b>");
  });

  it("escapes legacy plain-text descriptions into paragraphs", () => {
    assert.equal(
      toJobPostingDescriptionHtml("Line one\nWithin <5 km & \"nearby\"\n\nSecond & last"),
      "<p>Line one<br>Within &lt;5 km &amp; &quot;nearby&quot;</p><p>Second &amp; last</p>",
    );
  });

  it("contains no recruiter contact or internal fields", () => {
    const serialized = serializeJsonLd(build());
    for (const field of ["contactMobile", "contactEmail", "contactPersonName", "applyWhatsAppNumber", "employerId", "views", "_id"]) {
      assert.ok(!serialized.includes(field), field);
    }
  });
});

describe("job page metadata", () => {
  it("builds the dynamic title, description, canonical and Open Graph tags", () => {
    assert.deepEqual(buildJobPageMetadata(COMPLETE_JOB, SITE), {
      title: "Delivery Boy Jobs in Hyderabad | AsliJobs",
      description:
        "Apply for Delivery Boy jobs in Hyderabad at ABC Services. View salary, job requirements and application details on AsliJobs.",
      alternates: { canonical: "https://www.aslijobs.com/jobs/AJ-2026-000123" },
      openGraph: {
        type: "website",
        siteName: "AsliJobs",
        url: "https://www.aslijobs.com/jobs/AJ-2026-000123",
        title: "Delivery Boy Jobs in Hyderabad | AsliJobs",
        description:
          "Apply for Delivery Boy jobs in Hyderabad at ABC Services. View salary, job requirements and application details on AsliJobs.",
        images: [{ url: "https://res.cloudinary.com/demo/image/upload/abc-logo.png", alt: "ABC Services" }],
      },
    });
  });

  it("avoids doubled 'Jobs' and missing parts", () => {
    const metadata = buildJobPageMetadata(
      { ...COMPLETE_JOB, jobTitle: "Sales Jobs", cityName: "", city: "", companyLogoUrl: "", companyName: "" },
      SITE,
    );
    assert.equal(metadata.title, "Sales Jobs in Telangana | AsliJobs");
    assert.equal(
      metadata.description,
      "Apply for Sales jobs in Telangana. View salary, job requirements and application details on AsliJobs.",
    );
    assert.equal("images" in (metadata.openGraph ?? {}), false);
  });

  it("keeps unavailable jobs out of the index", () => {
    assert.deepEqual(buildUnavailableJobMetadata(SITE, "AJ-2026-000123"), {
      title: "Job not available | AsliJobs",
      description: "This job is no longer accepting applications on AsliJobs.",
      robots: { index: false, follow: true },
      alternates: { canonical: "https://www.aslijobs.com/jobs/AJ-2026-000123" },
    });
    assert.equal("alternates" in buildUnavailableJobMetadata(SITE, null), false);
  });

  it("falls back to the previous generic metadata while the API is unreachable", () => {
    const metadata = buildFallbackJobMetadata(SITE, "aj-2026-000123", "AJ-2026-000123");
    assert.equal(metadata.title, "AJ-2026-000123 | AsliJobs");
    assert.equal("robots" in metadata, false);
  });
});

describe("public job SEO payload", () => {
  it("normalizes public job ids and rejects anything else", () => {
    assert.equal(normalizePublicJobId(" aj-2026-000123 "), "AJ-2026-000123");
    assert.equal(normalizePublicJobId("../employer/dashboard"), null);
    assert.equal(normalizePublicJobId("AJ-ELEC-2"), null);
  });

  it("parses the backend response and rejects malformed payloads", () => {
    assert.deepEqual(parsePublicJobSeoResponse({ success: true, data: { job: COMPLETE_JOB } }), COMPLETE_JOB);
    assert.equal(parsePublicJobSeoResponse({ success: true, data: { job: { ...COMPLETE_JOB, publicJobId: "bad" } } }), null);
    assert.equal(parsePublicJobSeoResponse({ success: false }), null);
    assert.equal(parsePublicJobSeoResponse(null), null);

    const coerced = parsePublicJobSeoResponse({
      data: { job: { ...COMPLETE_JOB, minimumSalary: "15000", maximumSalary: -1, publishedAt: "garbage", jobTitle: 42 } },
    });
    assert.ok(coerced);
    assert.equal(coerced.minimumSalary, null);
    assert.equal(coerced.maximumSalary, null);
    assert.equal(coerced.publishedAt, null);
    assert.equal(coerced.jobTitle, "");
  });
});
