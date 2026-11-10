import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applicationRowToEntry,
  auditRowToEntry,
  buildApplicationActivityCountPipeline,
  buildApplicationActivityPipeline,
  buildCandidateActivitySummary,
  buildCandidateJourney,
  buildSeekerActivityEntries,
  buildTimestampedActivityPipeline,
  compareActivityOrder,
  countCandidateActivity,
  decodeCandidateActivityCursor,
  encodeCandidateActivityCursor,
  inMemoryActivitySource,
  loginRowToEntry,
  mapHistoryActor,
  paginateCandidateActivity,
  parseApplicationStats,
  resumeRowToEntry,
  savedJobRowToEntry,
  type ApplicationActivityRow,
  type CandidateActivityCategory,
  type CandidateActivityCursor,
  type CandidateActivityEntry,
  type CandidateActivityRefs,
  type CandidateActivitySeekerInput,
  type CandidateActivitySource,
  type CandidateApplicationStats,
} from "./operations-candidate-activity.js";
import { listOperationsCandidateActivityQuerySchema } from "./operations-candidates.validation.js";

const refs: CandidateActivityRefs = {
  jobTitle: (jobId) => (jobId === "job1" ? "Driver" : ""),
  jobCompany: (jobId) => (jobId === "job1" ? "Acme Jobs" : ""),
  employerName: (employerId) => (employerId === "emp1" ? "Acme" : ""),
};

function seeker(
  overrides: Partial<CandidateActivitySeekerInput> = {},
): CandidateActivitySeekerInput {
  return {
    createdAt: new Date("2026-11-01T04:00:00.000Z"),
    lastLoginAt: new Date("2026-11-09T10:00:00.000Z"),
    isWhatsappVerified: true,
    whatsappVerifiedAt: null,
    registrationStatus: "COMPLETED",
    profileCompletedAt: null,
    profileCompleteNow: true,
    profileCompletionPercent: 86,
    uploadedResume: null,
    ...overrides,
  };
}

function appRow(
  overrides: Partial<ApplicationActivityRow> & Pick<ApplicationActivityRow, "eventId" | "at">,
): ApplicationActivityRow {
  return {
    kind: "history",
    status: "submitted",
    actorType: "job_seeker",
    applicationId: "app1",
    jobId: "job1",
    employerId: "emp1",
    publicJobId: "AJ-100",
    ...overrides,
  };
}

const emptyStats: CandidateApplicationStats = parseApplicationStats([]);

function render(entries: CandidateActivityEntry[]) {
  return entries.map((entry) => entry.render(refs));
}

