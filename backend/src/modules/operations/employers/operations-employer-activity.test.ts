import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compareActivityOrder,
  decodeActivityCursor,
  encodeActivityCursor,
  parseApplicationActivityStats,
  type ActivityCursor,
  type ApplicationActivityRow,
} from "../activity/activity-timeline.js";
import { OPERATIONS_JOB_AUDIT_ACTIONS } from "../jobs/operations-job-moderation.constants.js";
import {
  ACTIVITY_DUPLICATE_WINDOW_MS,
  buildEmployerActivitySummary,
  buildEmployerJourney,
  buildEmployerProfileEntries,
  buildJobFieldEventCountPipeline,
  buildJobFieldEventPagePipeline,
  countEmployerActivity,
  employerActivitySourceFromEntries,
  employerApplicationRowToEntry,
  employerAuditRowToEntry,
  employerDocumentRowToEntry,
  employerLoginRowToEntry,
  emptyEmployerAuditTimes,
  jobAuditRowToEntry,
  jobFieldRowToEntry,
  paginateEmployerActivity,
  parseEmployerJobStats,
  savedCandidateRowToEntry,
  teamActivityRowToEntry,
  type EmployerActivityCategory,
  type EmployerActivityEntry,
  type EmployerActivityProfileInput,
  type EmployerActivityRefs,
  type EmployerActivitySource,
  type EmployerJobStats,
} from "./operations-employer-activity.js";
import { listOperationsEmployerActivityQuerySchema } from "./operations-employers.validation.js";

const refs: EmployerActivityRefs = {
  jobTitle: (jobId) => (jobId === "job1" ? "Driver" : ""),
  candidate: (jobSeekerId) =>
    jobSeekerId === "seeker1"
      ? { displayId: "AJ-CAN-00000001", name: "Ravi Kumar" }
      : { displayId: jobSeekerId ? "AJ-CAN-FFFFFFFF" : "", name: "" },
};

const at = (iso: string) => new Date(iso);

function employer(
  overrides: Partial<EmployerActivityProfileInput> = {},
): EmployerActivityProfileInput {
  return {
    accountType: "company",
    createdAt: at("2026-07-30T06:15:00.000Z"),
    isWhatsappVerified: true,
    whatsappVerifiedAt: null,
    isProfileComplete: true,
    profileCompletedAt: null,
    registrationStatus: "completed",
    verificationStatus: "pending",
    status: "active",
    ...overrides,
  };
}

function render(entries: EmployerActivityEntry[]) {
  return entries.map((entry) => entry.render(refs));
}

function ids(entries: EmployerActivityEntry[]) {
  return entries.map((entry) => entry.id);
}

const emptyJobs: EmployerJobStats = parseEmployerJobStats([]);

