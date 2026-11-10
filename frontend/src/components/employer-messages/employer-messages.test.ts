import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_LANGUAGE_OPTIONS } from "../../constants/site-language";
import { employerMessagesBundle } from "../../i18n/bundles/employer-messages";
import { employerMessagesHistoryBundle } from "../../i18n/bundles/employer-messages-history";
import { notificationTemplatesBundle } from "../../i18n/bundles/notification-templates";
import { seekerOfferResponseBundle } from "../../i18n/bundles/seeker-offer-response";
import { translate, translateIfPresent } from "../../i18n/translate";
import { localizeNotification } from "./localize-notification";
import {
  MESSAGES_CANDIDATE_ACTION_OPTIONS,
  MESSAGES_CATEGORY_OPTIONS,
  MESSAGES_CONVERSATION_TYPE_OPTIONS,
  MESSAGES_EMPLOYER_ACTION_OPTIONS,
  MESSAGES_INTERVIEW_STATUS_OPTIONS,
  MESSAGES_OFFER_STATUS_OPTIONS,
  MESSAGES_QUICK_DATE_OPTIONS,
  MESSAGES_STATUS_OPTIONS,
  DEFAULT_MESSAGES_FILTERS,
  messagesListIsFiltered,
  parseMessagesFiltersFromSearchParams,
  timelineMessageMatchesFilters,
  writeMessagesFiltersToSearchParams,
} from "./messages-filters";
import {
  buildMessagesActivitySignature,
  flattenConversationPages,
  flattenTimelinePages,
  MESSAGES_BULK_SELECTION_LIMIT,
  patchConversationPages,
  safeEmployerActionPath,
  toggleBulkSelection,
} from "./messages-merge";

const ALL_OPTION_LISTS = [
  MESSAGES_CATEGORY_OPTIONS,
  MESSAGES_STATUS_OPTIONS,
  MESSAGES_INTERVIEW_STATUS_OPTIONS,
  MESSAGES_OFFER_STATUS_OPTIONS,
  MESSAGES_QUICK_DATE_OPTIONS,
  MESSAGES_EMPLOYER_ACTION_OPTIONS,
  MESSAGES_CANDIDATE_ACTION_OPTIONS,
  MESSAGES_CONVERSATION_TYPE_OPTIONS,
];

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages filter options", () => {
  it("category dropdown matches the chips: All, Application, Interview, Offer, Status", () => {
    assert.deepEqual(
      MESSAGES_CATEGORY_OPTIONS.map((option) => option.value),
      ["all", "application", "interview", "offer", "system"],
    );
    assert.equal(
      translate("en", MESSAGES_CATEGORY_OPTIONS[4]!.labelKey),
      "Status",
    );
  });

  it("offer filter exposes only recorded offer events (no selected/rejected aliases)", () => {
    assert.deepEqual(
      MESSAGES_OFFER_STATUS_OPTIONS.map((option) => option.value),
      ["all", "offer_sent", "offer_accepted", "offer_declined"],
    );
    const candidateValues = MESSAGES_CANDIDATE_ACTION_OPTIONS.map(
      (option) => option.value,
    );
    assert.ok(candidateValues.includes("offer_accepted"));
    assert.ok(candidateValues.includes("offer_declined"));
    assert.ok(!candidateValues.includes("application_selected"));
    assert.ok(!candidateValues.includes("application_rejected"));
  });

  it("candidate submitted filter uses the employer-side application_received", () => {
    const values = MESSAGES_CANDIDATE_ACTION_OPTIONS.map((option) => option.value);
    assert.ok(values.includes("application_received"));
    assert.ok(!values.includes("application_submitted"));
    assert.ok(values.includes("candidate_withdrawn"));
  });

  it("every option label resolves in every employer language", () => {
    for (const language of SITE_LANGUAGE_OPTIONS) {
      for (const options of ALL_OPTION_LISTS) {
        for (const option of options) {
          const label = translate(language.code, option.labelKey);
          assert.ok(label && label !== option.labelKey, `${language.code}:${option.labelKey}`);
        }
      }
    }
  });
});

