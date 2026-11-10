import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPLICATION_EVENT_NAMES } from "../applications/application.constants.js";
import {
  canRespondToOffer,
  mapOfferResponse,
} from "../applications/application.service.js";
import { respondToOfferSchema } from "../applications/application.validation.js";
import {
  conversationThreadMatches,
  dedupeConversationIds,
} from "./notification-conversation.helpers.js";
import {
  buildMessagesExportCsv,
  buildMessagesExportFileName,
  escapeMessagesCsvCell,
  formatMessagesExportDate,
  MESSAGES_EXPORT_COLUMNS,
  type MessagesExportRow,
} from "./notification-export.js";
import {
  applicationTemplateParams,
  applyMutedThreadChannels,
} from "./notification.service.js";
import {
  buildTemplateParams,
  interviewTemplateParams,
  NOTIFICATION_TEMPLATE_PARAMS_KEY,
  readTemplateParams,
  resolveMirrorTemplate,
  resolveNotificationTemplate,
} from "./notification-templates.js";
import {
  bulkConversationReadStateBodySchema,
  conversationFlagParamsSchema,
  exportNotificationConversationsQuerySchema,
  listNotificationConversationsQuerySchema,
} from "./notification.validation.js";

const APPLICATION_ID = "64b7f0c2a1b2c3d4e5f60718";

describe("conversationThreadMatches", () => {
  it("hides archived threads from the default inbox", () => {
    assert.deepEqual(conversationThreadMatches({}), [
      { "threadState.archivedAt": null },
    ]);
  });

  it("selects starred and archived views without the inbox clause", () => {
    assert.deepEqual(conversationThreadMatches({ view: "starred" }), [
      { "threadState.starredAt": { $ne: null } },
    ]);
    assert.deepEqual(conversationThreadMatches({ view: "archived" }), [
      { "threadState.archivedAt": { $ne: null } },
    ]);
  });

  it("combines read status and muted exclusion", () => {
    assert.deepEqual(
      conversationThreadMatches({ readStatus: "unread", excludeMuted: true }),
      [
        { unreadCount: { $gt: 0 } },
        { "threadState.archivedAt": null },
        { "threadState.mutedAt": null },
      ],
    );
    assert.deepEqual(conversationThreadMatches({ readStatus: "read" })[0], {
      unreadCount: 0,
    });
  });

  it("keeps muted threads in the list unless excluded", () => {
    const clauses = conversationThreadMatches({ view: "inbox" });
    assert.ok(
      !clauses.some((clause) => "threadState.mutedAt" in clause),
      "muting must not hide history",
    );
  });
});

describe("dedupeConversationIds", () => {
  it("trims, lowercases and removes duplicates in order", () => {
    assert.deepEqual(
      dedupeConversationIds([
        ` ${APPLICATION_ID.toUpperCase()} `,
        APPLICATION_ID,
        "",
        "64b7f0c2a1b2c3d4e5f60719",
      ]),
      [APPLICATION_ID, "64b7f0c2a1b2c3d4e5f60719"],
    );
  });
});

