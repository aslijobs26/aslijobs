import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import mongoose from "mongoose";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { EmployerModel } from "../employers/employer.model.js";
import { JobModel } from "./job.model.js";
import { jobService } from "./job.service.js";
import {
  normalizeCompanyWebsite,
  resolveHiringOrganizationAssets,
  toPublicJobSeoSnapshot,
  type PublicJobSeoSource,
} from "./public-job-seo.js";

const EMPLOYER_ID = new mongoose.Types.ObjectId();

const ACTIVE_JOB: PublicJobSeoSource & {
  status: string;
  employerId: mongoose.Types.ObjectId;
  creationSource: string;
  contactMobile: string;
  contactEmail: string;
  contactPersonName: string;
  views: number;
} = {
  jobId: "AJ-2026-000123",
  status: "active",
  employerId: EMPLOYER_ID,
  creationSource: "employer",
  jobTitle: "Delivery Boy",
  description: "<p>Deliver parcels across Hyderabad.</p>",
  interviewInstructions: "",
  contentLanguage: "en",
  companyName: "ABC Services",
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
  publishedAt: new Date("2026-10-07T05:29:28.147Z"),
  createdAt: new Date("2026-10-06T10:00:00.000Z"),
  contactMobile: "9876543210",
  contactEmail: "hr@abc.example",
  contactPersonName: "Private Recruiter",
  views: 42,
};

const VERIFIED_COMPANY = {
  _id: EMPLOYER_ID,
  verificationStatus: "verified",
  accountType: "company",
  companyName: "ABC Services",
  website: "www.abcservices.example",
  companyLogo: { url: "https://res.cloudinary.com/demo/image/upload/abc-logo.png" },
};

describe("toPublicJobSeoSnapshot", () => {
  it("maps only public job fields", () => {
    const snapshot = toPublicJobSeoSnapshot(ACTIVE_JOB, VERIFIED_COMPANY);

    assert.deepEqual(snapshot, {
      publicJobId: "AJ-2026-000123",
      jobTitle: "Delivery Boy",
      description: "<p>Deliver parcels across Hyderabad.</p>",
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
    });

    const serialized = JSON.stringify(snapshot);
    for (const secret of ["9876543210", "hr@abc.example", "Private Recruiter", String(EMPLOYER_ID)]) {
      assert.ok(!serialized.includes(secret), `leaked ${secret}`);
    }
  });

  it("drops invalid salaries and dates instead of inventing values", () => {
    const snapshot = toPublicJobSeoSnapshot(
      {
        ...ACTIVE_JOB,
        salaryType: "",
        fixedSalary: null,
        minimumSalary: 0,
        maximumSalary: Number.NaN,
        publishedAt: null,
        createdAt: "not-a-date",
        salaryPeriod: "",
      },
      null,
    );

    assert.equal(snapshot.fixedSalary, null);
    assert.equal(snapshot.minimumSalary, null);
    assert.equal(snapshot.maximumSalary, null);
    assert.equal(snapshot.publishedAt, null);
    assert.equal(snapshot.createdAt, null);
    assert.equal(snapshot.salaryPeriod, "per-month");
    assert.equal(snapshot.companyLogoUrl, "");
    assert.equal(snapshot.companyWebsite, "");
  });

  it("uses a usable English translation, like the default-language job page", () => {
    const snapshot = toPublicJobSeoSnapshot(
      {
        ...ACTIVE_JOB,
        jobTitle: "డెలివరీ బాయ్",
        description: "<p>హైదరాబాద్‌లో పార్సిల్స్ డెలివరీ చేయాలి.</p>",
        contentLanguage: "te",
        contentTranslations: {},
      },
      null,
    );

    // No stored translation: the page shows the original text, and so do we.
    assert.equal(snapshot.jobTitle, "డెలివరీ బాయ్");
    assert.equal(snapshot.description, "<p>హైదరాబాద్‌లో పార్సిల్స్ డెలివరీ చేయాలి.</p>");
  });
});