const MESSAGES_BUNDLES = {
  employerMessagesBundle,
  employerMessagesHistoryBundle,
  notificationTemplatesBundle,
  seekerOfferResponseBundle,
} as const;

function readLeaf(bundle: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown>)[part],
      bundle,
    );
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]!).sort();
}

describe("employer messages bundle", () => {
  it("every locale defines every English key with a non-empty value", () => {
    for (const [name, bundles] of Object.entries(MESSAGES_BUNDLES)) {
      const englishKeys = leafPaths(bundles.en).sort();
      for (const [code, bundle] of Object.entries(bundles)) {
        assert.deepEqual(leafPaths(bundle).sort(), englishKeys, `${name}:${code}`);
        for (const key of englishKeys) {
          const value = readLeaf(bundle, key);
          assert.equal(typeof value, "string", `${name}:${code}:${key}`);
          assert.ok((value as string).trim(), `${name}:${code}:${key}`);
        }
      }
    }
  });

  it("every translation keeps the English placeholders", () => {
    for (const [name, bundles] of Object.entries(MESSAGES_BUNDLES)) {
      for (const key of leafPaths(bundles.en)) {
        const expected = placeholders(readLeaf(bundles.en, key) as string);
        for (const [code, bundle] of Object.entries(bundles)) {
          assert.deepEqual(
            placeholders(readLeaf(bundle, key) as string),
            expected,
            `${name}:${code}:${key}`,
          );
        }
      }
    }
  });

  it("interpolates counters", () => {
    assert.equal(
      translate("en", "employer.messagesPage.kpi.matchingFilters", { count: 3 }),
      "3 match filters",
    );
    assert.match(
      translate("te", "employer.messagesPage.list.unreadCount", { count: 2 }),
      /^2 /,
    );
  });
});

describe("messages URL filters", () => {
  it("drops stale offer mappings and unknown values from old links", () => {
    const filters = parseMessagesFiltersFromSearchParams(
      new URLSearchParams(
        "offer=application_selected&category=bogus&type=nope&sort=weird&employerAction=hacked",
      ),
    );
    assert.equal(filters.offerStatus, "all");
    assert.equal(filters.category, "all");
    assert.equal(filters.conversationType, "all");
    assert.equal(filters.sort, "newest");
    assert.equal(filters.employerAction, "all");
  });

  it("maps legacy candidate action links to the employer mirror", () => {
    assert.equal(
      parseMessagesFiltersFromSearchParams(
        new URLSearchParams("candidateAction=application_submitted"),
      ).candidateAction,
      "application_received",
    );
    assert.equal(
      parseMessagesFiltersFromSearchParams(
        new URLSearchParams("candidateAction=application_withdrawn"),
      ).candidateAction,
      "candidate_withdrawn",
    );
  });

  it("round-trips valid filters", () => {
    const next = {
      ...DEFAULT_MESSAGES_FILTERS,
      category: "system" as const,
      employerAction: "application_shortlisted",
      offerStatus: "offer_sent",
      unreadOnly: true,
    };
    const params = new URLSearchParams();
    writeMessagesFiltersToSearchParams(params, next);
    assert.deepEqual(parseMessagesFiltersFromSearchParams(params), next);
  });

  it("unread-only and sort do not count as list filters", () => {
    assert.equal(
      messagesListIsFiltered({ ...DEFAULT_MESSAGES_FILTERS, unreadOnly: true }),
      false,
    );
    assert.equal(
      messagesListIsFiltered({ ...DEFAULT_MESSAGES_FILTERS, category: "offer" }),
      true,
    );
  });
});