describe("notification templates", () => {
  it("drops empty params so translations can use fallbacks", () => {
    assert.deepEqual(
      buildTemplateParams({ candidate: " Ravi ", jobTitle: "", company: null }),
      { candidate: "Ravi" },
    );
  });

  it("keeps only the meeting detail that matches the interview mode", () => {
    assert.deepEqual(
      interviewTemplateParams({
        date: "2026-11-12",
        time: "10:00",
        mode: "online",
        meetingLink: "https://meet.example/abc",
        venue: "Office",
      }),
      {
        date: "2026-11-12",
        time: "10:00",
        mode: "online",
        meetingLink: "https://meet.example/abc",
      },
    );
    assert.deepEqual(interviewTemplateParams(undefined), {});
  });

  it("reads only string params and returns null for legacy rows", () => {
    assert.equal(readTemplateParams(undefined), null);
    assert.equal(readTemplateParams({ publicJobId: "J1" }), null);
    assert.deepEqual(
      readTemplateParams({
        [NOTIFICATION_TEMPLATE_PARAMS_KEY]: { candidate: "Ravi", count: 3 },
      }),
      { candidate: "Ravi" },
    );
  });

  it("resolves audience-specific and mirror template keys", () => {
    assert.deepEqual(
      resolveNotificationTemplate({
        recipientType: "employer",
        type: "offer_accepted",
        metadata: { [NOTIFICATION_TEMPLATE_PARAMS_KEY]: { candidate: "Ravi" } },
      }),
      { key: "employer.offer_accepted", params: { candidate: "Ravi" } },
    );
    assert.equal(
      resolveNotificationTemplate({
        recipientType: "job_seeker",
        type: "offer_sent",
      }).key,
      "seeker.offer_sent",
    );
    assert.deepEqual(
      resolveMirrorTemplate({ type: "offer_declined", metadata: undefined }),
      { key: "mirror.offer_declined", params: {} },
    );
    assert.deepEqual(
      resolveMirrorTemplate({ type: "interview_scheduled", metadata: {} }),
      { key: "mirror.interview_scheduled", params: null },
    );
  });

  it("builds application params with interview details only for interview events", () => {
    const context = {
      applicationId: APPLICATION_ID,
      jobSeekerId: "64b7f0c2a1b2c3d4e5f60720",
      employerId: "64b7f0c2a1b2c3d4e5f60721",
      publicJobId: "AJ-100",
      jobTitle: "Driver",
      companyName: "Acme",
      candidateName: "Ravi",
      interview: { date: "2026-11-12", mode: "phone" },
      cancellationReason: "Rescheduling",
    };
    assert.deepEqual(
      applicationTemplateParams(APPLICATION_EVENT_NAMES.OFFER_ACCEPTED, context),
      {
        candidate: "Ravi",
        jobTitle: "Driver",
        company: "Acme",
        publicJobId: "AJ-100",
      },
    );
    assert.deepEqual(
      applicationTemplateParams(
        APPLICATION_EVENT_NAMES.INTERVIEW_CANCELLED,
        context,
      ),
      {
        candidate: "Ravi",
        jobTitle: "Driver",
        company: "Acme",
        publicJobId: "AJ-100",
        reason: "Rescheduling",
        date: "2026-11-12",
        mode: "phone",
      },
    );
  });
});

describe("applyMutedThreadChannels", () => {
  it("turns off out-of-app channels and keeps in-app history", () => {
    assert.deepEqual(
      applyMutedThreadChannels({
        inApp: true,
        whatsapp: true,
        email: true,
        push: true,
      }),
      { inApp: true, whatsapp: false, email: false, push: false },
    );
  });
});

describe("offer response", () => {
  it("maps only valid stored responses", () => {
    assert.equal(mapOfferResponse(null), null);
    assert.equal(mapOfferResponse({ status: "maybe" }), null);
    assert.deepEqual(
      mapOfferResponse({
        status: "accepted",
        respondedAt: new Date("2026-11-10T05:30:00.000Z"),
      }),
      { status: "accepted", respondedAt: "2026-11-10T05:30:00.000Z" },
    );
  });

  it("allows one answer only while the offer is open", () => {
    assert.equal(canRespondToOffer("offer_sent", null), true);
    assert.equal(
      canRespondToOffer("offer_sent", {
        status: "declined",
        respondedAt: "2026-11-10T05:30:00.000Z",
      }),
      false,
    );
    assert.equal(canRespondToOffer("selected", null), false);
    assert.equal(canRespondToOffer("rejected", null), false);
  });

  it("accepts only accepted / declined", () => {
    assert.equal(respondToOfferSchema.safeParse({ response: "accepted" }).success, true);
    assert.equal(respondToOfferSchema.safeParse({ response: "declined" }).success, true);
    assert.equal(respondToOfferSchema.safeParse({ response: "selected" }).success, false);
  });
});