describe("candidate activity entries", () => {
  it("builds dated seeker milestones and hides undated ones", () => {
    const events = render(buildSeekerActivityEntries(seeker()));
    assert.deepEqual(
      events.map((event) => event.type).sort(),
      ["account_last_login", "account_registered"],
    );

    const tracked = render(
      buildSeekerActivityEntries(
        seeker({
          whatsappVerifiedAt: new Date("2026-11-01T04:05:00.000Z"),
          profileCompletedAt: new Date("2026-11-01T04:20:00.000Z"),
          lastLoginRecorded: true,
        }),
      ),
    );
    const types = tracked.map((event) => event.type);
    assert.ok(types.includes("account_whatsapp_verified"));
    assert.ok(types.includes("profile_completed"));
    assert.ok(!types.includes("account_last_login"));
    assert.equal(
      tracked.find((event) => event.type === "profile_completed")?.category,
      "profile",
    );
  });

  it("does not show a verification event for an unverified number", () => {
    const events = render(
      buildSeekerActivityEntries(
        seeker({
          isWhatsappVerified: false,
          whatsappVerifiedAt: new Date("2026-11-01T04:05:00.000Z"),
        }),
      ),
    );
    assert.ok(!events.some((event) => event.type === "account_whatsapp_verified"));
  });

  it("maps application history rows with titles, actors and categories", () => {
    const rows = [
      appRow({ eventId: "application:app1:history:0", at: new Date("2026-11-02T05:00:00.000Z") }),
      appRow({
        eventId: "application:app1:history:1",
        at: new Date("2026-11-04T05:00:00.000Z"),
        status: "interview_scheduled",
        actorType: "employer",
      }),
      appRow({
        eventId: "application:app1:history:2",
        at: new Date("2026-11-06T05:00:00.000Z"),
        status: "offer_sent",
        actorType: "employer",
        remark: "Joining next week",
      }),
      appRow({
        eventId: "application:app1:offer_accepted",
        at: new Date("2026-11-07T05:00:00.000Z"),
        kind: "offer_response",
        status: "accepted",
      }),
      appRow({
        eventId: "application:app1:interview_cancelled",
        at: new Date("2026-11-05T05:00:00.000Z"),
        kind: "interview_cancelled",
        status: null,
        reason: "Slot unavailable",
      }),
    ];
    const events = render(rows.map(applicationRowToEntry));
    assert.equal(events[0]?.title, "Applied to Driver");
    assert.equal(events[0]?.employerName, "Acme");
    assert.equal(events[0]?.applicationId, "app1");
    assert.equal(events[0]?.publicJobId, "AJ-100");
    assert.equal(events[1]?.category, "interview");
    assert.equal(events[1]?.actor, "employer");
    assert.equal(events[2]?.category, "offer");
    assert.match(events[2]?.description ?? "", /Joining next week/);
    assert.equal(events[3]?.type, "offer_accepted");
    assert.equal(events[3]?.actor, "candidate");
    assert.equal(events[4]?.type, "interview_cancelled");
    assert.match(events[4]?.description ?? "", /Slot unavailable/);
  });

  it("never turns selected/rejected history into an offer answer", () => {
    const events = render(
      ["selected", "rejected"].map((status, index) =>
        applicationRowToEntry(
          appRow({
            eventId: `application:app1:history:${index}`,
            at: new Date("2026-11-08T05:00:00.000Z"),
            status,
            actorType: "employer",
          }),
        ),
      ),
    );
    assert.deepEqual(
      events.map((event) => [event.type, event.category]),
      [
        ["application_selected", "application"],
        ["application_rejected", "application"],
      ],
    );
  });

  it("falls back to generic names when the job or employer is gone", () => {
    const [event] = render([
      applicationRowToEntry(
        appRow({
          eventId: "application:legacy:applied",
          at: new Date("2026-11-05T05:00:00.000Z"),
          kind: "applied",
          status: null,
          jobId: "missing",
          employerId: null,
        }),
      ),
    ]);
    assert.equal(event?.title, "Applied to Job");
    assert.equal(event?.employerName, "Employer");
    const [saved] = render([
      savedJobRowToEntry({
        eventId: "saved_job:s1",
        at: new Date("2026-11-04T00:00:00.000Z"),
        jobId: "missing",
        publicJobId: "AJ-200",
      }),
    ]);
    assert.equal(saved?.title, "Saved a job");
    assert.equal(saved?.publicJobId, "AJ-200");
  });

  it("describes logins without credentials or network data", () => {
    const [login] = render([
      loginRowToEntry({
        eventId: "login:l1",
        at: new Date("2026-11-09T10:00:00.000Z"),
        method: "whatsapp_otp",
        client: { browser: "Chrome", os: "Android", deviceType: "mobile" },
      }),
    ]);
    assert.equal(login?.title, "Logged in with WhatsApp OTP");
    assert.equal(login?.description, "Chrome on Android · Mobile");
    assert.equal(login?.category, "account");
    const [unknown] = render([
      loginRowToEntry({
        eventId: "login:l2",
        at: new Date("2026-11-09T10:00:00.000Z"),
        method: "registration_otp",
        client: null,
      }),
    ]);
    assert.equal(unknown?.title, "Signed in after completing registration");
    assert.equal(unknown?.description, "Device not recorded");
  });

  it("maps resumes and audits", () => {
    const [resume, failed, audit] = render([
      resumeRowToEntry({
        eventId: "resume:r2",
        at: new Date("2026-11-03T00:00:00.000Z"),
        versionNumber: 2,
        status: "READY",
      }),
      resumeRowToEntry({
        eventId: "resume:r3",
        at: new Date("2026-11-03T01:00:00.000Z"),
        versionNumber: 3,
        status: "FAILED",
        failureReason: "PDF error",
      }),
      auditRowToEntry({
        eventId: "audit:a2",
        at: new Date("2026-11-08T00:00:00.000Z"),
        action: "candidate.account_suspended",
        actorName: "Ops Lead",
        reason: "Fake profile",
      }),
    ]);
    assert.equal(resume?.title, "AsliResume v2 generated");
    assert.equal(failed?.type, "resume_generation_failed");
    assert.equal(failed?.description, "PDF error");
    assert.equal(audit?.title, "Account Suspended");
    assert.equal(audit?.actor, "operations");
    assert.match(audit?.description ?? "", /Fake profile/);
  });

  it("maps application history actors", () => {
    assert.equal(mapHistoryActor("job_seeker"), "candidate");
    assert.equal(mapHistoryActor("employer"), "employer");
    assert.equal(mapHistoryActor("operations"), "operations");
    assert.equal(mapHistoryActor(undefined), "system");
  });
});

