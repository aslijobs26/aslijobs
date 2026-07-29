import type { EmployerRegisterSelectOption } from "@/types/employer-register";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  EMPLOYER_APPLICATION_STATUSES,
} from "@/types/employer-applications";

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

export const MESSAGES_CATEGORY_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "all", label: "All" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
];

export const MESSAGES_STATUS_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "all", label: "All Status" },
  ...EMPLOYER_APPLICATION_STATUSES.map((status) => ({
    value: status,
    label: EMPLOYER_APPLICATION_STATUS_LABELS[status],
  })),
];

export const MESSAGES_INTERVIEW_STATUS_OPTIONS: EmployerRegisterSelectOption[] =
  [
    { value: "all", label: "All" },
    { value: "interview_scheduled", label: "Scheduled" },
    { value: "interview_updated", label: "Rescheduled" },
    { value: "interview_completed", label: "Completed" },
    { value: "interview_cancelled", label: "Cancelled" },
  ];

export const MESSAGES_OFFER_STATUS_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "all", label: "All" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "application_selected", label: "Offer Accepted / Selected" },
  { value: "application_rejected", label: "Offer Declined / Rejected" },
];

export const MESSAGES_QUICK_DATE_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "all", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Date Range" },
];

export const MESSAGES_EMPLOYER_ACTION_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "all", label: "All" },
  { value: "application_viewed", label: "Application Viewed" },
  { value: "application_under_review", label: "Under Review" },
  { value: "application_shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "interview_updated", label: "Interview Updated" },
  { value: "interview_cancelled", label: "Interview Cancelled" },
  { value: "interview_completed", label: "Interview Completed" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "application_selected", label: "Selected" },
  { value: "application_joined", label: "Joined" },
  { value: "application_rejected", label: "Rejected" },
];

export const MESSAGES_CANDIDATE_ACTION_OPTIONS: EmployerRegisterSelectOption[] =
  [
    { value: "all", label: "All" },
    { value: "application_submitted", label: "Application Submitted" },
    { value: "application_received", label: "Application Received" },
    { value: "candidate_withdrawn", label: "Application Withdrawn" },
  ];

export const MESSAGES_CONVERSATION_TYPE_OPTIONS: EmployerRegisterSelectOption[] =
  [
    { value: "all", label: "All" },
    { value: "active", label: "Only Active Hiring" },
    { value: "completed", label: "Completed Hiring" },
    { value: "rejected", label: "Rejected Applications" },
    { value: "withdrawn", label: "Withdrawn Applications" },
  ];

export const MESSAGES_SORT_OPTIONS: EmployerRegisterSelectOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "recently_updated", label: "Recently Updated" },
  { value: "most_notifications", label: "Most Notifications" },
  { value: "unread_first", label: "Unread First" },
];

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

export function timelineMessageMatchesFilters(
  type: string,
  category: string,
  filters: MessagesFiltersState,
): boolean {
  if (filters.category !== "all" && category !== filters.category) {
    return false;
  }
  if (
    filters.interviewStatus !== "all" &&
    type !== filters.interviewStatus
  ) {
    return false;
  }
  if (filters.offerStatus !== "all" && type !== filters.offerStatus) {
    return false;
  }
  if (
    filters.employerAction !== "all" &&
    type !== filters.employerAction
  ) {
    return false;
  }
  if (
    filters.candidateAction !== "all" &&
    type !== filters.candidateAction
  ) {
    return false;
  }
  return true;
}

export function parseMessagesFiltersFromSearchParams(
  params: URLSearchParams,
): MessagesFiltersState {
  const quickDate = (params.get("date") ??
    "all") as MessagesQuickDateFilter;
  return {
    publicJobId: params.get("job")?.trim() ?? "",
    candidateSearch: params.get("q")?.trim() ?? "",
    category: (params.get("category") ?? "all") as MessagesCategoryFilter,
    applicationStatus: params.get("status")?.trim() || "all",
    interviewStatus: params.get("interview")?.trim() || "all",
    offerStatus: params.get("offer")?.trim() || "all",
    quickDate: [
      "all",
      "today",
      "yesterday",
      "last_7_days",
      "last_30_days",
      "this_month",
      "last_month",
      "custom",
    ].includes(quickDate)
      ? quickDate
      : "all",
    dateFrom: params.get("from")?.trim() ?? "",
    dateTo: params.get("to")?.trim() ?? "",
    unreadOnly: params.get("unread") === "1",
    employerAction: params.get("employerAction")?.trim() || "all",
    candidateAction: params.get("candidateAction")?.trim() || "all",
    conversationType: (params.get("type") ??
      "all") as MessagesConversationTypeFilter,
    sort: (params.get("sort") ?? "newest") as MessagesSortFilter,
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