describe("timeline filter matching", () => {
  it("matches either side of a mirrored candidate event", () => {
    const filters = {
      ...DEFAULT_MESSAGES_FILTERS,
      candidateAction: "application_received",
    };
    assert.ok(timelineMessageMatchesFilters("application_received", "application", filters));
    assert.ok(timelineMessageMatchesFilters("application_submitted", "application", filters));
    assert.ok(!timelineMessageMatchesFilters("offer_sent", "offer", filters));
  });

  it("matches status-history employer actions by their timeline type", () => {
    const filters = {
      ...DEFAULT_MESSAGES_FILTERS,
      employerAction: "application_viewed",
    };
    assert.ok(timelineMessageMatchesFilters("application_viewed", "application", filters));
    assert.ok(!timelineMessageMatchesFilters("application_shortlisted", "application", filters));
  });
});

describe("messages merge helpers", () => {
  const conv = (id: string, unread = 0) => ({ applicationId: id, unread });

  it("flattens loaded conversation pages without duplicates (newest position wins)", () => {
    const flattened = flattenConversationPages([
      { conversations: [conv("new"), conv("a", 1)] },
      { conversations: [conv("a"), conv("b"), conv("c")] },
    ]);
    assert.deepEqual(flattened, [
      conv("new"),
      conv("a", 1),
      conv("b"),
      conv("c"),
    ]);
    assert.deepEqual(flattenConversationPages([]), []);
  });

  it("patches matching threads across cached pages only", () => {
    const data = {
      pages: [
        { conversations: [conv("a", 2), conv("b", 1)] },
        { conversations: [conv("c", 4)] },
      ],
      pageParams: [1, 2],
    };
    const patched = patchConversationPages(
      data,
      new Set(["a", "c"]),
      (item) => ({ ...item, unread: 0 }),
    );
    assert.deepEqual(patched?.pages, [
      { conversations: [conv("a", 0), conv("b", 1)] },
      { conversations: [conv("c", 0)] },
    ]);
    assert.deepEqual(patched?.pageParams, [1, 2]);
    assert.equal(
      patchConversationPages(undefined, new Set(["a"]), (item) => item),
      undefined,
    );
  });

  it("caps bulk selection and toggles ids off again", () => {
    const first = toggleBulkSelection(new Set(), "a", 2);
    assert.deepEqual([...first.next], ["a"]);
    const second = toggleBulkSelection(first.next, "b", 2);
    const blocked = toggleBulkSelection(second.next, "c", 2);
    assert.equal(blocked.limitReached, true);
    assert.deepEqual([...blocked.next].sort(), ["a", "b"]);
    const removed = toggleBulkSelection(blocked.next, "a", 2);
    assert.equal(removed.limitReached, false);
    assert.deepEqual([...removed.next], ["b"]);
    assert.equal(MESSAGES_BULK_SELECTION_LIMIT, 100);
  });

  it("flattens newest-first timeline pages into a deduplicated chronological list", () => {
    const item = (id: string, minute: number) => ({
      id,
      createdAt: new Date(Date.UTC(2026, 0, 1, 10, minute)).toISOString(),
    });
    const flattened = flattenTimelinePages([
      { notifications: [item("n3", 3), item("n4", 4)] },
      { notifications: [item("n1", 1), item("n2", 2), item("n3", 3)] },
    ]);
    assert.deepEqual(
      flattened.map((entry) => entry.id),
      ["n1", "n2", "n3", "n4"],
    );
  });

  it("activity signature changes only when newest activity or thread count changes", () => {
    const base = {
      conversations: [{ latestNotification: { id: "x" } }],
      pagination: { total: 4 },
    };
    assert.equal(buildMessagesActivitySignature(undefined), null);
    assert.equal(
      buildMessagesActivitySignature(base),
      buildMessagesActivitySignature({ ...base }),
    );
    assert.notEqual(
      buildMessagesActivitySignature(base),
      buildMessagesActivitySignature({
        ...base,
        conversations: [{ latestNotification: { id: "y" } }],
      }),
    );
  });

  it("only follows in-app employer action paths", () => {
    assert.equal(safeEmployerActionPath("/employer/jobs"), "/employer/jobs");
    assert.equal(safeEmployerActionPath("/job-seeker/applied-jobs/1"), null);
    assert.equal(safeEmployerActionPath("https://evil.example"), null);
    assert.equal(safeEmployerActionPath(""), null);
  });
});

