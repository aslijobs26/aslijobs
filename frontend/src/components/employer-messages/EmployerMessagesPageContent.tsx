"use client";

import {
  formatNotificationTime,
  notificationIcon,
} from "@/components/notifications/notification-utils";
import { getCandidateInitials } from "@/components/employer-candidates/candidates-ats-utils";
import {
  DEFAULT_MESSAGES_FILTERS,
  MESSAGES_CATEGORY_OPTIONS,
  messagesListIsFiltered,
  parseMessagesFiltersFromSearchParams,
  resolveMessagesHasType,
  timelineMessageMatchesFilters,
  writeMessagesFiltersToSearchParams,
  type MessagesFiltersState,
} from "@/components/employer-messages/messages-filters";
import { localizeNotification } from "@/components/employer-messages/localize-notification";
import {
  buildMessagesActivitySignature,
  flattenConversationPages,
  flattenTimelinePages,
  MESSAGES_BULK_SELECTION_LIMIT,
  patchConversationPages,
  safeEmployerActionPath,
  toggleBulkSelection,
} from "@/components/employer-messages/messages-merge";
import { MessagesFilterPanel } from "@/components/employer-messages/MessagesFilterPanel";
import { MessagesMobileFiltersSheet } from "@/components/employer-messages/MessagesMobileFiltersSheet";
import { MessagesStatsCards } from "@/components/employer-messages/MessagesStatsCards";
import { triggerBlobDownload } from "@/components/employer-saved-candidates/saved-candidates-utils";
import "@/components/employer-messages/employer-messages-page-layout.css";
import { ROUTES } from "@/constants/routes";
import type { SiteLanguageCode } from "@/constants/site-language";
import { useSiteLanguage } from "@/i18n/site-language";
import { useTranslate, type MessageKey } from "@/i18n/translate";
import { useCan } from "@/providers/employer-permission-provider";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import type { EmployerLoginPublic } from "@/services/employer-login.service";
import {
  bulkUpdateConversationReadState,
  employerMessageQueryKeys,
  exportEmployerMessagesCsv,
  fetchConversationTimeline,
  fetchNotificationConversations,
  markConversationNotificationsAsRead,
  markConversationNotificationsAsUnread,
  notificationQueryKeys,
  setConversationFlag,
} from "@/services/notifications.service";
import type {
  EmployerMessageConversation,
  EmployerMessageConversationFlag,
  EmployerMessageConversationListResult,
  EmployerMessageConversationView,
  EmployerMessageTimelineItem,
} from "@/types/employer-messages";
import {
  EMPLOYER_APPLICATION_STATUSES,
  isEmployerTerminalStatus,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import type { NotificationType } from "@/types/notifications";
import { cn } from "@/utils/cn";
import { resolveEmployerPosterImageUrl } from "@/utils/employer-poster-image";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { showAppToast } from "@/utils/share-job";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  Archive,
  BadgeCheck,
  BellOff,
  ChevronLeft,
  Download,
  Filter,
  MessageSquare,
  MoreVertical,
  Phone,
  Search,
  Star,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConversationTab = "all" | "unread" | "starred" | "archived";

type ConversationPages = InfiniteData<
  EmployerMessageConversationListResult,
  number
>;

const CONVERSATION_PAGE_SIZE = 20;

const FLAG_SUCCESS_KEYS: Record<
  EmployerMessageConversationFlag,
  { on: MessageKey; off: MessageKey }
> = {
  star: {
    on: "employer.messagesPage.actions.starSuccess",
    off: "employer.messagesPage.actions.unstarSuccess",
  },
  archive: {
    on: "employer.messagesPage.actions.archiveSuccess",
    off: "employer.messagesPage.actions.unarchiveSuccess",
  },
  mute: {
    on: "employer.messagesPage.actions.muteSuccess",
    off: "employer.messagesPage.actions.unmuteSuccess",
  },
};

function tabView(tab: ConversationTab): EmployerMessageConversationView {
  if (tab === "starred" || tab === "archived") {
    return tab;
  }
  return "inbox";
}

type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

/** Keeps the three-column workspace usable on very short viewports. */
const MIN_WORKSPACE_HEIGHT_PX = 420;

/**
 * Matches FloatingBottomNav (`h-[78px]` + safe-area). Reserved when measuring
 * the locked messaging shell on small screens so content is not clipped.
 */
const MOBILE_FLOATING_NAV_RESERVE_PX = 90;

/** Treat "near bottom" as bottom so auto-scroll survives sub-pixel rounding. */
const TIMELINE_BOTTOM_THRESHOLD_PX = 48;

const TIMELINE_PAGE_SIZE = 50;

/** Messages activity probe interval; paused while the tab is hidden. */
const MESSAGES_ACTIVITY_POLL_MS = 45_000;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function buildTelHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    return null;
  }
  return `tel:+${digits.startsWith("91") ? digits : `91${digits}`}`;
}

function intlLocale(languageCode: string): string {
  return `${languageCode}-IN`;
}

/** Candidate / system events → left. Employer-initiated → right. */
function isOutgoingTimelineItem(message: EmployerMessageTimelineItem): boolean {
  if (message.direction === "outgoing") {
    return true;
  }
  if (message.direction === "incoming") {
    return false;
  }
  return isEmployerAlignedNotification(message.type);
}

function isEmployerAlignedNotification(type: NotificationType): boolean {
  switch (type) {
    case "application_received":
    case "application_submitted":
    case "candidate_withdrawn":
    case "application_withdrawn":
    case "offer_accepted":
    case "offer_declined":
    case "job_closed":
    case "job_approved":
    case "job_rejected":
    case "job_live_changes_approved":
    case "job_live_changes_rejected":
    case "employer_verification_approved":
    case "employer_verification_rejected":
    case "employer_verification_documents_requested":
      return false;
    case "interview_scheduled":
    case "interview_updated":
    case "interview_completed":
    case "interview_cancelled":
    case "offer_sent":
    case "application_viewed":
    case "application_under_review":
    case "application_shortlisted":
    case "application_selected":
    case "application_joined":
    case "application_did_not_join":
    case "application_rejected":
      return true;
    default:
      return true;
  }
}

function isRejectionNotification(type: NotificationType): boolean {
  switch (type) {
    case "application_rejected":
    case "offer_declined":
    case "job_rejected":
    case "job_live_changes_rejected":
    case "employer_verification_rejected":
      return true;
    default:
      return false;
  }
}

function notificationBadgeKey(type: NotificationType): MessageKey {
  switch (type) {
    case "application_received":
    case "application_submitted":
      return "employer.messagesPage.badges.application";
    case "application_viewed":
      return "employer.messagesPage.badges.viewed";
    case "application_under_review":
      return "employer.messagesPage.badges.underReview";
    case "application_shortlisted":
      return "employer.messagesPage.badges.shortlisted";
    case "interview_scheduled":
      return "employer.messagesPage.badges.scheduled";
    case "interview_updated":
      return "employer.messagesPage.badges.updated";
    case "interview_completed":
      return "employer.messagesPage.badges.completed";
    case "interview_cancelled":
      return "employer.messagesPage.badges.cancelled";
    case "offer_sent":
      return "employer.messagesPage.badges.offerSent";
    case "offer_accepted":
      return "employer.messagesPage.badges.offerAccepted";
    case "offer_declined":
      return "employer.messagesPage.badges.offerDeclined";
    case "application_selected":
      return "employer.messagesPage.badges.selected";
    case "application_joined":
      return "employer.messagesPage.badges.joined";
    case "application_did_not_join":
      return "employer.messagesPage.badges.didNotJoin";
    case "application_rejected":
    case "job_rejected":
      return "employer.messagesPage.badges.rejected";
    case "application_withdrawn":
    case "candidate_withdrawn":
      return "employer.messagesPage.badges.withdrawn";
    case "job_closed":
      return "employer.messagesPage.badges.closed";
    case "job_approved":
      return "employer.messagesPage.badges.approved";
    case "job_live_changes_approved":
      return "employer.messagesPage.badges.changesApproved";
    case "job_live_changes_rejected":
      return "employer.messagesPage.badges.changesRejected";
    case "employer_verification_approved":
      return "employer.messagesPage.badges.verified";
    case "employer_verification_rejected":
      return "employer.messagesPage.badges.verificationRejected";
    case "employer_verification_documents_requested":
      return "employer.messagesPage.badges.documentsRequested";
    default:
      return "employer.messagesPage.badges.update";
  }
}

function formatBubbleTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function dayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daySeparatorLabel(
  value: string,
  locale: string,
  olderLabel: string,
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return olderLabel;
  }
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string, t: Translate): string {
  if ((EMPLOYER_APPLICATION_STATUSES as readonly string[]).includes(status)) {
    return t(
      `employer.status.application.${status as EmployerApplicationStatus}`,
    );
  }
  return status || "—";
}

function isJobThread(conversation: EmployerMessageConversation | null): boolean {
  return conversation?.referenceType === "job";
}

function conversationDisplayName(
  conversation: EmployerMessageConversation | null,
  t: Translate,
): string {
  if (!conversation) {
    return t("employer.messagesPage.list.candidate");
  }
  if (isJobThread(conversation)) {
    return t("employer.messagesPage.list.operations");
  }
  return conversation.candidateName || t("employer.messagesPage.list.candidate");
}

function getEmployerDisplayName(employer: EmployerLoginPublic): string {
  if (
    (employer.accountType === "company" ||
      employer.accountType === "consultancy") &&
    employer.companyName.trim()
  ) {
    return employer.companyName.trim();
  }

  const fullName = `${employer.firstName} ${employer.lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return employer.companyName.trim() || "Employer";
}

function getEmployerAvatarName(employer: EmployerLoginPublic): string {
  const fullName = `${employer.firstName} ${employer.lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return getEmployerDisplayName(employer);
}

function getEmployerAvatarUrl(employer: EmployerLoginPublic): string | null {
  return resolveEmployerPosterImageUrl(employer) || null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

function ConversationAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const sizeClassName =
    size === "md" ? "size-9 text-[0.625rem]" : "size-7 text-[0.5625rem]";
  const [hasImageError, setHasImageError] = useState(false);
  const resolvedImageUrl = resolveMediaUrl(imageUrl);

  if (resolvedImageUrl && !hasImageError) {
    return (
      <img
        src={resolvedImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setHasImageError(true)}
        className={cn(
          "inline-flex shrink-0 rounded-full object-cover",
          sizeClassName,
        )}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-surface",
        sizeClassName,
      )}
      aria-hidden="true"
    >
      {getCandidateInitials(name)}
    </span>
  );
}

function ConversationFlagIcons({
  conversation,
  t,
}: {
  conversation: EmployerMessageConversation | null;
  t: Translate;
}) {
  if (!conversation) {
    return null;
  }
  return (
    <>
      {conversation.starred ? (
        <Star
          className="size-3 shrink-0 fill-amber-400 text-amber-500"
          aria-label={t("employer.messagesPage.list.starredLabel")}
          role="img"
        />
      ) : null}
      {conversation.muted ? (
        <BellOff
          className="size-3 shrink-0 text-muted"
          aria-label={t("employer.messagesPage.list.mutedLabel")}
          role="img"
        />
      ) : null}
      {conversation.archived ? (
        <Archive
          className="size-3 shrink-0 text-muted"
          aria-label={t("employer.messagesPage.tabs.archived")}
          role="img"
        />
      ) : null}
    </>
  );
}

function TimelineSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-hidden="true">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border-subtle bg-surface px-3 py-2">
        <div className="size-9 animate-pulse rounded-full bg-primary-light/50" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-36 animate-pulse rounded bg-primary-light/50" />
          <div className="h-2.5 w-48 animate-pulse rounded bg-primary-light/40" />
        </div>
      </div>
      <div className="space-y-2 px-4 py-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-14 max-w-[65%] animate-pulse rounded-lg shadow-sm",
              index % 2 === 0
                ? "mr-auto rounded-tl-none bg-white/70"
                : "ml-auto rounded-tr-none bg-whatsapp-cta/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function WhatsAppTicks({ read, label }: { read: boolean; label: string }) {
  const color = read ? "var(--color-employer-button)" : "var(--color-muted)";
  return (
    <svg
      viewBox="0 0 16 11"
      width="16"
      height="11"
      className="shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <title>{label}</title>
      <path
        fill={color}
        d="M11.07.65a.46.46 0 0 0-.68.08L4.2 8.36 1.8 6.09a.46.46 0 0 0-.65.66l2.9 2.83a.46.46 0 0 0 .68-.05L11.15 1.3a.46.46 0 0 0-.08-.65z"
      />
      <path
        fill={color}
        d="M14.39.65a.46.46 0 0 0-.68.08L7.52 8.36l-.73-.71-.25.3 1.05 1.02a.46.46 0 0 0 .68-.05L14.47 1.3a.46.46 0 0 0-.08-.65z"
      />
    </svg>
  );
}

function MessageBubble({
  message,
  candidateName,
  employerName,
  employerImageUrl,
  locale,
  language,
  t,
  dataTour,
}: {
  message: EmployerMessageTimelineItem;
  candidateName: string;
  employerName: string;
  employerImageUrl: string | null;
  locale: string;
  language: SiteLanguageCode;
  t: Translate;
  /** Product tour anchor (`data-tour`). */
  dataTour?: string;
}) {
  const employerSide = isOutgoingTimelineItem(message);
  const copy = localizeNotification(message, language);
  const badge = t(notificationBadgeKey(message.type));
  const rejection = isRejectionNotification(message.type);
  const time = formatBubbleTime(message.createdAt, locale);
  const tickLabel = message.isRead
    ? t("employer.messagesPage.thread.read")
    : t("employer.messagesPage.thread.delivered");

  return (
    <li
      className={cn(
        "flex items-end gap-1.5",
        employerSide ? "justify-end" : "justify-start",
      )}
    >
      {!employerSide ? (
        <ConversationAvatar name={candidateName} size="sm" />
      ) : null}
      <article
        data-tour={dataTour}
        className={cn(
          "relative w-fit max-w-[min(85%,22rem)] min-w-[7.5rem] px-2 pt-1 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] sm:px-[9px] sm:pt-1.5 sm:pb-1.5 lg:max-w-[65%] lg:min-w-[8.5rem]",
          employerSide
            ? "rounded-[7.5px] rounded-tr-none bg-whatsapp-cta text-foreground"
            : "rounded-[7.5px] rounded-tl-none bg-surface text-foreground",
        )}
      >
        <div className="mb-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
          {createElement(notificationIcon(message.type), {
            className: "size-3 shrink-0 text-primary sm:size-3.5",
            "aria-hidden": true,
          })}
          <h3
            className={cn(
              "text-xs font-semibold leading-[1.2] tracking-[0.01em] sm:text-[0.8125rem]",
              rejection ? "text-pin-state" : "text-foreground",
            )}
          >
            {copy.title}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded px-1 py-px text-[0.5625rem] font-medium leading-4 text-primary sm:px-1.5 sm:text-[0.625rem]">
            {badge}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-xs leading-[1.35] [overflow-wrap:anywhere] text-foreground sm:text-[0.875rem]">
          {copy.body}
          <span
            className="float-right clear-both ml-2.5 mt-1 inline-flex h-[14px] items-center gap-[3px] text-[0.625rem] leading-none text-muted sm:ml-3 sm:h-[15px] sm:text-[0.6875rem]"
            aria-hidden="true"
          >
            <span>{time}</span>
            {employerSide ? (
              <WhatsAppTicks read={message.isRead} label={tickLabel} />
            ) : null}
          </span>
        </p>
        <span className="sr-only">
          {time}
          {employerSide ? `, ${tickLabel}` : ""}
        </span>
      </article>
      {employerSide ? (
        <ConversationAvatar
          name={employerName}
          imageUrl={employerImageUrl}
          size="sm"
        />
      ) : null}
    </li>
  );
}

const actionsMenuItemClassName =
  "block w-full min-h-10 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-primary-light/50 focus-visible:outline-none focus-visible:bg-primary-light/50 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-0 lg:py-2 lg:text-xs";

type ActionsMenuItem =
  | { key: string; label: string; kind: "link"; href: string }
  | { key: string; label: string; kind: "tel"; href: string }
  | {
      key: string;
      label: string;
      kind: "button";
      onSelect: () => void;
      disabled?: boolean;
    };

/**
 * Every destination is a real, distinct target and is only listed when the
 * team member's existing candidate / interview permissions allow it.
 */