describe("employer activity profile entries", () => {
  it("builds dated milestones and hides undated legacy facts", () => {
    const events = render(buildEmployerProfileEntries(employer()));
    assert.deepEqual(
      events.map((event) => event.type),
      ["account_registered"],
    );
    assert.equal(events[0]?.at, "2026-07-30T06:15:00.000Z");
    assert.doesNotMatch(events[0]!.description, /\d{10}/);
  });

  it("shows recorded WhatsApp and completion dates once", () => {
    const completed = at("2026-07-30T06:30:00.000Z");
    const entries = buildEmployerProfileEntries(
      employer({
        whatsappVerifiedAt: at("2026-07-30T06:16:00.000Z"),
        profileCompletedAt: completed,
        // First submission happens at completion and must not repeat.
        verificationSubmittedAt: completed,
      }),
    );
    assert.deepEqual(ids(entries), [
      "account:registered",
      "account:whatsapp_verified",
      "profile:completed",
    ]);
  });

  it("does not show a WhatsApp event for an unverified number", () => {
    const entries = buildEmployerProfileEntries(
      employer({ isWhatsappVerified: false, whatsappVerifiedAt: at("2026-07-30T06:16:00.000Z") }),
    );
    assert.ok(!ids(entries).includes("account:whatsapp_verified"));
  });

  it("uses audits over latest-state fields and keeps legacy-only history", () => {
    const verifiedAt = at("2026-10-07T05:29:50.817Z");
    const resubmittedAt = at("2026-10-06T10:00:00.000Z");
    const withAudits = buildEmployerProfileEntries(
      employer({
        profileCompletedAt: at("2026-08-01T00:00:00.000Z"),
        verificationSubmittedAt: resubmittedAt,
        verificationStatus: "verified",
        verifiedAt,
        verifiedByName: "Ops Admin",
        auditTimes: {
          ...emptyEmployerAuditTimes(),
          approved: [new Date(verifiedAt.getTime() + 160)],
          resubmitted: [new Date(resubmittedAt.getTime() + 40)],
        },
      }),
    );
    assert.ok(!ids(withAudits).includes("verification:verified"));
    assert.ok(!ids(withAudits).includes("verification:submitted"));

    const legacy = render(
      buildEmployerProfileEntries(
        employer({
          verificationSubmittedAt: resubmittedAt,
          verificationStatus: "verified",
          verifiedAt,
          verifiedByName: "Ops Admin",
        }),
      ),
    );
    const verified = legacy.find((event) => event.id === "verification:verified");
    assert.equal(verified?.actor, "operations");
    assert.equal(verified?.description, "By Ops Admin");
    assert.ok(legacy.some((event) => event.id === "verification:submitted"));
  });

  it("treats audits outside the duplicate window as separate actions", () => {
    const verifiedAt = at("2026-10-07T05:29:50.817Z");
    const entries = buildEmployerProfileEntries(
      employer({
        verificationStatus: "verified",
        verifiedAt,
        auditTimes: {
          ...emptyEmployerAuditTimes(),
          approved: [new Date(verifiedAt.getTime() + ACTIVITY_DUPLICATE_WINDOW_MS + 1)],
        },
      }),
    );
    assert.ok(ids(entries).includes("verification:verified"));
  });

  it("shows rejection remarks only while still rejected, and legacy suspension only while suspended", () => {
    const rejected = render(
      buildEmployerProfileEntries(
        employer({
          verificationStatus: "rejected",
          rejectedAt: at("2026-09-01T00:00:00.000Z"),
          verificationRemarks: "Blurry PAN",
          status: "suspended",
          suspendedAt: at("2026-09-02T00:00:00.000Z"),
          suspensionReason: "Spam",
        }),
      ),
    );
    assert.match(
      rejected.find((event) => event.id === "verification:rejected")!.description,
      /Reason: Blurry PAN/,
    );
    assert.match(
      rejected.find((event) => event.id === "operations:suspended")!.description,
      /Spam/,
    );

    const reactivated = buildEmployerProfileEntries(
      employer({ status: "active", suspendedAt: at("2026-09-02T00:00:00.000Z") }),
    );
    assert.ok(!ids(reactivated).includes("operations:suspended"));
  });

  it("shows the legacy last login only when login history does not cover it", () => {
    const loginAt = at("2026-11-09T10:00:00.000Z");
    assert.ok(
      ids(buildEmployerProfileEntries(employer({ lastLoginAt: loginAt }))).includes(
        "account:last_login",
      ),
    );
    assert.ok(
      !ids(
        buildEmployerProfileEntries(employer({ lastLoginAt: loginAt, lastLoginRecorded: true })),
      ).includes("account:last_login"),
    );
  });
});