describe("Messages validation", () => {
  it("defaults list queries to the inbox with muted threads included", () => {
    const parsed = listNotificationConversationsQuerySchema.parse({});
    assert.equal(parsed.view, "inbox");
    assert.equal(parsed.excludeMuted, false);
    assert.equal(parsed.includeStats, true);
    assert.equal(parsed.limit, 20);
  });

  it("parses starred / archived views and boolean flags", () => {
    const parsed = listNotificationConversationsQuerySchema.parse({
      view: "archived",
      excludeMuted: "true",
      includeStats: "false",
    });
    assert.equal(parsed.view, "archived");
    assert.equal(parsed.excludeMuted, true);
    assert.equal(parsed.includeStats, false);
    assert.equal(
      listNotificationConversationsQuerySchema.safeParse({ view: "deleted" })
        .success,
      false,
    );
    assert.equal(
      listNotificationConversationsQuerySchema.safeParse({ limit: "51" })
        .success,
      false,
    );
  });

  it("accepts the shared filters for export, including date ranges", () => {
    const parsed = exportNotificationConversationsQuerySchema.parse({
      category: "offer",
      candidateAction: "offer_accepted",
      dateFrom: "2026-11-01",
      dateTo: "2026-11-10",
    });
    assert.equal(parsed.category, "offer");
    assert.equal(parsed.candidateAction, "offer_accepted");
    assert.equal(parsed.dateFrom, "2026-11-01");
    assert.equal(parsed.view, "inbox");
  });

  it("limits bulk updates to 1..100 valid ids", () => {
    assert.equal(
      bulkConversationReadStateBodySchema.safeParse({
        action: "read",
        applicationIds: [APPLICATION_ID],
      }).success,
      true,
    );
    assert.equal(
      bulkConversationReadStateBodySchema.safeParse({
        action: "read",
        applicationIds: [],
      }).success,
      false,
    );
    assert.equal(
      bulkConversationReadStateBodySchema.safeParse({
        action: "unread",
        applicationIds: Array.from({ length: 101 }, () => APPLICATION_ID),
      }).success,
      false,
    );
    assert.equal(
      bulkConversationReadStateBodySchema.safeParse({
        action: "delete",
        applicationIds: [APPLICATION_ID],
      }).success,
      false,
    );
    assert.equal(
      bulkConversationReadStateBodySchema.safeParse({
        action: "read",
        applicationIds: ["not-an-id"],
      }).success,
      false,
    );
  });

  it("allows only star / archive / mute flags", () => {
    for (const flag of ["star", "archive", "mute"]) {
      assert.equal(
        conversationFlagParamsSchema.safeParse({
          applicationId: APPLICATION_ID,
          flag,
        }).success,
        true,
      );
    }
    assert.equal(
      conversationFlagParamsSchema.safeParse({
        applicationId: APPLICATION_ID,
        flag: "delete",
      }).success,
      false,
    );
  });
});

describe("Messages CSV export", () => {
  const row: MessagesExportRow = {
    createdAt: new Date("2026-11-10T05:30:00.000Z"),
    threadType: "application",
    candidateName: "Ravi, Kumar",
    jobTitle: "Driver",
    publicJobId: "AJ-100",
    applicationStatus: "offer_sent",
    category: "offer",
    type: "offer_accepted",
    title: "Offer Accepted",
    body: 'Ravi said "yes"\nthanks',
    isRead: false,
  };

  it("neutralises formula injection and quotes special characters", () => {
    assert.equal(escapeMessagesCsvCell("=SUM(A1)"), "'=SUM(A1)");
    assert.equal(escapeMessagesCsvCell("+91 99"), "'+91 99");
    assert.equal(escapeMessagesCsvCell("@cmd"), "'@cmd");
    assert.equal(escapeMessagesCsvCell("a,b"), '"a,b"');
    assert.equal(escapeMessagesCsvCell('say "hi"'), '"say ""hi"""');
    assert.equal(escapeMessagesCsvCell("plain"), "plain");
  });

  it("formats dates in IST", () => {
    assert.equal(
      formatMessagesExportDate(new Date("2026-11-10T18:45:00.000Z")),
      "2026-11-11 00:15",
    );
  });

  it("builds a BOM-prefixed CRLF CSV without phone numbers", () => {
    const csv = buildMessagesExportCsv([row], () => "Offer Sent");
    assert.ok(csv.startsWith("\uFEFF"));
    const lines = csv.slice(1).split("\r\n");
    assert.equal(lines[0], MESSAGES_EXPORT_COLUMNS.join(","));
    assert.ok(!/phone/i.test(lines[0]!));
    assert.equal(
      lines[1],
      '2026-11-10 11:00,Application,"Ravi, Kumar",Driver,AJ-100,Offer Sent,Offer,Offer accepted,Offer Accepted,"Ravi said ""yes""\nthanks",Unread',
    );
    assert.equal(lines.at(-1), "");
  });

  it("labels job threads as Operations without an application status", () => {
    const csv = buildMessagesExportCsv(
      [
        {
          ...row,
          threadType: "job",
          candidateName: "",
          applicationStatus: "",
          category: "job",
          type: "job_approved",
          isRead: true,
        },
      ],
      () => "should not be used",
    );
    const line = csv.slice(1).split("\r\n")[1]!;
    assert.ok(line.startsWith("2026-11-10 11:00,Operations,Operations,Driver,AJ-100,,Job,Job approved"));
    assert.ok(line.endsWith(",Read"));
  });

  it("names the file by date", () => {
    assert.equal(
      buildMessagesExportFileName(new Date("2026-11-10T05:30:00.000Z")),
      "Messages_History_2026-11-10.csv",
    );
  });
});