describe("candidate journey", () => {
  const stats: CandidateApplicationStats = {
    ...emptyStats,
    applications: 2,
    active: 1,
    shortlisted: 1,
    interviews: 1,
    offers: 1,
    firstAppliedAt: new Date("2026-11-02T05:00:00.000Z"),
    firstSubmittedAt: new Date("2026-11-02T06:00:00.000Z"),
    firstShortlistedAt: new Date("2026-11-03T05:00:00.000Z"),
    firstInterviewAt: new Date("2026-11-04T05:00:00.000Z"),
    firstOfferAt: new Date("2026-11-06T05:00:00.000Z"),
  };

  it("shows recorded WhatsApp and profile completion dates", () => {
    const journey = buildCandidateJourney({
      seeker: seeker({
        whatsappVerifiedAt: new Date("2026-11-01T04:05:00.000Z"),
        profileCompletedAt: new Date("2026-11-01T04:20:00.000Z"),
      }),
      resumes: { readyCount: 0, firstReadyAt: null },
      applications: stats,
    });
    const byId = Object.fromEntries(journey.map((stage) => [stage.id, stage]));
    assert.equal(byId.whatsapp_verified?.at, "2026-11-01T04:05:00.000Z");
    assert.equal(byId.profile_completed?.at, "2026-11-01T04:20:00.000Z");
    assert.equal(byId.applied?.at, "2026-11-02T05:00:00.000Z");
    assert.equal(byId.applied?.detail, "2 applications");
    assert.deepEqual(
      journey.map((stage) => stage.state),
      ["done", "done", "done", "current", "done", "done", "done", "done", "pending"],
    );
  });

  it("keeps legacy milestones done with no invented date", () => {
    const journey = buildCandidateJourney({
      seeker: seeker(),
      resumes: { readyCount: 0, firstReadyAt: null },
      applications: null,
    });
    const whatsapp = journey.find((stage) => stage.id === "whatsapp_verified");
    const profile = journey.find((stage) => stage.id === "profile_completed");
    assert.equal(whatsapp?.state, "done");
    assert.equal(whatsapp?.at, null);
    assert.equal(profile?.state, "done");
    assert.equal(profile?.at, null);
    assert.equal(profile?.detail, "86% complete");
    assert.ok(!journey.some((stage) => stage.id === "applied"));
  });

  it("keeps the first completion date when the profile is incomplete again", () => {
    const journey = buildCandidateJourney({
      seeker: seeker({
        registrationStatus: "PENDING",
        profileCompletedAt: new Date("2026-11-01T04:20:00.000Z"),
        profileCompleteNow: false,
        profileCompletionPercent: 70,
      }),
      resumes: { readyCount: 1, firstReadyAt: new Date("2026-11-01T05:00:00.000Z") },
      applications: null,
    });
    const profile = journey.find((stage) => stage.id === "profile_completed");
    assert.equal(profile?.state, "done");
    assert.equal(profile?.at, "2026-11-01T04:20:00.000Z");
    assert.equal(profile?.detail, "Now incomplete · 70% complete");
  });

  it("builds summary totals from aggregate stats, not page rows", () => {
    const summary = buildCandidateActivitySummary({
      applications: { ...stats, applications: 640, offersAccepted: 3 },
      savedJobs: 260,
      lastActivityAt: new Date("2026-11-09T10:00:00.000Z"),
    });
    assert.equal(summary.applications, 640);
    assert.equal(summary.offersAccepted, 3);
    assert.equal(summary.savedJobs, 260);
    assert.equal(summary.lastActivityAt, "2026-11-09T10:00:00.000Z");
    const restricted = buildCandidateActivitySummary({
      applications: null,
      savedJobs: 2,
      lastActivityAt: null,
    });
    assert.equal(restricted.applications, 0);
    assert.equal(restricted.lastActivityAt, null);
  });

  it("parses empty and populated stats facets", () => {
    assert.equal(emptyStats.applications, 0);
    assert.equal(emptyStats.firstAppliedAt, null);
    const parsed = parseApplicationStats([
      {
        totals: [
          { applications: 5, hired: 1, firstAppliedAt: new Date("2026-01-01T00:00:00.000Z") },
        ],
        milestones: [{ firstHiredAt: new Date("2026-02-01T00:00:00.000Z") }],
      },
    ]);
    assert.equal(parsed.applications, 5);
    assert.equal(parsed.hired, 1);
    assert.equal(parsed.firstHiredAt?.toISOString(), "2026-02-01T00:00:00.000Z");
  });
});