describe("employer activity row mapping", () => {
  it("describes logins without credentials or network data", () => {
    const [event] = render([
      employerLoginRowToEntry({
        eventId: "login:1",
        at: at("2026-11-09T10:00:00.000Z"),
        method: "whatsapp_otp",
        client: { browser: "Chrome", os: "Windows", deviceType: "desktop" },
      }),
    ]);
    assert.equal(event?.title, "Logged in with WhatsApp OTP");
    assert.equal(event?.description, "Chrome on Windows · Desktop");
  });

  it("never exposes document file names", () => {
    const [event] = render([
      employerDocumentRowToEntry({
        eventId: "document:1",
        at: at("2026-08-01T00:00:00.000Z"),
        documentType: "gst-certificate",
        verificationStatus: "approved",
      }),
    ]);
    assert.equal(event?.title, "Verification document uploaded · Gst Certificate");
    assert.equal(event?.description, "Current document status: Approved");
  });

  it("maps employer audit actors", () => {
    const operations = employerAuditRowToEntry("verification")({
      eventId: "audit:1",
      at: at("2026-10-01T00:00:00.000Z"),
      action: "employer.verification_rejected",
      actorName: "Ops Admin",
      actorUserId: "64f0000000000000000000aa",
      reason: "Blurry",
    }).render(refs);
    assert.equal(operations.actor, "operations");
    assert.equal(operations.title, "Verification rejected");
    assert.equal(operations.description, "By Ops Admin — Reason: Blurry");

    const resubmitted = employerAuditRowToEntry("verification")({
      eventId: "audit:2",
      at: at("2026-10-02T00:00:00.000Z"),
      action: "employer.verification_resubmitted",
      actorName: "Employer",
      actorUserId: null,
    }).render(refs);
    assert.equal(resubmitted.actor, "employer");
    assert.equal(resubmitted.actorName, "");

    const suspended = employerAuditRowToEntry("operations")({
      eventId: "audit:3",
      at: at("2026-10-03T00:00:00.000Z"),
      action: "employer.account_suspended",
      actorName: "Ops Admin",
      actorUserId: "64f0000000000000000000aa",
      reason: "Spam",
    }).render(refs);
    assert.equal(suspended.category, "operations");
    assert.equal(suspended.title, "Account suspended");
  });

  it("maps job audits with the job title and public id", () => {
    const event = jobAuditRowToEntry({
      eventId: "job_audit:1",
      at: at("2026-10-01T00:00:00.000Z"),
      action: OPERATIONS_JOB_AUDIT_ACTIONS.CLOSED,
      actorName: "Employer",
      actorUserId: null,
      targetId: "AJ-2026-000072",
      targetLabel: "Driver",
    }).render(refs);
    assert.equal(event.title, "Job closed · Driver");
    assert.equal(event.actor, "employer");
    assert.equal(event.publicJobId, "AJ-2026-000072");
    assert.equal(event.description, "AJ-2026-000072");
  });

  it("maps job lifecycle fields with the right actor", () => {
    const base = {
      at: at("2026-10-01T00:00:00.000Z"),
      jobId: "job1",
      jobTitle: "Driver",
      publicJobId: "AJ-1",
    };
    const created = jobFieldRowToEntry({
      ...base,
      eventId: "job:1:created",
      kind: "created",
      creationSource: "operations",
    }).render(refs);
    assert.equal(created.title, "Job created by Operations · Driver");
    assert.equal(created.actor, "operations");

    const review = jobFieldRowToEntry({
      ...base,
      eventId: "job:1:review:0",
      kind: "review",
      reviewKind: "live_change",
      decision: "rejected",
      reason: "Salary missing",
    }).render(refs);
    assert.equal(review.title, "Live job changes rejected · Driver");
    assert.equal(review.type, "job_review_rejected");
    assert.equal(review.description, "AJ-1 — Reason: Salary missing");
    assert.equal(review.actor, "operations");
    assert.equal(created.type, "job_created");
  });

  it("renders applications from the employer side with permitted candidate labels", () => {
    const row = (overrides: Partial<ApplicationActivityRow>): ApplicationActivityRow => ({
      eventId: "application:a1:history:0",
      at: at("2026-10-10T07:31:47.485Z"),
      kind: "history",
      status: "submitted",
      actorType: "job_seeker",
      applicationId: "a1",
      jobId: "job1",
      jobSeekerId: "seeker1",
      publicJobId: "AJ-1",
      ...overrides,
    });
    const received = employerApplicationRowToEntry(row({})).render(refs);
    assert.equal(received.title, "Application received · Driver");
    assert.equal(received.description, "Ravi Kumar (AJ-CAN-00000001) · AJ-1");
    assert.equal(received.actor, "candidate");
    assert.equal(received.candidateName, "Ravi Kumar");

    const hidden = employerApplicationRowToEntry(row({ jobSeekerId: "seeker2" })).render(refs);
    assert.equal(hidden.candidateName, "");
    assert.equal(hidden.description, "AJ-CAN-FFFFFFFF · AJ-1");

    const shortlisted = employerApplicationRowToEntry(
      row({ status: "shortlisted", actorType: "employer" }),
    ).render(refs);
    assert.equal(shortlisted.actor, "employer");
    assert.equal(shortlisted.category, "application");

    const offer = employerApplicationRowToEntry(
      row({ kind: "offer_response", status: "declined" }),
    ).render(refs);
    assert.equal(offer.category, "offer");
    assert.equal(offer.title, "Offer declined by candidate · Driver");

    const selected = employerApplicationRowToEntry(
      row({ status: "selected", actorType: "employer" }),
    ).render(refs);
    assert.equal(selected.category, "application");
    assert.doesNotMatch(selected.type, /offer/);
  });

  it("maps saved candidates and team activity", () => {
    const saved = savedCandidateRowToEntry({
      eventId: "saved_candidate:1",
      at: at("2026-10-01T00:00:00.000Z"),
      jobSeekerId: "seeker1",
      jobId: "job1",
      publicJobId: "AJ-1",
      createdByName: "Asha",
    }).render(refs);
    assert.equal(saved.category, "candidate");
    assert.equal(saved.title, "Candidate saved · Ravi Kumar (AJ-CAN-00000001)");
    assert.equal(saved.description, "Driver · AJ-1 · Saved by Asha");

    const team = teamActivityRowToEntry({
      eventId: "team:1",
      at: at("2026-10-01T00:00:00.000Z"),
      type: "invitation_sent",
      message: "Invitation sent to Priya",
    }).render(refs);
    assert.equal(team.title, "Team · Invitation Sent");
    assert.equal(team.description, "Invitation sent to Priya");
  });
});