describe("localizeNotification", () => {
  const stored = {
    title: "Offer Accepted",
    body: "Ravi accepted the offer for Driver.",
  };

  it("keeps the stored English text for English", () => {
    assert.deepEqual(
      localizeNotification(
        {
          ...stored,
          template: {
            key: "employer.offer_accepted",
            params: { candidate: "Ravi", jobTitle: "Driver" },
          },
        },
        "en",
      ),
      stored,
    );
  });

  it("renders translated copy with the original dynamic values", () => {
    const copy = localizeNotification(
      {
        ...stored,
        template: {
          key: "employer.offer_accepted",
          params: { candidate: "Ravi", jobTitle: "Driver" },
        },
      },
      "hi",
    );
    assert.equal(
      copy.title,
      translate("hi", "notificationTemplates.employer.offer_accepted.title"),
    );
    assert.notEqual(copy.body, stored.body);
    assert.ok(copy.body.includes("Ravi"));
    assert.ok(copy.body.includes("Driver"));
    assert.ok(!/\{\w+\}/.test(copy.body));
  });

  it("falls back to stored text for legacy rows and unknown keys", () => {
    assert.deepEqual(
      localizeNotification(
        { ...stored, template: { key: "employer.offer_accepted", params: null } },
        "te",
      ),
      stored,
    );
    assert.deepEqual(localizeNotification(stored, "ta"), stored);
    assert.deepEqual(
      localizeNotification(
        { ...stored, template: { key: "employer.unknown_event", params: {} } },
        "kn",
      ),
      stored,
    );
  });

  it("uses localized fallbacks when a value was not recorded", () => {
    const copy = localizeNotification(
      {
        ...stored,
        template: { key: "employer.offer_accepted", params: { jobTitle: "Driver" } },
      },
      "ml",
    );
    assert.ok(
      copy.body.includes(
        translate("ml", "notificationTemplates.fallback.candidate"),
      ),
    );
  });

  it("adds localized interview details and the cancelled date", () => {
    const scheduled = localizeNotification(
      {
        title: "Interview Scheduled",
        body: "Interview scheduled with Ravi for Driver.",
        template: {
          key: "employer.interview_scheduled",
          params: {
            candidate: "Ravi",
            jobTitle: "Driver",
            date: "2026-11-12",
            time: "10:00",
            mode: "online",
            meetingLink: "https://meet.example/abc",
          },
        },
      },
      "hi",
    );
    assert.ok(scheduled.body.includes("10:00"));
    assert.ok(scheduled.body.includes("https://meet.example/abc"));
    assert.ok(
      scheduled.body.includes(translate("hi", "notificationTemplates.labels.online")),
    );

    const cancelled = localizeNotification(
      {
        title: "Interview Cancelled",
        body: "Interview with Ravi for Driver was cancelled.",
        template: {
          key: "employer.interview_cancelled",
          params: { candidate: "Ravi", jobTitle: "Driver", date: "2026-11-12" },
        },
      },
      "te",
    );
    assert.ok(cancelled.body.includes("2026") || cancelled.body.includes("12"));
    assert.ok(
      cancelled.body.includes(translate("te", "notificationTemplates.fallback.reason")),
    );
  });

  it("looks up exact keys without falling back to English", () => {
    assert.equal(
      translateIfPresent("hi", "notificationTemplates.employer.missing.title"),
      undefined,
    );
    assert.equal(
      translateIfPresent("en", "notificationTemplates.employer.offer_sent.title"),
      "Offer Sent",
    );
  });
});