const BASE = Date.parse("2026-11-09T00:00:00.000Z");

/** Large fixture: three rows share each minute so ties cross sources. */
function largeSources(includeApplications: boolean): CandidateActivitySource[] {
  const at = (index: number) => new Date(BASE - Math.floor(index / 3) * 60_000);
  const hex = (index: number) => index.toString(16).padStart(24, "0");
  const applicationRows: CandidateActivityEntry[] = [];
  for (let index = 0; index < 620; index += 1) {
    const statuses = ["submitted", "shortlisted", "interview_scheduled", "offer_sent"];
    applicationRows.push(
      applicationRowToEntry(
        appRow({
          eventId: `application:${hex(index)}:history:${index % 4}`,
          at: at(index),
          status: statuses[index % 4] ?? "submitted",
          applicationId: hex(index),
        }),
      ),
    );
  }
  const saved = Array.from({ length: 260 }, (_, index) =>
    savedJobRowToEntry({
      eventId: `saved_job:${hex(index)}`,
      at: at(index),
      jobId: "job1",
      publicJobId: "AJ-100",
    }),
  );
  const audits = Array.from({ length: 230 }, (_, index) =>
    auditRowToEntry({
      eventId: `audit:${hex(index)}`,
      at: at(index + 1),
      action: "candidate.note_added",
      actorName: "Ops",
    }),
  );
  const logins = Array.from({ length: 75 }, (_, index) =>
    loginRowToEntry({
      eventId: `login:${hex(index)}`,
      at: at(index * 2),
      method: "whatsapp_otp",
    }),
  );
  const sources = [
    inMemoryActivitySource("seeker", buildSeekerActivityEntries(seeker())),
    inMemoryActivitySource("saved_jobs", saved),
    inMemoryActivitySource("audits", audits),
    inMemoryActivitySource("logins", logins),
  ];
  if (includeApplications) {
    sources.push(inMemoryActivitySource("applications", applicationRows));
  }
  return sources;
}

async function walkAllPages(
  sources: CandidateActivitySource[],
  category: CandidateActivityCategory | null,
  limit: number,
) {
  const seen: CandidateActivityEntry[] = [];
  let cursor: CandidateActivityCursor | null = null;
  for (let guard = 0; guard < 1000; guard += 1) {
    const page = await paginateCandidateActivity(sources, { cursor, limit, category });
    assert.ok(page.entries.length <= limit);
    seen.push(...page.entries);
    if (!page.hasMore) {
      assert.equal(page.nextCursor, null);
      return seen;
    }
    assert.ok(page.nextCursor);
    // Round-trip through the opaque API token, as the admin client does.
    cursor = decodeCandidateActivityCursor(encodeCandidateActivityCursor(page.nextCursor));
  }
  throw new Error("pagination did not terminate");
}

