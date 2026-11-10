import type { MessageKey } from "@/i18n/translate";
import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import { EMPLOYER_APPLICATION_STATUSES } from "@/types/employer-applications";

export type MessagesQuickDateFilter =
  | "all"
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export type MessagesConversationTypeFilter =
  | "all"
  | "active"
  | "completed"
  | "rejected"
  | "withdrawn";

export type MessagesSortFilter =
  | "newest"
  | "oldest"
  | "recently_updated"
  | "most_notifications"
  | "unread_first";

export type MessagesCategoryFilter =
  | "all"
  | "application"
  | "interview"
  | "offer"
  | "system";

export type MessagesFiltersState = {
  publicJobId: string;
  candidateSearch: string;
  category: MessagesCategoryFilter;
  applicationStatus: string;
  interviewStatus: string;
  offerStatus: string;
  quickDate: MessagesQuickDateFilter;
  dateFrom: string;
  dateTo: string;
  unreadOnly: boolean;
  employerAction: string;
  candidateAction: string;
  conversationType: MessagesConversationTypeFilter;
  sort: MessagesSortFilter;
};

export const DEFAULT_MESSAGES_FILTERS: MessagesFiltersState = {
  publicJobId: "",
  candidateSearch: "",
  category: "all",
  applicationStatus: "all",
  interviewStatus: "all",
  offerStatus: "all",
  quickDate: "all",
  dateFrom: "",
  dateTo: "",
  unreadOnly: false,
  employerAction: "all",
  candidateAction: "all",
  conversationType: "all",
  sort: "newest",
};

export type MessagesJobFacet = {
  publicJobId: string;
  jobTitle: string;
  count: number;
};

/** Select option whose label is resolved through the employer i18n bundle. */
export type MessagesOptionDef<V extends string = string> = {
  value: V;
  labelKey: MessageKey;
};

/** Shared by the category chips and the category dropdown. */
export const MESSAGES_CATEGORY_OPTIONS: MessagesOptionDef<MessagesCategoryFilter>[] =
  [
    { value: "all", labelKey: "employer.messagesPage.category.all" },
    { value: "application", labelKey: "employer.messagesPage.category.application" },
    { value: "interview", labelKey: "employer.messagesPage.category.interview" },
    { value: "offer", labelKey: "employer.messagesPage.category.offer" },
    { value: "system", labelKey: "employer.messagesPage.category.system" },
  ];

export const MESSAGES_STATUS_OPTIONS: MessagesOptionDef[] = [
  { value: "all", labelKey: "employer.messagesPage.filters.allStatus" },
  ...EMPLOYER_APPLICATION_STATUSES.map(
    (status): MessagesOptionDef => ({
      value: status,
      labelKey: `employer.status.application.${status}`,
    }),
  ),
];

export const MESSAGES_INTERVIEW_STATUS_OPTIONS: MessagesOptionDef[] = [
  { value: "all", labelKey: "employer.messagesPage.filters.all" },
  {
    value: "interview_scheduled",
    labelKey: "employer.messagesPage.options.interview.scheduled",
  },
  {
    value: "interview_updated",
    labelKey: "employer.messagesPage.options.interview.rescheduled",
  },
  {
    value: "interview_completed",
    labelKey: "employer.messagesPage.options.interview.completed",
  },
  {
    value: "interview_cancelled",
    labelKey: "employer.messagesPage.options.interview.cancelled",
  },
];

/**
 * Accepted / declined are recorded only when the candidate answers the offer
 * themselves; selected / rejected application statuses are not offer events.
 */
export const MESSAGES_OFFER_STATUS_OPTIONS: MessagesOptionDef[] = [
  { value: "all", labelKey: "employer.messagesPage.filters.all" },
  { value: "offer_sent", labelKey: "employer.messagesPage.options.offer.sent" },
  {
    value: "offer_accepted",
    labelKey: "employer.messagesPage.options.offer.accepted",
  },
  {
    value: "offer_declined",
    labelKey: "employer.messagesPage.options.offer.declined",
  },
];

export const MESSAGES_QUICK_DATE_OPTIONS: MessagesOptionDef<MessagesQuickDateFilter>[] =
  [
    { value: "all", labelKey: "employer.messagesPage.options.quickDate.all" },
    { value: "today", labelKey: "employer.messagesPage.options.quickDate.today" },
    {
      value: "yesterday",
      labelKey: "employer.messagesPage.options.quickDate.yesterday",
    },
    {
      value: "last_7_days",
      labelKey: "employer.messagesPage.options.quickDate.last7",
    },
    {
      value: "last_30_days",
      labelKey: "employer.messagesPage.options.quickDate.last30",
    },
    {
      value: "this_month",
      labelKey: "employer.messagesPage.options.quickDate.thisMonth",
    },
    {
      value: "last_month",
      labelKey: "employer.messagesPage.options.quickDate.lastMonth",
    },
    { value: "custom", labelKey: "employer.messagesPage.options.quickDate.custom" },
  ];