describe("resolveHiringOrganizationAssets", () => {
  it("uses the employer logo and website only for the same business", () => {
    assert.deepEqual(
      resolveHiringOrganizationAssets("abc  services", VERIFIED_COMPANY),
      {
        companyLogoUrl: "https://res.cloudinary.com/demo/image/upload/abc-logo.png",
        companyWebsite: "https://www.abcservices.example/",
      },
    );
    assert.deepEqual(
      resolveHiringOrganizationAssets("Client Corp", {
        ...VERIFIED_COMPANY,
        accountType: "consultancy",
      }),
      { companyLogoUrl: "", companyWebsite: "" },
    );
    assert.deepEqual(
      resolveHiringOrganizationAssets("ABC Services", {
        ...VERIFIED_COMPANY,
        accountType: "individual",
      }),
      { companyLogoUrl: "", companyWebsite: "" },
    );
  });

  it("accepts only public http(s) websites", () => {
    assert.equal(normalizeCompanyWebsite("https://abc.example/careers"), "https://abc.example/careers");
    assert.equal(normalizeCompanyWebsite("abc.example"), "https://abc.example/");
    for (const value of ["", "javascript:alert(1)", "http://localhost:3000", "http://10.0.0.1", "https://user:pass@abc.example", "not a site"]) {
      assert.equal(normalizeCompanyWebsite(value), "", value);
    }
  });
});

describe("jobService.getPublicJobSeoByPublicId", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  function useJobs(
    jobs: Array<Record<string, unknown>>,
    employer: Record<string, unknown> | null = VERIFIED_COMPANY,
  ) {
    mock.method(JobModel, "findOne", (filter: { jobId: string; status: string }) =>
      Promise.resolve(
        jobs.find((job) => job.jobId === filter.jobId && job.status === filter.status) ?? null,
      ),
    );
    mock.method(EmployerModel, "findById", () => ({
      select: () => ({ lean: () => Promise.resolve(employer) }),
    }));
    const writes = mock.method(JobModel, "updateOne", () => {
      throw new Error("structured data must not write to jobs");
    });
    return { writes };
  }

  async function expectNotFound(promise: Promise<unknown>) {
    await assert.rejects(promise, (error: { statusCode?: number; status?: number }) => {
      assert.equal(error.statusCode ?? error.status, HTTP_STATUS.NOT_FOUND);
      return true;
    });
  }

  it("returns the snapshot for an active job of a verified employer without side effects", async () => {
    const { writes } = useJobs([ACTIVE_JOB]);

    const result = await jobService.getPublicJobSeoByPublicId("aj-2026-000123");

    assert.equal(result.job.publicJobId, "AJ-2026-000123");
    assert.equal(result.job.companyName, "ABC Services");
    assert.equal(writes.mock.callCount(), 0);
  });

  for (const status of ["draft", "pending_approval", "paused", "closed", "expired", "rejected"]) {
    it(`hides a ${status} job`, async () => {
      useJobs([{ ...ACTIVE_JOB, status }]);
      await expectNotFound(jobService.getPublicJobSeoByPublicId("AJ-2026-000123"));
    });
  }

  it("hides a deleted job", async () => {
    useJobs([]);
    await expectNotFound(jobService.getPublicJobSeoByPublicId("AJ-2026-000123"));
  });

  it("hides an employer job when the employer is not verified", async () => {
    useJobs([ACTIVE_JOB], { ...VERIFIED_COMPANY, verificationStatus: "pending" });
    await expectNotFound(jobService.getPublicJobSeoByPublicId("AJ-2026-000123"));
  });

  it("keeps Operations-created jobs public, like the job page", async () => {
    useJobs([{ ...ACTIVE_JOB, creationSource: "operations" }], null);
    const result = await jobService.getPublicJobSeoByPublicId("AJ-2026-000123");
    assert.equal(result.job.publicJobId, "AJ-2026-000123");
    assert.equal(result.job.companyLogoUrl, "");
  });
});