async function everyEntry(
  sources: CandidateActivitySource[],
  category: CandidateActivityCategory | null,
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

describe("candidate activity pagination", () => {
  it("pages past 500 applications, 200 saved jobs and 200 audits without gaps or duplicates", async () => {
    const sources = largeSources(true);
    const expected = await everyEntry(sources, null);
    assert.ok(expected.length > 1100);

    const walked = await walkAllPages(sources, null, 50);
    assert.equal(new Set(walked.map((entry) => entry.id)).size, walked.length);
    assert.deepEqual(
      walked.map((entry) => entry.id),
      expected.map((entry) => entry.id),
    );
    for (let index = 1; index < walked.length; index += 1) {
      assert.ok(compareActivityOrder(walked[index - 1]!, walked[index]!) < 0);
    }

    const counts = await countCandidateActivity(sources);
    assert.equal(counts.all, expected.length);
    assert.equal(counts.saved_job, 260);
    assert.equal(counts.operations, 230);
    assert.equal(
      counts.application + counts.interview + counts.offer,
      620,
    );
  });

  it("keeps a category filter across pages", async () => {
    const sources = largeSources(true);
    for (const category of ["interview", "saved_job", "account"] as const) {
      const walked = await walkAllPages(sources, category, 20);
      const expected = await everyEntry(sources, category);
      assert.ok(walked.every((entry) => entry.category === category));
      assert.deepEqual(
        walked.map((entry) => entry.id),
        expected.map((entry) => entry.id),
      );
      const counts = await countCandidateActivity(sources);
      assert.equal(counts[category], expected.length);
    }
  });

  it("returns nothing from application categories without permission", async () => {
    const sources = largeSources(false);
    const counts = await countCandidateActivity(sources);
    assert.equal(counts.application, 0);
    assert.equal(counts.interview, 0);
    assert.equal(counts.offer, 0);
    const page = await paginateCandidateActivity(sources, {
      cursor: null,
      limit: 20,
      category: "application",
    });
    assert.deepEqual(page.entries, []);
    assert.equal(page.hasMore, false);
    const walked = await walkAllPages(sources, null, 100);
    assert.ok(
      !walked.some((entry) =>
        ["application", "interview", "offer"].includes(entry.category),
      ),
    );
    assert.equal(walked.length, counts.all);
  });

  it("orders equal timestamps by id and never repeats a tied row", async () => {
    const at = new Date("2026-11-01T00:00:00.000Z");
    const make = (id: string) =>
      auditRowToEntry({ eventId: id, at, action: "candidate.note_added" });
    const sources = [
      inMemoryActivitySource("a", [make("audit:b"), make("audit:d")]),
      inMemoryActivitySource("b", [make("audit:a"), make("audit:c"), make("audit:e")]),
    ];
    const walked = await walkAllPages(sources, null, 2);
    assert.deepEqual(
      walked.map((entry) => entry.id),
      ["audit:e", "audit:d", "audit:c", "audit:b", "audit:a"],
    );
  });

  it("rejects cursors it did not produce", () => {
    const cursor = { at: new Date("2026-11-01T00:00:00.000Z"), id: "saved_job:abc" };
    assert.deepEqual(
      decodeCandidateActivityCursor(encodeCandidateActivityCursor(cursor)),
      cursor,
    );
    assert.equal(decodeCandidateActivityCursor("not-a-cursor"), null);
    assert.equal(
      decodeCandidateActivityCursor(
        Buffer.from(JSON.stringify({ a: "2026-11-01", i: "$where" })).toString("base64url"),
      ),
      null,
    );
  });
});

describe("candidate activity pipelines", () => {
  const cursor = { at: new Date("2026-11-01T00:00:00.000Z"), id: "saved_job:abc" };

  it("pre-filters indexed sources and applies the exact cursor", () => {
    const stages = buildTimestampedActivityPipeline(
      {
        match: { jobSeekerId: "seeker" },
        atExpression: "$savedAt",
        indexedAtField: "savedAt",
        idPrefix: "saved_job:",
        project: { jobId: 1 },
      },
      { cursor, limit: 21 },
    );
    assert.deepEqual(stages[0], {
      $match: { jobSeekerId: "seeker", savedAt: { $lte: cursor.at } },
    });
    assert.deepEqual(stages[2], {
      $match: {
        at: { $type: "date" },
        $or: [
          { at: { $lt: cursor.at } },
          { at: cursor.at, eventId: { $lt: cursor.id } },
        ],
      },
    });
    assert.deepEqual(stages.slice(-2), [
      { $sort: { at: -1, eventId: -1 } },
      { $limit: 21 },
    ]);
  });

  it("filters applications by seeker, category and cursor, with no cap on counts", () => {
    const page = buildApplicationActivityPipeline({
      jobSeekerId: "seeker",
      cursor,
      limit: 21,
      category: "offer",
    });
    assert.deepEqual(page[0], { $match: { jobSeekerId: "seeker" } });
    assert.ok(page.some((stage) => JSON.stringify(stage) === JSON.stringify({ $match: { category: "offer" } })));
    assert.deepEqual(page.at(-1), { $limit: 21 });
    const count = buildApplicationActivityCountPipeline("seeker");
    assert.ok(!count.some((stage) => "$limit" in stage));
    assert.deepEqual(count.at(-1), {
      $group: { _id: "$category", count: { $sum: 1 } },
    });
  });
});

describe("listOperationsCandidateActivityQuerySchema", () => {
  it("defaults and validates category, limit and cursor", () => {
    assert.deepEqual(listOperationsCandidateActivityQuerySchema.parse({}), {
      limit: 20,
      category: "all",
      cursor: "",
    });
    assert.equal(
      listOperationsCandidateActivityQuerySchema.parse({ category: "offer" })
        .category,
      "offer",
    );
    assert.equal(
      listOperationsCandidateActivityQuerySchema.safeParse({ category: "chat" })
        .success,
      false,
    );
    assert.equal(
      listOperationsCandidateActivityQuerySchema.safeParse({ limit: "101" })
        .success,
      false,
    );
    assert.equal(
      listOperationsCandidateActivityQuerySchema.safeParse({ cursor: "x".repeat(513) })
        .success,
      false,
    );
  });
});