/**
 * Viewed / Under Review / Shortlisted are matched server-side against the
 * application's status history (they only notify the job seeker); the rest
 * are employer inbox notification types.
 */
export const MESSAGES_EMPLOYER_ACTION_OPTIONS: MessagesOptionDef[] = [
  { value: "all", labelKey: "employer.messagesPage.filters.all" },
  {
    value: "application_viewed",
    labelKey: "employer.messagesPage.options.employerAction.viewed",
  },
  {
    value: "application_under_review",
    labelKey: "employer.messagesPage.options.employerAction.underReview",
  },
  {
    value: "application_shortlisted",
    labelKey: "employer.messagesPage.options.employerAction.shortlisted",
  },
  {
    value: "interview_scheduled",
    labelKey: "employer.messagesPage.options.employerAction.interviewScheduled",
  },
  {
    value: "interview_updated",
    labelKey: "employer.messagesPage.options.employerAction.interviewUpdated",
  },
  {
    value: "interview_cancelled",
    labelKey: "employer.messagesPage.options.employerAction.interviewCancelled",
  },
  {
    value: "interview_completed",
    labelKey: "employer.messagesPage.options.employerAction.interviewCompleted",
  },
  {
    value: "offer_sent",
    labelKey: "employer.messagesPage.options.employerAction.offerSent",
  },
  {
    value: "application_selected",
    labelKey: "employer.messagesPage.options.employerAction.selected",
  },
  {
    value: "application_joined",
    labelKey: "employer.messagesPage.options.employerAction.joined",
  },
  {
    value: "application_did_not_join",
    labelKey: "employer.messagesPage.options.employerAction.didNotJoin",
  },
  {
    value: "application_rejected",
    labelKey: "employer.messagesPage.options.employerAction.rejected",
  },
];

/** Employer-side mirrors of candidate events. */
export const MESSAGES_CANDIDATE_ACTION_OPTIONS: MessagesOptionDef[] = [
  { value: "all", labelKey: "employer.messagesPage.filters.all" },
  {
    value: "application_received",
    labelKey: "employer.messagesPage.options.candidateAction.submitted",
  },
  {
    value: "candidate_withdrawn",
    labelKey: "employer.messagesPage.options.candidateAction.withdrawn",
  },
  {
    value: "offer_accepted",
    labelKey: "employer.messagesPage.options.candidateAction.offerAccepted",
  },
  {
    value: "offer_declined",
    labelKey: "employer.messagesPage.options.candidateAction.offerDeclined",
  },
];

export const MESSAGES_CONVERSATION_TYPE_OPTIONS: MessagesOptionDef<MessagesConversationTypeFilter>[] =
  [
    { value: "all", labelKey: "employer.messagesPage.filters.all" },
    {
      value: "active",
      labelKey: "employer.messagesPage.options.conversationType.active",
    },
    {
      value: "completed",
      labelKey: "employer.messagesPage.options.conversationType.completed",
    },
    {
      value: "rejected",
      labelKey: "employer.messagesPage.options.conversationType.rejected",
    },
    {
      value: "withdrawn",
      labelKey: "employer.messagesPage.options.conversationType.withdrawn",
    },
  ];

const SORT_VALUES: readonly MessagesSortFilter[] = [
  "newest",
  "oldest",
  "recently_updated",
  "most_notifications",
  "unread_first",
];

/** Old links used seeker-side event names; the employer inbox stores mirrors. */
const CANDIDATE_ACTION_ALIASES: Record<string, string> = {
  application_submitted: "application_received",
  application_withdrawn: "candidate_withdrawn",
};

export function translateMessagesOptions(
  options: ReadonlyArray<MessagesOptionDef>,
  t: (key: MessageKey) => string,
): EmployerRegisterSelectOption[] {
  return options.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }));
}

function pickOption<V extends string>(
  options: ReadonlyArray<MessagesOptionDef<V>>,
  raw: string | null | undefined,
  fallback: V,
): V {
  const value = raw?.trim();
  return options.some((option) => option.value === value)
    ? (value as V)
    : fallback;
}

export function messagesFiltersAreActive(filters: MessagesFiltersState): boolean {
  return (
    Boolean(filters.publicJobId) ||
    Boolean(filters.candidateSearch.trim()) ||
    filters.category !== "all" ||
    filters.applicationStatus !== "all" ||
    filters.interviewStatus !== "all" ||
    filters.offerStatus !== "all" ||
    filters.quickDate !== "all" ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    filters.unreadOnly ||
    filters.employerAction !== "all" ||
    filters.candidateAction !== "all" ||
    filters.conversationType !== "all" ||
    filters.sort !== "newest"
  );
}