function ActionsMenu({
  conversation,
  phoneHref,
  onMarkUnread,
  isMarkingUnread,
  onToggleFlag,
  isUpdatingFlag,
  t,
}: {
  conversation: EmployerMessageConversation;
  phoneHref: string | null;
  onMarkUnread: () => void;
  isMarkingUnread: boolean;
  onToggleFlag: (flag: EmployerMessageConversationFlag, value: boolean) => void;
  isUpdatingFlag: boolean;
  t: Translate;
}) {
  const { can, canField } = useCan();
  const [open, setOpen] = useState(false);
  const applicationId = conversation.applicationId;
  const items: ActionsMenuItem[] = [];

  if (isJobThread(conversation)) {
    if (can("jobs", "read")) {
      items.push({
        key: "view-job",
        kind: "link",
        label: t("employer.messagesPage.actions.viewJob"),
        href:
          safeEmployerActionPath(conversation.latestNotification.actionPath) ??
          ROUTES.EMPLOYER_JOBS,
      });
    }
  } else {
    const isClosed = isEmployerTerminalStatus(conversation.applicationStatus);
    if (phoneHref) {
      items.push({
        key: "call",
        kind: "tel",
        label: t("employer.messagesPage.actions.call"),
        href: phoneHref,
      });
    }
    if (can("candidates", "read")) {
      items.push({
        key: "profile",
        kind: "link",
        label: t("employer.messagesPage.actions.openProfile"),
        href: ROUTES.employerCandidateDetail(applicationId),
      });
    }
    if (can("candidates", "read") && canField("candidates", "resume")) {
      items.push({
        key: "resume",
        kind: "link",
        label: t("employer.messagesPage.actions.viewResume"),
        href: ROUTES.employerCandidateDetailSection(applicationId, "resume"),
      });
    }
    if (
      !isClosed &&
      (can("interviews", "create") || can("interviews", "update"))
    ) {
      items.push({
        key: "interview",
        kind: "link",
        label: t("employer.messagesPage.actions.scheduleInterview"),
        href: ROUTES.employerCandidateDetailSection(applicationId, "interview"),
      });
    }
    if (
      !isClosed &&
      can("candidates", "update") &&
      canField("candidates", "offer_amount", "write")
    ) {
      items.push({
        key: "offer",
        kind: "link",
        label: t("employer.messagesPage.actions.sendOffer"),
        href: ROUTES.employerCandidateDetailSection(applicationId, "offer"),
      });
    }
  }

  if (conversation.unreadCount === 0) {
    items.push({
      key: "mark-unread",
      kind: "button",
      label: t("employer.messagesPage.actions.markUnread"),
      onSelect: onMarkUnread,
      disabled: isMarkingUnread,
    });
  }

  if (can("messages", "update")) {
    items.push(
      {
        key: "star",
        kind: "button",
        label: conversation.starred
          ? t("employer.messagesPage.actions.unstar")
          : t("employer.messagesPage.actions.star"),
        onSelect: () => onToggleFlag("star", !conversation.starred),
        disabled: isUpdatingFlag,
      },
      {
        key: "archive",
        kind: "button",
        label: conversation.archived
          ? t("employer.messagesPage.actions.unarchive")
          : t("employer.messagesPage.actions.archive"),
        onSelect: () => onToggleFlag("archive", !conversation.archived),
        disabled: isUpdatingFlag,
      },
      {
        key: "mute",
        kind: "button",
        label: conversation.muted
          ? t("employer.messagesPage.actions.unmute")
          : t("employer.messagesPage.actions.mute"),
        onSelect: () => onToggleFlag("mute", !conversation.muted),
        disabled: isUpdatingFlag,
      },
    );
  }

  const close = () => setOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-primary lg:size-9"
        aria-label={t("employer.messagesPage.actions.more")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label={t("employer.messagesPage.actions.closeMenu")}
            onClick={close}
          />
          <div
            role="menu"
            className="absolute top-full right-0 z-20 mt-1.5 max-h-[min(18rem,60dvh)] min-w-[11.5rem] overflow-y-auto overscroll-contain rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)] lg:mt-1 lg:min-w-44 lg:rounded-lg lg:py-1 lg:shadow-lg"
          >
            {items.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">
                {t("employer.messagesPage.actions.noActions")}
              </p>
            ) : (
              items.map((item) => {
                if (item.kind === "button") {
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      className={actionsMenuItemClassName}
                      onClick={() => {
                        close();
                        item.onSelect();
                      }}
                    >
                      {item.label}
                    </button>
                  );
                }
                if (item.kind === "tel") {
                  return (
                    <a
                      key={item.key}
                      role="menuitem"
                      href={item.href}
                      className={actionsMenuItemClassName}
                      onClick={close}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.key}
                    role="menuitem"
                    href={item.href}
                    className={actionsMenuItemClassName}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function pickAutoConversation(
  conversations: EmployerMessageConversation[],
): EmployerMessageConversation | null {
  if (conversations.length === 0) {
    return null;
  }
  const unread = conversations.find((item) => item.unreadCount > 0);
  return unread ?? conversations[0] ?? null;
}

export function EmployerMessagesPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslate();
  const language = useSiteLanguage();
  const locale = intlLocale(language.code);
  const { can, canField, getFieldLevel } = useCan();
  const canViewCandidatePhone =
    canField("candidates", "phone") &&
    getFieldLevel("candidates", "phone") !== "mask";
  const canExportMessages = can("messages", "export");

  const selectedApplicationId =
    searchParams.get("applicationId")?.trim() || null;

  const employerProfileQuery = useEmployerProfile();

  const employerName = employerProfileQuery.data
    ? getEmployerAvatarName(employerProfileQuery.data)
    : "Employer";
  const employerImageUrl = employerProfileQuery.data
    ? getEmployerAvatarUrl(employerProfileQuery.data)
    : null;

  const [filters, setFilters] = useState<MessagesFiltersState>(() =>
    parseMessagesFiltersFromSearchParams(searchParams),
  );
  const [tab, setTab] = useState<ConversationTab>(
    filters.unreadOnly ? "unread" : "all",
  );
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<EmployerMessageConversation | null>(null);
  /** Thread the employer backed out of on mobile; any other selection shows the timeline. */
  const [mobileClosedApplicationId, setMobileClosedApplicationId] = useState<
    string | null
  >(null);
  const mobileShowTimeline =
    Boolean(selectedApplicationId) &&
    mobileClosedApplicationId !== selectedApplicationId;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(
    () => new Set(),
  );

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineAtBottomRef = useRef(true);
  const lastRenderedApplicationIdRef = useRef<string | null>(null);
  const openingApplicationIdRef = useRef<string | null>(null);
  const hasAppliedInitialSelectionRef = useRef(false);
  const lastActivitySignatureRef = useRef<string | null>(null);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  /** Threads the employer marked unread; auto mark-read skips them until reopened. */
  const manualUnreadIdsRef = useRef<Set<string>>(new Set());
  const lastMarkReadAttemptRef = useRef<{
    applicationId: string;
    unreadCount: number;
  } | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceHeight, setWorkspaceHeight] = useState<number | null>(null);

  const debouncedCandidateSearch = useDebouncedValue(
    filters.candidateSearch.trim().replace(/\s+/g, " "),
    300,
  );

  /**
   * Desktop (lg+) height is owned by flex + page-layout CSS so the shell
   * fills the viewport without a short measured height leaving a bottom gap.
   * Mobile conversation view still locks height above the floating bottom nav.
   */
  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (isDesktop) {
        setWorkspaceHeight(null);
        return;
      }

      if (!mobileShowTimeline) {
        setWorkspaceHeight(null);
        return;
      }

      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }

      const applyHeight = () => {
        const top = element.getBoundingClientRect().top;
        const hasFloatingNav = window.matchMedia("(max-width: 767px)").matches;
        const bottomReserve = hasFloatingNav
          ? MOBILE_FLOATING_NAV_RESERVE_PX
          : 0;
        const available = window.innerHeight - top - bottomReserve;
        setWorkspaceHeight(Math.max(MIN_WORKSPACE_HEIGHT_PX, available));
      };

      requestAnimationFrame(applyHeight);
    };

    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.visualViewport?.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [mobileShowTimeline]);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileFiltersOpen]);

  const syncFiltersToUrl = useCallback(
    (next: MessagesFiltersState) => {
      const params = new URLSearchParams(searchParams.toString());
      writeMessagesFiltersToSearchParams(params, next);
      const applicationId = params.get("applicationId");
      if (applicationId) {
        params.set("applicationId", applicationId);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  /**
   * Starred / Archived tabs keep their view when filters change; the All /
   * Unread tabs follow the unread-only filter.
   */
  const updateFilters = useCallback(
    (next: MessagesFiltersState, nextTab?: ConversationTab) => {
      setFilters(next);
      setTab(
        (current) =>
          nextTab ??
          (current === "starred" || current === "archived"
            ? current
            : next.unreadOnly
              ? "unread"
              : "all"),
      );
      setBulkSelection(new Set());
      syncFiltersToUrl(next);
    },
    [syncFiltersToUrl],
  );

  const clearFilters = useCallback(() => {
    updateFilters({ ...DEFAULT_MESSAGES_FILTERS });
  }, [updateFilters]);

  const listView = tabView(tab);
  const listReadStatus = filters.unreadOnly ? "unread" : "all";

  const conversationFilterParams = {
    search: debouncedCandidateSearch || undefined,
    category: filters.category,
    publicJobId: filters.publicJobId || undefined,
    applicationStatus: filters.applicationStatus,
    hasType: resolveMessagesHasType(filters),
    employerAction: filters.employerAction,
    candidateAction: filters.candidateAction,
    conversationType: filters.conversationType,
    quickDate: filters.quickDate,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    sort: filters.sort,
  } as const;

  const conversationFilterKey = [
    filters.publicJobId,
    filters.category,
    filters.applicationStatus,
    filters.interviewStatus,
    filters.offerStatus,
    filters.quickDate,
    filters.dateFrom,
    filters.dateTo,
    filters.employerAction,
    filters.candidateAction,
    filters.conversationType,
    filters.sort,
    debouncedCandidateSearch,
  ] as const;

  const listIsFiltered = messagesListIsFiltered({
    ...filters,
    candidateSearch: debouncedCandidateSearch,
  });

  /**
   * Tab counts under the current filters (`viewCounts`), plus the unfiltered
   * KPI stats and job facets (computed server-side once per filter set).
   */
  const allConversationsStatsQuery = useQuery({
    queryKey: [
      ...employerMessageQueryKeys.stats,
      "all",
      ...conversationFilterKey,
    ],
    queryFn: () =>
      fetchNotificationConversations({
        page: 1,
        limit: 1,
        readStatus: "all",
        ...conversationFilterParams,
      }),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const conversationsQuery = useInfiniteQuery({
    queryKey: [
      ...employerMessageQueryKeys.conversations,
      listView,
      listReadStatus,
      ...conversationFilterKey,
    ],
    queryFn: ({ pageParam }) =>
      fetchNotificationConversations({
        page: pageParam,
        limit: CONVERSATION_PAGE_SIZE,
        readStatus: listReadStatus,
        view: listView,
        includeStats: false,
        ...conversationFilterParams,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  /**
   * Messages-scoped activity probe: newest employer thread only, so account
   * notices outside Messages never trigger a refresh. Polling pauses while
   * the tab is hidden and runs once more when it regains focus.
   */
  const activityQuery = useQuery({
    queryKey: employerMessageQueryKeys.activity,
    queryFn: () =>
      fetchNotificationConversations({
        page: 1,
        limit: 1,
        readStatus: "all",
        sort: "newest",
        includeStats: false,
      }),
    staleTime: 15_000,
    refetchInterval: MESSAGES_ACTIVITY_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const activitySignature = buildMessagesActivitySignature(activityQuery.data);

  useEffect(() => {
    if (!activitySignature) {
      return;
    }
    const previous = lastActivitySignatureRef.current;
    lastActivitySignatureRef.current = activitySignature;
    if (previous === null || previous === activitySignature) {
      return;
    }

    const refreshes: Promise<unknown>[] = [
      queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.conversations,
      }),
      queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.stats,
      }),
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.unreadCount("employer"),
      }),
    ];

    if (selectedApplicationId) {
      refreshes.push(
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.timeline(selectedApplicationId),
        }),
      );
    }

    void Promise.allSettled(refreshes);
    // Only a new activity signature should trigger a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitySignature]);

  const conversations = useMemo(
    () => flattenConversationPages(conversationsQuery.data?.pages ?? []),
    [conversationsQuery.data?.pages],
  );

  const selectedConversation = useMemo(() => {
    if (!selectedApplicationId) {
      return null;
    }
    return (
      conversations.find(
        (item) => item.applicationId === selectedApplicationId,
      ) ??
      (selectedSnapshot?.applicationId === selectedApplicationId
        ? selectedSnapshot
        : null)
    );
  }, [conversations, selectedApplicationId, selectedSnapshot]);

  const selectedIsJobThread = isJobThread(selectedConversation);
  const actionsPhoneHref =
    canViewCandidatePhone &&
    !selectedIsJobThread &&
    selectedConversation?.candidatePhone
      ? buildTelHref(selectedConversation.candidatePhone)
      : null;

  const timelineQuery = useInfiniteQuery({
    queryKey: employerMessageQueryKeys.timeline(selectedApplicationId),
    queryFn: ({ pageParam }) =>
      fetchConversationTimeline(selectedApplicationId!, {
        limit: TIMELINE_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasOlder && lastPage.pagination.olderCursor
        ? lastPage.pagination.olderCursor
        : undefined,
    enabled: Boolean(selectedApplicationId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const patchConversations = useCallback(
    (
      applicationIds: ReadonlySet<string>,
      patch: (item: EmployerMessageConversation) => EmployerMessageConversation,
    ) => {
      setSelectedSnapshot((current) =>
        current && applicationIds.has(current.applicationId)
          ? patch(current)
          : current,
      );
      queryClient.setQueriesData<ConversationPages>(
        { queryKey: employerMessageQueryKeys.conversations },
        (current) => patchConversationPages(current, applicationIds, patch),
      );
    },
    [queryClient],
  );

  const applyUnreadCount = useCallback(
    (applicationId: string, unreadCount: number) => {
      patchConversations(new Set([applicationId]), (item) => ({
        ...item,
        unreadCount,
      }));
    },
    [patchConversations],
  );

  const markReadMutation = useMutation({
    mutationFn: (applicationId: string) =>
      markConversationNotificationsAsRead(applicationId),
    onSuccess: (updatedCount, applicationId) => {
      applyUnreadCount(applicationId, 0);

      queryClient.setQueryData<number>(
        notificationQueryKeys.unreadCount("employer"),
        (current) => Math.max(0, (current ?? 0) - updatedCount),
      );

      void queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.stats,
      });
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (applicationId: string) =>
      markConversationNotificationsAsUnread(applicationId),
    onSuccess: ({ unreadCount }, applicationId) => {
      manualUnreadIdsRef.current.add(applicationId);
      lastMarkReadAttemptRef.current = { applicationId, unreadCount };
      applyUnreadCount(applicationId, unreadCount);
      void Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.stats,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.unreadCount("employer"),
        }),
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.timeline(applicationId),
        }),
      ]);
      showAppToast(t("employer.messagesPage.actions.markUnreadSuccess"));
    },
    onError: (error) => {
      showAppToast(
        getErrorMessage(error, t("employer.messagesPage.actions.markUnreadError")),
        "error",
      );
    },
  });

  const flagMutation = useMutation({
    mutationFn: (input: {
      applicationId: string;
      flag: EmployerMessageConversationFlag;
      value: boolean;
    }) => setConversationFlag(input.applicationId, input.flag, input.value),
    onSuccess: (state, input) => {
      patchConversations(new Set([state.applicationId]), (item) => ({
        ...item,
        starred: state.starred,
        archived: state.archived,
        muted: state.muted,
      }));
      void Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.conversations,
        }),
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.stats,
        }),
      ]);
      showAppToast(t(FLAG_SUCCESS_KEYS[input.flag][input.value ? "on" : "off"]));
    },
    onError: (error) => {
      showAppToast(
        getErrorMessage(error, t("employer.messagesPage.actions.updateError")),
        "error",
      );
    },
  });

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
    setBulkSelection(new Set());
  }, []);

  const bulkMutation = useMutation({
    mutationFn: (input: { applicationIds: string[]; action: "read" | "unread" }) =>
      bulkUpdateConversationReadState(input.applicationIds, input.action),
    onSuccess: (result) => {
      const unreadById = new Map(
        result.updated.map((entry) => [entry.applicationId, entry.unreadCount]),
      );
      patchConversations(new Set(unreadById.keys()), (item) => ({
        ...item,
        unreadCount: unreadById.get(item.applicationId) ?? item.unreadCount,
      }));
      for (const applicationId of unreadById.keys()) {
        if (result.action === "unread") {
          manualUnreadIdsRef.current.add(applicationId);
        } else {
          manualUnreadIdsRef.current.delete(applicationId);
        }
      }
      lastMarkReadAttemptRef.current = null;

      void Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.stats,
        }),
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.conversations,
        }),
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.unreadCount("employer"),
        }),
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.timelines,
        }),
      ]);

      showAppToast(
        t(
          result.action === "read"
            ? "employer.messagesPage.bulk.readSuccess"
            : "employer.messagesPage.bulk.unreadSuccess",
          { count: result.updated.length },
        ),
      );
      const notUpdated = result.notFound.length + result.skipped.length;
      if (notUpdated > 0) {
        showAppToast(
          t("employer.messagesPage.bulk.skipped", { count: notUpdated }),
          "error",
        );
      }
      exitBulkMode();
    },
    onError: (error) => {
      showAppToast(
        getErrorMessage(error, t("employer.messagesPage.bulk.error")),
        "error",
      );
    },
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportEmployerMessagesCsv({
        ...conversationFilterParams,
        readStatus: listReadStatus,
        view: listView,
      }),
    onSuccess: ({ blob, fileName }) => {
      triggerBlobDownload(blob, fileName);
      showAppToast(t("employer.messagesPage.export.success"));
    },
    onError: (error) => {
      const message =
        error instanceof Error && !("response" in error) && error.message
          ? error.message
          : getErrorMessage(error, t("employer.messagesPage.export.error"));
      showAppToast(message, "error");
    },
  });

  const toggleBulkItem = (applicationId: string) => {
    const { next, limitReached } = toggleBulkSelection(
      bulkSelection,
      applicationId,
    );
    if (limitReached) {
      showAppToast(
        t("employer.messagesPage.bulk.limit", {
          max: MESSAGES_BULK_SELECTION_LIMIT,
        }),
        "error",
      );
      return;
    }
    setBulkSelection(next);
  };

  const openConversation = useCallback(
    (
      conversation: EmployerMessageConversation,
      options?: { auto?: boolean },
    ) => {
      const applicationId = conversation.applicationId?.trim();
      if (!applicationId) {
        return;
      }

      openingApplicationIdRef.current = applicationId;
      setSelectedSnapshot(conversation);
      setMobileClosedApplicationId(null);

      const params = new URLSearchParams(searchParams.toString());
      writeMessagesFiltersToSearchParams(params, filters);
      params.set("applicationId", applicationId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      if (manualUnreadIdsRef.current.has(applicationId)) {
        if (options?.auto) {
          return;
        }
        manualUnreadIdsRef.current.delete(applicationId);
        lastMarkReadAttemptRef.current = null;
      }

      const lastAttempt = lastMarkReadAttemptRef.current;
      if (
        conversation.unreadCount > 0 &&
        (lastAttempt?.applicationId !== applicationId ||
          lastAttempt.unreadCount !== conversation.unreadCount)
      ) {
        lastMarkReadAttemptRef.current = {
          applicationId,
          unreadCount: conversation.unreadCount,
        };
        markReadMutation.mutate(applicationId);
      }
    },
    [filters, markReadMutation, pathname, router, searchParams],
  );

  /** Keep open chats marked read when new candidate notifications arrive live. */
  useEffect(() => {
    if (
      !selectedApplicationId ||
      markReadMutation.isPending ||
      markUnreadMutation.isPending ||
      manualUnreadIdsRef.current.has(selectedApplicationId)
    ) {
      return;
    }
    const openChat =
      conversations.find(
        (item) => item.applicationId === selectedApplicationId,
      ) ??
      (selectedSnapshot?.applicationId === selectedApplicationId
        ? selectedSnapshot
        : null);
    const lastAttempt = lastMarkReadAttemptRef.current;
    if (
      openChat &&
      openChat.unreadCount > 0 &&
      (lastAttempt?.applicationId !== selectedApplicationId ||
        lastAttempt.unreadCount !== openChat.unreadCount)
    ) {
      lastMarkReadAttemptRef.current = {
        applicationId: selectedApplicationId,
        unreadCount: openChat.unreadCount,
      };
      markReadMutation.mutate(selectedApplicationId);
    }
  }, [
    conversations,
    markReadMutation,
    markUnreadMutation.isPending,
    selectedApplicationId,
    selectedSnapshot,
  ]);

  /**
   * WhatsApp Desktop–style: never leave the timeline empty when conversations exist.
   * First load / refresh → latest unread, else most recent.
   * After that, keep the open chat; only auto-open when nothing is selected.
   */
  useEffect(() => {
    if (conversationsQuery.isLoading && conversations.length === 0) {
      return;
    }
    if (conversations.length === 0) {
      return;
    }

    const pick = pickAutoConversation(conversations);
    if (!pick) {
      return;
    }

    if (!hasAppliedInitialSelectionRef.current) {
      hasAppliedInitialSelectionRef.current = true;
      if (selectedApplicationId) {
        return;
      }
      // Mobile list-first: do not auto-open a conversation on narrow viewports.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        return;
      }
    }

    // Preserve the employer's current selection across search/filter updates.
    // A selected conversation may legitimately be absent from a filtered list.
    if (
      selectedApplicationId ||
      pick.applicationId === openingApplicationIdRef.current
    ) {
      return;
    }

    openConversation(pick, { auto: true });
  }, [
    conversations,
    conversationsQuery.isLoading,
    openConversation,
    selectedApplicationId,
  ]);

  const closeMobileTimeline = () => {
    setMobileClosedApplicationId(selectedApplicationId);
  };

  const allTimelineMessages = useMemo(
    () => flattenTimelinePages(timelineQuery.data?.pages ?? []),
    [timelineQuery.data?.pages],
  );

  const timelineMessages = useMemo(
    () =>
      allTimelineMessages.filter((item) =>
        timelineMessageMatchesFilters(item.type, item.category, filters),
      ),
    [allTimelineMessages, filters],
  );

  const timelineGroups = useMemo(() => {
    const groups: {
      label: string;
      key: string;
      items: EmployerMessageTimelineItem[];
    }[] = [];
    const olderLabel = t("employer.messagesPage.thread.olderDay");
    for (const item of timelineMessages) {
      const key = dayKey(item.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(item);
      } else {
        groups.push({
          label: daySeparatorLabel(item.createdAt, locale, olderLabel),
          key,
          items: [item],
        });
      }
    }
    return groups;
    // `t` changes identity every render; the language code drives the labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineMessages, locale]);

  const handleTimelineScroll = useCallback(() => {
    const container = timelineScrollRef.current;
    if (!container) {
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    timelineAtBottomRef.current =
      distanceFromBottom <= TIMELINE_BOTTOM_THRESHOLD_PX;
  }, []);

  const loadOlderTimeline = useCallback(() => {
    const container = timelineScrollRef.current;
    if (container) {
      pendingScrollRestoreRef.current =
        container.scrollHeight - container.scrollTop;
    }
    void timelineQuery.fetchNextPage();
  }, [timelineQuery]);

  /** Keep the reader's position when older notifications are prepended. */
  useLayoutEffect(() => {
    const distanceFromBottom = pendingScrollRestoreRef.current;
    const container = timelineScrollRef.current;
    if (distanceFromBottom === null || !container) {
      return;
    }
    if (timelineQuery.isFetchingNextPage) {
      return;
    }
    pendingScrollRestoreRef.current = null;
    container.scrollTop = container.scrollHeight - distanceFromBottom;
  }, [allTimelineMessages.length, timelineQuery.isFetchingNextPage]);

  /**
   * WhatsApp behaviour: jump to the latest message when a chat opens, but only
   * follow new notifications while the employer is already at the bottom.
   */
  useEffect(() => {
    if (!selectedApplicationId || timelineMessages.length === 0) {
      return;
    }

    const isNewConversation =
      lastRenderedApplicationIdRef.current !== selectedApplicationId;

    if (!isNewConversation && !timelineAtBottomRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      timelineEndRef.current?.scrollIntoView({
        behavior: isNewConversation ? "auto" : "smooth",
        block: "end",
      });
      timelineAtBottomRef.current = true;
      lastRenderedApplicationIdRef.current = selectedApplicationId;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedApplicationId, timelineMessages.length, timelineQuery.dataUpdatedAt]);

  useEffect(() => {
    timelineAtBottomRef.current = true;
    pendingScrollRestoreRef.current = null;
  }, [selectedApplicationId]);

  const stats = allConversationsStatsQuery.data?.stats ?? null;
  const viewCounts = allConversationsStatsQuery.data?.viewCounts ?? null;
  const listTotal =
    conversationsQuery.data?.pages[0]?.pagination.total ?? null;
  const tabCount = (id: ConversationTab): number | null => {
    if (viewCounts) {
      return id === "all" ? viewCounts.inbox : viewCounts[id];
    }
    return id === tab ? listTotal : null;
  };
  const isMessagesStatsLoading =
    allConversationsStatsQuery.isLoading && !allConversationsStatsQuery.data;
  const jobFacets = allConversationsStatsQuery.data?.jobFacets ?? [];
  const showTimeline = Boolean(selectedApplicationId);
  const hasOlderTimeline = Boolean(timelineQuery.hasNextPage);

  let timelineBody: ReactNode;
  if (!showTimeline) {
    timelineBody = (
      <div
        data-tour="employer-messages-thread-empty"
        className="employer-messages-thread-empty flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center lg:gap-1 lg:px-4">
        <div className="rounded-lg bg-brand-accent/25 px-5 py-3 shadow-sm ring-1 ring-black/5 lg:px-3.5 lg:py-2">
          <p className="employer-messages-thread-empty__title text-sm font-medium text-muted lg:text-[11px]">
            {t("employer.messagesPage.thread.selectTitle")}
          </p>
          <p className="employer-messages-thread-empty__desc mt-1 text-xs text-muted lg:mt-0.5 lg:text-[10px]">
            {t("employer.messagesPage.thread.selectDesc")}
          </p>
        </div>
      </div>
    );
  } else if (timelineQuery.isLoading && !timelineQuery.data) {
    timelineBody = <TimelineSkeleton />;
  } else {
    const candidateName = conversationDisplayName(selectedConversation, t);
    const showVerified =
      !selectedIsJobThread && selectedConversation?.candidateVerified === true;

    timelineBody = (
      <>
        <header
          data-tour="employer-messages-conversation-header"
          className="sticky top-0 z-10 flex shrink-0 flex-col border-b border-border-subtle bg-surface/95 backdrop-blur-[2px]"
        >
          <div className="flex items-center gap-2 px-3.5 py-3.5 sm:gap-2.5 sm:px-5 sm:py-3.5 lg:px-6">
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
              onClick={closeMobileTimeline}
              aria-label={t("employer.messagesPage.thread.back")}
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <div className="relative shrink-0">
              <ConversationAvatar name={candidateName} />
              {showVerified ? (
                <span
                  className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-surface text-resource-guide-icon shadow-sm ring-1 ring-surface sm:hidden"
                  title={t("employer.messagesPage.thread.verifiedHint")}
                  aria-label={t("employer.messagesPage.thread.verified")}
                >
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-foreground">
                  {candidateName}
                </h2>
                {showVerified ? (
                  <span
                    className="hidden shrink-0 text-resource-guide-icon sm:inline-flex"
                    title={t("employer.messagesPage.thread.verifiedHint")}
                    aria-label={t("employer.messagesPage.thread.verified")}
                  >
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                  </span>
                ) : null}
                {!selectedIsJobThread &&
                selectedConversation?.applicationStatus ? (
                  <span className="hidden rounded bg-primary-light px-1.5 py-px text-[0.5625rem] font-semibold leading-4 text-primary ring-1 ring-inset ring-primary/20 sm:inline-flex">
                    {statusLabel(selectedConversation.applicationStatus, t)}
                  </span>
                ) : null}
                <ConversationFlagIcons
                  conversation={selectedConversation}
                  t={t}
                />
              </div>
              <p className="truncate text-[0.625rem] font-medium text-muted sm:text-[0.6875rem]">
                {selectedConversation?.jobTitle ??
                  t("employer.messagesPage.list.job")}
                {selectedConversation?.publicJobId
                  ? ` - ${selectedConversation.publicJobId}`
                  : ""}
                {selectedIsJobThread
                  ? ` · ${t("employer.messagesPage.thread.operationsSubtitle")}`
                  : ""}
              </p>
            </div>
            <div
              className="flex shrink-0 items-center gap-1"
              data-tour="employer-messages-conversation-actions"
            >
              {selectedIsJobThread ? null : actionsPhoneHref ? (
                <a
                  href={actionsPhoneHref}
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-primary lg:size-9"
                  aria-label={t("employer.messagesPage.thread.call")}
                >
                  <Phone className="size-5" aria-hidden="true" />
                </a>
              ) : (
                <span
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted/40 lg:size-9"
                  aria-hidden="true"
                  title={t("employer.messagesPage.thread.phoneUnavailable")}
                >
                  <Phone className="size-5" aria-hidden="true" />
                </span>
              )}
              {selectedConversation ? (
                <ActionsMenu
                  conversation={selectedConversation}
                  phoneHref={actionsPhoneHref}
                  onMarkUnread={() =>
                    markUnreadMutation.mutate(selectedConversation.applicationId)
                  }
                  isMarkingUnread={markUnreadMutation.isPending}
                  onToggleFlag={(flag, value) =>
                    flagMutation.mutate({
                      applicationId: selectedConversation.applicationId,
                      flag,
                      value,
                    })
                  }
                  isUpdatingFlag={flagMutation.isPending}
                  t={t}
                />
              ) : null}
            </div>
          </div>
        </header>

        <div
          ref={timelineScrollRef}
          onScroll={handleTimelineScroll}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2.5 py-2 scrollbar-thin sm:px-5"
        >
          {timelineQuery.isError && allTimelineMessages.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="rounded-lg bg-brand-accent/25 px-4 py-2.5 text-center shadow-sm">
                <p className="text-sm font-medium text-muted">
                  {t("employer.messagesPage.thread.errorTitle")}
                </p>
                <button
                  type="button"
                  onClick={() => void timelineQuery.refetch()}
                  className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
                >
                  {t("employer.messagesPage.thread.retry")}
                </button>
              </div>
            </div>
          ) : (
            <>
              {hasOlderTimeline ? (
                <div className="mb-2 flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={loadOlderTimeline}
                    disabled={timelineQuery.isFetchingNextPage}
                    className="rounded-full bg-surface px-3 py-1 text-[0.6875rem] font-semibold text-primary shadow-sm ring-1 ring-border-subtle hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
                  >
                    {timelineQuery.isFetchingNextPage
                      ? t("employer.messagesPage.thread.loadingOlder")
                      : t("employer.messagesPage.thread.loadOlder")}
                  </button>
                  {timelineQuery.isFetchNextPageError ? (
                    <p className="text-[0.625rem] text-pin-state" role="alert">
                      {t("employer.messagesPage.thread.olderError")}
                    </p>
                  ) : null}
                </div>
              ) : allTimelineMessages.length > TIMELINE_PAGE_SIZE ? (
                <p className="mb-2 text-center text-[0.625rem] text-muted">
                  {t("employer.messagesPage.thread.historyStart")}
                </p>
              ) : null}

              {timelineMessages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <p className="rounded-lg bg-brand-accent/25 px-3 py-1.5 text-center text-sm text-muted shadow-sm">
                    {allTimelineMessages.length > 0
                      ? t("employer.messagesPage.thread.emptyFiltered")
                      : t("employer.messagesPage.thread.empty")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {timelineGroups.map((group, groupIndex) => (
                    <div key={group.key}>
                      <div className="mb-1.5 flex justify-center">
                        <span className="rounded-md bg-brand-accent/30 px-2.5 py-0.5 text-[0.6875rem] font-medium text-foreground/70 shadow-sm">
                          {group.label}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {group.items.map((message, itemIndex) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            candidateName={candidateName}
                            employerName={employerName}
                            employerImageUrl={employerImageUrl}
                            locale={locale}
                            language={language.code}
                            t={t}
                            dataTour={
                              groupIndex === timelineGroups.length - 1 &&
                              itemIndex === group.items.length - 1
                                ? "employer-messages-latest-message"
                                : undefined
                            }
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div
                    ref={timelineEndRef}
                    className="h-px w-full"
                    aria-hidden="true"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <footer
          data-tour="employer-messages-thread-footer"
          className="shrink-0 border-t border-border-subtle bg-surface/90 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:pb-1.5">
          {selectedConversation?.archived ? (
            <p className="text-center text-[0.6875rem] text-muted">
              {t("employer.messagesPage.thread.archivedNote")}
            </p>
          ) : null}
          {selectedConversation?.muted ? (
            <p className="text-center text-[0.6875rem] text-muted">
              {t("employer.messagesPage.thread.mutedNote")}
            </p>
          ) : null}
          <p className="text-center text-[0.6875rem] text-muted">
            {t("employer.messagesPage.header.historyNote")}
          </p>
        </footer>
      </>
    );
  }

  const isLockedShell = workspaceHeight != null;

  return (
    <div
      ref={workspaceRef}
      data-employer-messages-page
      style={
        isLockedShell
          ? { height: workspaceHeight, maxHeight: workspaceHeight }
          : undefined
      }
      className={cn(
        "employer-page-shell employer-messages-shell mx-auto flex w-full max-w-[1600px] min-h-0 flex-col px-3 py-3 sm:px-4 lg:px-3.5 lg:py-2",
        isLockedShell
          ? "max-h-dvh overflow-hidden"
          : "overflow-visible pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] lg:overflow-hidden lg:pb-2",
        "lg:h-full lg:min-h-0 lg:flex-1 lg:max-h-full",
      )}
    >
      <header
        className={cn(
          "employer-messages-header flex shrink-0 flex-wrap items-start justify-between gap-2",
          mobileShowTimeline && "hidden lg:flex",
        )}
      >
        <div className="min-w-0" data-tour="employer-messages-header">
          <h1 className="employer-messages-header__title text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-[1.125rem]">
            {t("employer.messagesPage.header.title")}
          </h1>
          <p className="employer-messages-header__subtitle mt-0.5 text-[11px] leading-snug text-muted sm:text-sm lg:text-[11px] lg:leading-snug">
            {t("employer.messagesPage.header.subtitle")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {canExportMessages ? (
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              data-tour="employer-messages-export"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-8 lg:text-[11px]"
            >
              <Download className="size-3.5" aria-hidden="true" />
              {exportMutation.isPending
                ? t("employer.messagesPage.export.exporting")
                : t("employer.messagesPage.export.button")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            data-tour="employer-messages-filters-toggle"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
          >
            <Filter className="size-3.5" aria-hidden="true" />
            {t("employer.messagesPage.header.filters")}
          </button>
        </div>
      </header>

      <div
        className={cn(
          "employer-messages-layout mt-2.5 grid gap-2.5 lg:mt-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,16%)] lg:grid-rows-[minmax(0,1fr)] lg:gap-2 lg:overflow-hidden",
          isLockedShell
            ? "min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden"
            : "flex-1",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col lg:min-h-0 lg:overflow-hidden",
            isLockedShell && "min-h-0 overflow-hidden",
          )}
        >
          <div
            className={cn(
              "shrink-0",
              mobileShowTimeline && "hidden lg:block",
            )}
            data-tour="employer-messages-stats"
          >
            <MessagesStatsCards
              stats={stats}
              filteredTotal={
                listIsFiltered ? (viewCounts?.inbox ?? null) : null
              }
              filteredUnread={
                listIsFiltered ? (viewCounts?.unread ?? null) : null
              }
              isLoading={isMessagesStatsLoading}
            />
          </div>

          <div
            className={cn(
              "mt-2.5 grid gap-0 rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:mt-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(15rem,30%)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden",
              isLockedShell
                ? "min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden"
                : "flex-1",
              mobileShowTimeline &&
                "mt-0 border-0 shadow-none lg:mt-2 lg:border lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
            )}
          >
            <section
              className={cn(
                "min-w-0 flex-col border-border-subtle lg:border-r",
                isLockedShell ? "min-h-0 overflow-hidden" : "overflow-visible",
                mobileShowTimeline ? "hidden lg:flex" : "flex",
              )}
            >
          <div className="employer-messages-list-toolbar shrink-0 border-b border-border-subtle px-2.5 pt-2 lg:px-2 lg:pt-1.5">
            <div
              className="flex gap-0.5 overflow-x-auto scrollbar-hidden"
              data-tour="employer-messages-tabs"
            >
              {(
                [
                  {
                    id: "all" as const,
                    label: t("employer.messagesPage.tabs.all"),
                    count: tabCount("all"),
                  },
                  {
                    id: "unread" as const,
                    label: t("employer.messagesPage.tabs.unread"),
                    count: tabCount("unread"),
                  },
                  {
                    id: "starred" as const,
                    label: t("employer.messagesPage.tabs.starred"),
                    count: tabCount("starred"),
                  },
                  {
                    id: "archived" as const,
                    label: t("employer.messagesPage.tabs.archived"),
                    count: tabCount("archived"),
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={tab === item.id}
                  onClick={() =>
                    updateFilters(
                      { ...filters, unreadOnly: item.id === "unread" },
                      item.id,
                    )
                  }
                  className={cn(
                    "employer-messages-list-tab inline-flex min-h-9 shrink-0 items-center gap-1 border-b-2 px-2 py-1.5 text-[11px] font-semibold sm:min-h-11 sm:px-2.5 sm:py-2 sm:text-xs lg:min-h-0 lg:px-1.5 lg:py-1 lg:text-[0.6875rem]",
                    tab === item.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {item.count !== null ? (
                    <span
                      className={cn(
                        "inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[0.5rem] font-bold sm:text-[0.5625rem] lg:text-[0.5rem]",
                        tab === item.id
                          ? "bg-primary text-surface"
                          : "bg-hero-bg text-muted",
                      )}
                    >
                      {item.count}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div
              className="relative py-2 lg:py-1.5"
              data-tour="employer-messages-search"
            >
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted lg:left-2.5 lg:size-3.5"
                aria-hidden="true"
              />
              <input
                type="search"
                value={filters.candidateSearch}
                onChange={(event) =>
                  updateFilters({
                    ...filters,
                    candidateSearch: event.target.value,
                  })
                }
                placeholder={t("employer.messagesPage.list.searchPlaceholder")}
                aria-label={t("employer.messagesPage.list.searchPlaceholder")}
                className="employer-messages-list-search h-9 w-full rounded-full border border-border-subtle bg-hero-bg py-2 pr-3 pl-9 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-11 sm:text-sm lg:h-8 lg:py-1.5 lg:pl-8 lg:text-[11px]"
              />
            </div>

            <div
              className="flex gap-1 overflow-x-auto pb-2 scrollbar-hidden lg:pb-1.5"
              data-tour="employer-messages-categories"
            >
              {MESSAGES_CATEGORY_OPTIONS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={filters.category === chip.value}
                  onClick={() =>
                    updateFilters({
                      ...filters,
                      category: chip.value,
                    })
                  }
                  className={cn(
                    "employer-messages-list-chip shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs lg:px-2 lg:py-0.5 lg:text-[0.625rem]",
                    filters.category === chip.value
                      ? "bg-primary text-surface"
                      : "bg-hero-bg text-muted hover:text-foreground",
                  )}
                >
                  {t(chip.labelKey)}
                </button>
              ))}
            </div>

            <div
              className="flex min-h-8 flex-wrap items-center gap-1.5 pb-2 lg:pb-1.5"
              data-tour="employer-messages-bulk"
            >
              {bulkMode ? (
                <>
                  <span className="text-[11px] font-semibold text-foreground lg:text-[0.625rem]">
                    {t("employer.messagesPage.bulk.selectedCount", {
                      count: bulkSelection.size,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkSelection(
                        bulkSelection.size > 0
                          ? new Set()
                          : new Set(
                              conversations
                                .slice(0, MESSAGES_BULK_SELECTION_LIMIT)
                                .map((item) => item.applicationId),
                            ),
                      )
                    }
                    className="rounded-full bg-hero-bg px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-foreground lg:py-0.5 lg:text-[0.625rem]"
                  >
                    {bulkSelection.size > 0
                      ? t("employer.messagesPage.bulk.clearSelection")
                      : t("employer.messagesPage.bulk.selectAll")}
                  </button>
                  <button
                    type="button"
                    disabled={bulkSelection.size === 0 || bulkMutation.isPending}
                    onClick={() =>
                      bulkMutation.mutate({
                        applicationIds: [...bulkSelection],
                        action: "read",
                      })
                    }
                    className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-surface hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 lg:py-0.5 lg:text-[0.625rem]"
                  >
                    {t("employer.messagesPage.bulk.markRead")}
                  </button>
                  <button
                    type="button"
                    disabled={bulkSelection.size === 0 || bulkMutation.isPending}
                    onClick={() =>
                      bulkMutation.mutate({
                        applicationIds: [...bulkSelection],
                        action: "unread",
                      })
                    }
                    className="rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60 lg:py-0.5 lg:text-[0.625rem]"
                  >
                    {t("employer.messagesPage.bulk.markUnread")}
                  </button>
                  <button
                    type="button"
                    onClick={exitBulkMode}
                    className="ml-auto text-[11px] font-semibold text-muted hover:text-foreground lg:text-[0.625rem]"
                  >
                    {t("employer.messagesPage.bulk.cancel")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setBulkMode(true)}
                  disabled={conversations.length === 0}
                  className="ml-auto text-[11px] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50 lg:text-[0.625rem]"
                >
                  {t("employer.messagesPage.bulk.select")}
                </button>
              )}
            </div>
          </div>

          <div
            className={cn(
              isLockedShell
                ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                : "overflow-visible",
            )}
          >
            {conversationsQuery.isLoading && conversations.length === 0 ? (
              <ul className="space-y-0 p-1.5" aria-hidden="true">
                {Array.from({ length: 8 }).map((_, index) => (
                  <li key={index} className="flex gap-2.5 rounded-lg px-2 py-2">
                    <div className="size-9 animate-pulse rounded-full bg-primary-light/50" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-primary-light/50" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-primary-light/40" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-primary-light/30" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : conversationsQuery.isError && conversations.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  {t("employer.messagesPage.list.errorTitle")}
                </p>
                <button
                  type="button"
                  onClick={() => void conversationsQuery.refetch()}
                  className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover"
                >
                  {t("employer.messagesPage.list.retry")}
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div
                data-tour="employer-messages-list-empty"
                className="employer-messages-empty flex flex-col items-center gap-2 px-4 py-10 text-center lg:gap-1 lg:px-3 lg:py-5">
                {createElement(
                  tab === "starred"
                    ? Star
                    : tab === "archived"
                      ? Archive
                      : MessageSquare,
                  {
                    className:
                      "employer-messages-empty__icon size-7 text-muted lg:size-3.5",
                    "aria-hidden": true,
                  },
                )}
                <p className="employer-messages-empty__title text-sm font-medium text-foreground lg:text-[11px]">
                  {listIsFiltered
                    ? t("employer.messagesPage.list.emptyFilteredTitle")
                    : tab === "starred"
                      ? t("employer.messagesPage.list.starredEmptyTitle")
                      : tab === "archived"
                        ? t("employer.messagesPage.list.archivedEmptyTitle")
                        : t("employer.messagesPage.list.emptyTitle")}
                </p>
                <p className="employer-messages-empty__desc text-xs text-muted lg:text-[10px]">
                  {listIsFiltered
                    ? t("employer.messagesPage.list.emptyFilteredDesc")
                    : tab === "starred"
                      ? t("employer.messagesPage.list.starredEmptyDesc")
                      : tab === "archived"
                        ? t("employer.messagesPage.list.archivedEmptyDesc")
                        : t("employer.messagesPage.list.emptyDesc")}
                </p>
                {listIsFiltered ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:text-[10px]"
                  >
                    {t("employer.messagesPage.list.clearFilters")}
                  </button>
                ) : null}
              </div>
            ) : (
              <ul>
                {conversations.map((conversation, index) => {
                  const isActive =
                    !bulkMode &&
                    conversation.applicationId === selectedApplicationId;
                  const isBulkSelected =
                    bulkMode && bulkSelection.has(conversation.applicationId);
                  const jobThread = isJobThread(conversation);
                  const displayName = conversationDisplayName(conversation, t);
                  const previewTitle = localizeNotification(
                    conversation.latestNotification,
                    language.code,
                  ).title;
                  return (
                    <li
                      key={conversation.applicationId}
                      data-tour={
                        index === 0
                          ? "employer-messages-first-conversation"
                          : undefined
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          bulkMode
                            ? toggleBulkItem(conversation.applicationId)
                            : openConversation(conversation)
                        }
                        aria-pressed={bulkMode ? isBulkSelected : isActive}
                        aria-label={
                          bulkMode
                            ? t("employer.messagesPage.list.selectConversation", {
                                name: displayName,
                              })
                            : undefined
                        }
                        className={cn(
                          "relative flex w-full gap-3 border-b border-border-subtle text-left transition-colors lg:gap-2.5",
                          "min-h-[4.5rem] px-3 py-3 lg:min-h-0 lg:px-2.5 lg:py-2.5",
                          isActive || isBulkSelected
                            ? "bg-primary-light/50"
                            : "hover:bg-hero-bg",
                          conversation.unreadCount > 0 &&
                            !isActive &&
                            !isBulkSelected
                            ? "bg-primary-light/20"
                            : "",
                        )}
                      >
                        {isActive ? (
                          <span
                            className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                        {bulkMode ? (
                          <span
                            className={cn(
                              "mt-2.5 inline-flex size-4 shrink-0 items-center justify-center rounded border",
                              isBulkSelected
                                ? "border-primary bg-primary text-surface"
                                : "border-border-subtle bg-surface",
                            )}
                            aria-hidden="true"
                          >
                            {isBulkSelected ? (
                              <svg viewBox="0 0 12 12" className="size-3">
                                <path
                                  d="M2.5 6.2 5 8.5l4.5-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : null}
                          </span>
                        ) : null}
                        <ConversationAvatar name={displayName} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1">
                              <span className="truncate text-xs font-bold text-foreground sm:text-sm lg:text-[0.8125rem]">
                                {displayName}
                              </span>
                              <ConversationFlagIcons
                                conversation={conversation}
                                t={t}
                              />
                            </span>
                            <span className="shrink-0 text-[0.625rem] text-muted">
                              {formatNotificationTime(
                                conversation.lastActivityAt,
                              )}
                            </span>
                          </span>
                          <span className="mt-px block truncate text-[11px] font-medium text-muted sm:text-xs lg:text-[0.6875rem]">
                            {conversation.jobTitle}
                            <span className="hidden lg:inline">
                              {!jobThread &&
                              canViewCandidatePhone &&
                              conversation.candidatePhone
                                ? ` - ${conversation.candidatePhone}`
                                : ""}
                            </span>
                          </span>
                          {!jobThread && conversation.applicationStatus ? (
                            <span className="mt-0.5 block truncate text-[0.625rem] font-semibold text-primary lg:hidden">
                              {statusLabel(conversation.applicationStatus, t)}
                            </span>
                          ) : null}
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-[11px] font-normal sm:text-xs lg:text-[0.6875rem]",
                                isRejectionNotification(
                                  conversation.latestNotification.type,
                                )
                                  ? "text-pin-state"
                                  : "text-foreground/80",
                              )}
                            >
                              {previewTitle}
                            </span>
                            {conversation.unreadCount > 0 ? (
                              <span
                                className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-pin-state px-1.5 text-[0.625rem] font-bold text-surface lg:min-w-4 lg:px-1 lg:text-[0.5625rem]"
                                aria-label={t(
                                  "employer.messagesPage.list.unreadCount",
                                  { count: conversation.unreadCount },
                                )}
                              >
                                {conversation.unreadCount}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {conversationsQuery.hasNextPage ? (
            <div
              className="shrink-0 border-t border-border-subtle p-2 text-center"
              data-tour="employer-messages-load-more"
            >
              <button
                type="button"
                disabled={conversationsQuery.isFetchingNextPage}
                onClick={() => void conversationsQuery.fetchNextPage()}
                className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-60 lg:min-h-0 lg:text-xs"
              >
                {conversationsQuery.isFetchingNextPage
                  ? t("employer.messagesPage.list.loading")
                  : t("employer.messagesPage.list.loadMore")}
              </button>
            </div>
          ) : null}
        </section>

        <section
          className={cn(
            "relative min-w-0 flex-col bg-hero-bg",
            isLockedShell
              ? "min-h-0 overflow-hidden"
              : "min-h-[70dvh] overflow-hidden",
            mobileShowTimeline ? "flex" : "hidden lg:flex",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage: "url('/images/whatsapp-chat-bg.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "360px",
            }}
            aria-hidden="true"
          />
          <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
            {timelineBody}
          </div>
        </section>
          </div>
        </div>

        <aside className="employer-messages-rail hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex">
          <MessagesFilterPanel
            filters={filters}
            jobFacets={jobFacets}
            onApply={updateFilters}
            onClear={clearFilters}
          />
        </aside>

        <MessagesMobileFiltersSheet
          open={mobileFiltersOpen}
          filters={filters}
          jobFacets={jobFacets}
          onClose={() => setMobileFiltersOpen(false)}
          onApply={updateFilters}
          onClear={clearFilters}
        />
      </div>
    </div>
  );
}