describe("employer journey and summary", () => {
  const jobs: EmployerJobStats = {
    total: 3,
    drafts: 1,
    live: 1,
    pending: 1,
    closed: 0,
    firstCreatedAt: at("2026-08-01T00:00:00.000Z"),
    firstPublishedAt: at("2026-08-03T00:00:00.000Z"),
    firstApprovedAt: at("2026-08-02T00:00:00.000Z"),
  };

  it("keeps legacy milestones done with no invented date", () => {
    const journey = buildEmployerJourney({ employer: employer(), jobs: emptyJobs, applications: null });
    const byId = Object.fromEntries(journey.map((stage) => [stage.id, stage]));
    assert.equal(byId.whatsapp_verified?.state, "done");
    assert.equal(byId.whatsapp_verified?.at, null);
    assert.equal(byId.profile_completed?.state, "done");
    assert.equal(byId.profile_completed?.at, null);
    assert.equal(byId.verified?.state, "current");
    assert.equal(byId.verified?.detail, "Awaiting Operations review");
    assert.equal(byId.first_job?.state, "pending");
    assert.ok(!("first_application" in byId));
  });

  it("dates stages from recorded milestones and job stats", () => {
    const journey = buildEmployerJourney({
      employer: employer({
        verificationStatus: "verified",
        verifiedAt: at("2026-07-31T00:00:00.000Z"),
        profileCompletedAt: at("2026-07-30T07:00:00.000Z"),
        verificationSubmittedAt: at("2026-07-30T09:00:00.000Z"),
      }),
      jobs,
      applications: parseApplicationActivityStats([
        {
          totals: [{ applications: 4, hired: 0, firstAppliedAt: at("2026-08-05T00:00:00.000Z") }],
          milestones: [],
        },
      ]),
    });
    const byId = Object.fromEntries(journey.map((stage) => [stage.id, stage]));
    assert.equal(byId.verification_submitted?.at, "2026-07-30T07:00:00.000Z");
    assert.equal(byId.verified?.at, "2026-07-31T00:00:00.000Z");
    assert.equal(byId.job_live?.at, "2026-08-02T00:00:00.000Z");
    assert.equal(byId.first_application?.detail, "4 applications");
    assert.equal(byId.first_hire?.state, "current");
  });

  it("marks a rejected employer as awaiting resubmission and hides job stages without access", () => {
    const journey = buildEmployerJourney({
      employer: employer({ verificationStatus: "rejected" }),
      jobs: null,
      applications: null,
    });
    assert.equal(journey.find((stage) => stage.id === "verified")?.detail, "Rejected · awaiting resubmission");
    assert.ok(!journey.some((stage) => stage.id === "first_job"));
  });

  it("builds summary totals from aggregate stats, not page rows", () => {
    const summary = buildEmployerActivitySummary({
      jobs,
      applications: null,
      savedCandidates: 0,
      lastLoginAt: at("2026-11-09T10:00:00.000Z"),
      lastActivityAt: null,
    });
    assert.equal(summary.jobs, 3);
    assert.equal(summary.pendingJobs, 1);
    assert.equal(summary.applications, 0);
    assert.equal(summary.lastLoginAt, "2026-11-09T10:00:00.000Z");
  });

  it("parses empty and populated job stats facets", () => {
    assert.deepEqual(emptyJobs, {
      total: 0,
      drafts: 0,
      live: 0,
      pending: 0,
      closed: 0,
      firstCreatedAt: null,
      firstPublishedAt: null,
      firstApprovedAt: null,
    });
    const parsed = parseEmployerJobStats([
      {
        totals: [{ total: 2, live: 1, firstCreatedAt: at("2026-08-01T00:00:00.000Z") }],
        approvals: [{ firstApprovedAt: "2026-08-02T00:00:00.000Z" }],
      },
    ]);
    assert.equal(parsed.total, 2);
    assert.equal(parsed.firstApprovedAt?.toISOString(), "2026-08-02T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Pagination over large in-memory sources
// ---------------------------------------------------------------------------

const BASE = Date.parse("2026-01-01T00:00:00.000Z");

function minutes(n: number): Date {
  // Many rows share a timestamp so ties must be broken by id.
  return new Date(BASE + Math.floor(n / 3) * 60_000);
}

function largeSources(includeCandidates: boolean): EmployerActivitySource[] {
  const applications: EmployerActivityEntry[] = [];
  for (let index = 0; index < 540; index += 1) {
    const kinds = ["submitted", "interview_scheduled", "offer_sent"] as const;
    const status = kinds[index % 3]!;
    applications.push(
      employerApplicationRowToEntry({
        eventId: `application:a${String(index).padStart(4, "0")}:history:0`,
        at: minutes(index),
        kind: "history",
        status,
        actorType: "employer",
        applicationId: `a${index}`,
        jobId: "job1",
        jobSeekerId: "seeker1",
        publicJobId: "AJ-1",
      }),
    );
  }
  const jobAudits = Array.from({ length: 230 }, (_, index) =>
    jobAuditRowToEntry({
      eventId: `job_audit:${String(index).padStart(4, "0")}`,
      at: minutes(index * 2),
      action: OPERATIONS_JOB_AUDIT_ACTIONS.PAUSED,
      actorName: "Employer",
      targetId: "AJ-1",
      targetLabel: "Driver",
    }),
  );
  const team = Array.from({ length: 210 }, (_, index) =>
    teamActivityRowToEntry({
      eventId: `team:${String(index).padStart(4, "0")}`,
      at: minutes(index * 3),
      type: "role_updated",
      message: "Role updated",
    }),
  );
  const sources = [
    employerActivitySourceFromEntries("employer", buildEmployerProfileEntries(employer())),
    employerActivitySourceFromEntries("job_audits", jobAudits),
    employerActivitySourceFromEntries("team", team),
  ];
  if (includeCandidates) {
    sources.push(employerActivitySourceFromEntries("applications", applications));
  }
  return sources;
}

async function walkAllPages(
  sources: EmployerActivitySource[],
  category: EmployerActivityCategory | null,
  limit: number,
) {
  const seen: EmployerActivityEntry[] = [];
  let cursor: ActivityCursor | null = null;
  for (let guard = 0; guard < 1000; guard += 1) {
    const page = await paginateEmployerActivity(sources, { cursor, limit, category });
    assert.ok(page.entries.length <= limit);
    seen.push(...page.entries);
    if (!page.hasMore) {
      assert.equal(page.nextCursor, null);
      return seen;
    }
    assert.ok(page.nextCursor);
    cursor = decodeActivityCursor(encodeActivityCursor(page.nextCursor));
  }
  throw new Error("pagination did not terminate");
}

async function everyEntry(
  sources: EmployerActivitySource[],
  category: EmployerActivityCategory | null,
) {
  const all = (
    await Promise.all(
      sources.map((source) =>
        source.fetch({ cursor: null, limit: Number.MAX_SAFE_INTEGER, category }),
      ),
    )
  ).flat();
  return all
    .filter((entry) => !category || entry.category === category)
    .sort(compareActivityOrder);
}

describe("employer activity pagination", () => {
  it("pages past 500 application events with ties and no gaps or duplicates", async () => {
    const sources = largeSources(true);
    const expected = await everyEntry(sources, null);
    assert.equal(expected.length, 540 + 230 + 210 + 1);

    const walked = await walkAllPages(sources, null, 37);
    assert.equal(new Set(walked.map((entry) => entry.id)).size, walked.length);
    assert.deepEqual(ids(walked), ids(expected));
    for (let index = 1; index < walked.length; index += 1) {
      assert.ok(compareActivityOrder(walked[index - 1]!, walked[index]!) < 0);
    }

    const counts = await countEmployerActivity(sources);
    assert.equal(counts.all, expected.length);
    assert.equal(counts.job, 230);
    assert.equal(counts.team, 210);
    assert.equal(counts.application + counts.interview + counts.offer, 540);
  });

  it("keeps a category filter across pages", async () => {
    const sources = largeSources(true);
    for (const category of ["interview", "job", "account"] as const) {
      const walked = await walkAllPages(sources, category, 20);
      const expected = await everyEntry(sources, category);
      assert.ok(walked.every((entry) => entry.category === category));
      assert.deepEqual(ids(walked), ids(expected));
    }
  });

  it("returns no candidate events without application permission", async () => {
    const sources = largeSources(false);
    const counts = await countEmployerActivity(sources);
    assert.equal(counts.application + counts.interview + counts.offer + counts.candidate, 0);
    const page = await paginateEmployerActivity(sources, {
      cursor: null,
      limit: 20,
      category: "application",
    });
    assert.deepEqual(page.entries, []);
    const walked = await walkAllPages(sources, null, 100);
    assert.equal(walked.length, counts.all);
  });
});

describe("employer job lifecycle pipeline", () => {
  const cursor = { at: at("2026-10-01T00:00:00.000Z"), id: "job:abc:created" };

  it("only reads jobs created before the cursor and drops facts that audits cover", () => {
    const stages = buildJobFieldEventPagePipeline({
      match: { employerId: "emp" },
      cursor,
      limit: 21,
    });
    assert.deepEqual(stages[0], {
      $match: { employerId: "emp", createdAt: { $lte: cursor.at } },
    });
    const lookup = stages[1] as { $lookup?: { from?: string } };
    assert.equal(lookup.$lookup?.from, "operations_audit_logs");
    const serialized = JSON.stringify(stages);
    assert.ok(serialized.includes(`"${OPERATIONS_JOB_AUDIT_ACTIONS.APPROVED}"`));
    assert.ok(serialized.includes(String(ACTIVITY_DUPLICATE_WINDOW_MS)));
    assert.deepEqual(stages.slice(-2), [
      { $sort: { at: -1, eventId: -1 } },
      { $limit: 21 },
    ]);
  });

  it("counts every job fact without a page cap", () => {
    const stages = buildJobFieldEventCountPipeline({ employerId: "emp" });
    assert.deepEqual(stages[0], { $match: { employerId: "emp" } });
    assert.ok(!stages.some((stage) => "$limit" in stage));
    assert.deepEqual(stages.at(-1), { $count: "count" });
  });
});

describe("listOperationsEmployerActivityQuerySchema", () => {
  it("defaults and validates category, limit and cursor", () => {
    assert.deepEqual(listOperationsEmployerActivityQuerySchema.parse({}), {
      limit: 20,
      category: "all",
      cursor: "",
    });
    assert.equal(listOperationsEmployerActivityQuerySchema.parse({ category: "team" }).category, "team");
    assert.throws(() => listOperationsEmployerActivityQuerySchema.parse({ category: "resume" }));
    assert.throws(() => listOperationsEmployerActivityQuerySchema.parse({ limit: 101 }));
    assert.throws(() => listOperationsEmployerActivityQuerySchema.parse({ cursor: "x".repeat(513) }));
  });
});