/** Filters that narrow the conversation list (unread-only is a tab, not a filter). */
export function messagesListIsFiltered(filters: MessagesFiltersState): boolean {
  return messagesFiltersAreActive({ ...filters, unreadOnly: false, sort: "newest" });
}

/** Map panel filters to a single hasType query when interview/offer status set. */
export function resolveMessagesHasType(
  filters: MessagesFiltersState,
): string {
  if (filters.interviewStatus !== "all") {
    return filters.interviewStatus;
  }
  if (filters.offerStatus !== "all") {
    return filters.offerStatus;
  }
  return "all";
}

/** A timeline bubble may come from either side of a mirrored event pair. */
const TIMELINE_TYPE_ALIASES: Record<string, readonly string[]> = {
  application_received: ["application_received", "application_submitted"],
  candidate_withdrawn: ["candidate_withdrawn", "application_withdrawn"],
};

function timelineTypeMatches(type: string, filterValue: string): boolean {
  if (filterValue === "all") {
    return true;
  }
  const accepted = TIMELINE_TYPE_ALIASES[filterValue] ?? [filterValue];
  return accepted.includes(type);
}

export function timelineMessageMatchesFilters(
  type: string,
  category: string,
  filters: MessagesFiltersState,
): boolean {
  if (filters.category !== "all" && category !== filters.category) {
    return false;
  }
  return (
    timelineTypeMatches(type, filters.interviewStatus) &&
    timelineTypeMatches(type, filters.offerStatus) &&
    timelineTypeMatches(type, filters.employerAction) &&
    timelineTypeMatches(type, filters.candidateAction)
  );
}

export function parseMessagesFiltersFromSearchParams(
  params: URLSearchParams,
): MessagesFiltersState {
  const rawCandidateAction = params.get("candidateAction")?.trim() ?? "";
  return {
    publicJobId: params.get("job")?.trim() ?? "",
    candidateSearch: params.get("q")?.trim() ?? "",
    category: pickOption(MESSAGES_CATEGORY_OPTIONS, params.get("category"), "all"),
    applicationStatus: pickOption(
      MESSAGES_STATUS_OPTIONS,
      params.get("status"),
      "all",
    ),
    interviewStatus: pickOption(
      MESSAGES_INTERVIEW_STATUS_OPTIONS,
      params.get("interview"),
      "all",
    ),
    offerStatus: pickOption(
      MESSAGES_OFFER_STATUS_OPTIONS,
      params.get("offer"),
      "all",
    ),
    quickDate: pickOption(MESSAGES_QUICK_DATE_OPTIONS, params.get("date"), "all"),
    dateFrom: params.get("from")?.trim() ?? "",
    dateTo: params.get("to")?.trim() ?? "",
    unreadOnly: params.get("unread") === "1",
    employerAction: pickOption(
      MESSAGES_EMPLOYER_ACTION_OPTIONS,
      params.get("employerAction"),
      "all",
    ),
    candidateAction: pickOption(
      MESSAGES_CANDIDATE_ACTION_OPTIONS,
      CANDIDATE_ACTION_ALIASES[rawCandidateAction] ?? rawCandidateAction,
      "all",
    ),
    conversationType: pickOption(
      MESSAGES_CONVERSATION_TYPE_OPTIONS,
      params.get("type"),
      "all",
    ),
    sort: SORT_VALUES.includes(params.get("sort") as MessagesSortFilter)
      ? (params.get("sort") as MessagesSortFilter)
      : "newest",
  };
}

export function writeMessagesFiltersToSearchParams(
  params: URLSearchParams,
  filters: MessagesFiltersState,
): void {
  const setOrDelete = (key: string, value: string, empty = "all") => {
    if (!value || value === empty) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  };

  setOrDelete("job", filters.publicJobId, "");
  setOrDelete("q", filters.candidateSearch.trim(), "");
  setOrDelete("category", filters.category);
  setOrDelete("status", filters.applicationStatus);
  setOrDelete("interview", filters.interviewStatus);
  setOrDelete("offer", filters.offerStatus);
  setOrDelete("date", filters.quickDate);
  setOrDelete("from", filters.dateFrom, "");
  setOrDelete("to", filters.dateTo, "");
  if (filters.unreadOnly) {
    params.set("unread", "1");
  } else {
    params.delete("unread");
  }
  setOrDelete("employerAction", filters.employerAction);
  setOrDelete("candidateAction", filters.candidateAction);
  setOrDelete("type", filters.conversationType);
  setOrDelete("sort", filters.sort, "newest");
}
