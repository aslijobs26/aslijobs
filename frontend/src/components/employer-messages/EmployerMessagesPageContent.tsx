"use client";

import {
  formatNotificationTime,
  notificationIcon,
} from "@/components/notifications/notification-utils";
import { getCandidateInitials } from "@/components/employer-candidates/candidates-ats-utils";
import {
  DEFAULT_MESSAGES_FILTERS,
  parseMessagesFiltersFromSearchParams,
  resolveMessagesHasType,
  timelineMessageMatchesFilters,
  writeMessagesFiltersToSearchParams,
  type MessagesFiltersState,
} from "@/components/employer-messages/messages-filters";
import { MessagesFilterPanel } from "@/components/employer-messages/MessagesFilterPanel";
import { MessagesMobileFiltersSheet } from "@/components/employer-messages/MessagesMobileFiltersSheet";
import { MessagesStatsCards } from "@/components/employer-messages/MessagesStatsCards";
import { ROUTES } from "@/constants/routes";
import { useCan } from "@/providers/employer-permission-provider";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import type { EmployerLoginPublic } from "@/services/employer-login.service";
import {
  employerMessageQueryKeys,
  fetchConversationTimeline,
  fetchNotificationConversations,
  fetchNotificationUnreadCount,
  markConversationNotificationsAsRead,
  notificationQueryKeys,
} from "@/services/notifications.service";
import type {
  EmployerMessageConversation,
  EmployerMessageConversationListResult,
  EmployerMessageTimelineItem,
} from "@/types/employer-messages";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import type { NotificationType } from "@/types/notifications";
import { cn } from "@/utils/cn";
import { resolveEmployerPosterImageUrl } from "@/utils/employer-poster-image";
import { resolveMediaUrl } from "@/utils/resolve-media-url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChevronLeft,
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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ConversationTab = "all" | "unread" | "starred";

/** Keeps the three-column workspace usable on very short viewports. */
const MIN_WORKSPACE_HEIGHT_PX = 420;

/**
 * Matches FloatingBottomNav (`h-[78px]` + safe-area). Reserved when measuring
 * the locked messaging shell on small screens so content is not clipped.
 */
const MOBILE_FLOATING_NAV_RESERVE_PX = 90;

/** Treat "near bottom" as bottom so auto-scroll survives sub-pixel rounding. */
const TIMELINE_BOTTOM_THRESHOLD_PX = 48;

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
    case "application_rejected":
      return true;
    default:
      return true;
  }
}

function notificationBadgeLabel(type: NotificationType): string {
  switch (type) {
    case "application_received":
    case "application_submitted":
      return "Application";
    case "application_viewed":
      return "Viewed";
    case "application_under_review":
      return "Under Review";
    case "application_shortlisted":
      return "Shortlisted";
    case "interview_scheduled":
      return "Scheduled";
    case "interview_updated":
      return "Updated";
    case "interview_completed":
      return "Completed";
    case "interview_cancelled":
      return "Cancelled";
    case "offer_sent":
      return "Offer Sent";
    case "application_selected":
      return "Selected";
    case "application_joined":
      return "Joined";
    case "application_rejected":
      return "Rejected";
    case "application_withdrawn":
    case "candidate_withdrawn":
      return "Withdrawn";
    default:
      return "Update";
  }
}

function formatBubbleTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-IN", {
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

function formatDaySeparatorDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function daySeparatorLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Older";
  }
  return formatDaySeparatorDate(date);
}

function statusLabel(status: string): string {
  if (status in EMPLOYER_APPLICATION_STATUS_LABELS) {
    return EMPLOYER_APPLICATION_STATUS_LABELS[
      status as EmployerApplicationStatus
    ];
  }
  return status || "—";
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

function WhatsAppTicks({ read }: { read: boolean }) {
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
      <title>{read ? "Read" : "Delivered"}</title>
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
}: {
  message: EmployerMessageTimelineItem;
  candidateName: string;
  employerName: string;
  employerImageUrl: string | null;
}) {
  const employerSide = isOutgoingTimelineItem(message);
  const Icon = notificationIcon(message.type);
  const badge = notificationBadgeLabel(message.type);

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
        className={cn(
          "relative w-fit max-w-[min(85%,22rem)] min-w-[7.5rem] px-2 pt-1 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] sm:px-[9px] sm:pt-1.5 sm:pb-1.5 lg:max-w-[65%] lg:min-w-[8.5rem]",
          employerSide
            ? "rounded-[7.5px] rounded-tr-none bg-whatsapp-cta text-foreground"
            : "rounded-[7.5px] rounded-tl-none bg-surface text-foreground",
        )}
      >
        <div className="mb-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5">
          <Icon
            className="size-3 shrink-0 text-primary sm:size-3.5"
            aria-hidden="true"
          />
          <h3 className="text-xs font-semibold leading-[1.2] tracking-[0.01em] text-foreground sm:text-[0.8125rem]">
            {message.title}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded px-1 py-px text-[0.5625rem] font-medium leading-4 text-primary sm:px-1.5 sm:text-[0.625rem]">
            {badge}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-xs leading-[1.35] text-foreground [overflow-wrap:anywhere] sm:text-[0.875rem]">
          {message.body}
          <span
            className="float-right clear-both ml-2.5 mt-1 inline-flex h-[14px] items-center gap-[3px] text-[0.625rem] leading-none text-muted sm:ml-3 sm:h-[15px] sm:text-[0.6875rem]"
            aria-hidden="true"
          >
            <span>{formatBubbleTime(message.createdAt)}</span>
            {employerSide ? <WhatsAppTicks read={message.isRead} /> : null}
          </span>
        </p>
        <span className="sr-only">
          {formatBubbleTime(message.createdAt)}
          {employerSide
            ? message.isRead
              ? ", Read"
              : ", Delivered"
            : ""}
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
  "block min-h-10 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary-light/50 focus-visible:outline-none focus-visible:bg-primary-light/50 lg:min-h-0 lg:py-2 lg:text-xs";

function ActionsMenu({
  applicationId,
  phoneHref,
}: {
  applicationId: string;
  phoneHref: string | null;
}) {
  const { can } = useCan();
  const canSendOffer = can("messages", "update");
  const canScheduleInterview =
    can("interviews", "create") || can("interviews", "update");
  const [open, setOpen] = useState(false);
  const candidateHref = ROUTES.employerCandidateDetail(applicationId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-primary lg:size-9"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 z-20 mt-1.5 max-h-[min(18rem,60dvh)] min-w-[11.5rem] overflow-y-auto overscroll-contain rounded-xl border border-border-subtle bg-surface py-1.5 shadow-[0_10px_28px_rgba(26,43,60,0.14)] lg:mt-1 lg:min-w-44 lg:rounded-lg lg:py-1 lg:shadow-lg">
            {phoneHref ? (
              <a
                href={phoneHref}
                className={actionsMenuItemClassName}
                onClick={() => setOpen(false)}
              >
                Call candidate
              </a>
            ) : null}
            <Link
              href={candidateHref}
              className={actionsMenuItemClassName}
              onClick={() => setOpen(false)}
            >
              Open candidate profile
            </Link>
            <Link
              href={candidateHref}
              className={actionsMenuItemClassName}
              onClick={() => setOpen(false)}
            >
              View resume
            </Link>
            {canScheduleInterview ? (
              <Link
                href={candidateHref}
                className={actionsMenuItemClassName}
                onClick={() => setOpen(false)}
              >
                Schedule interview
              </Link>
            ) : null}
            {canSendOffer ? (
              <Link
                href={candidateHref}
                className={actionsMenuItemClassName}
                onClick={() => setOpen(false)}
              >
                Send offer
              </Link>
            ) : null}
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
  const [page, setPage] = useState(1);
  const [loadedConversations, setLoadedConversations] = useState<
    EmployerMessageConversation[]
  >([]);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<EmployerMessageConversation | null>(null);
  const [mobileShowTimeline, setMobileShowTimeline] = useState(
    Boolean(selectedApplicationId),
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [actionsPhoneHref, setActionsPhoneHref] = useState<string | null>(null);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineAtBottomRef = useRef(true);
  const lastRenderedApplicationIdRef = useRef<string | null>(null);
  const openingApplicationIdRef = useRef<string | null>(null);
  const hasAppliedInitialSelectionRef = useRef(false);
  const lastUnreadCountRef = useRef<number | null>(null);
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
   * Messaging-app shell on lg+ (and mobile conversation view): claim the
   * remaining viewport so columns scroll internally.
   * Mobile conversation-list view leaves height unlocked so the page can scroll
   * naturally above the floating bottom nav.
   */
  useEffect(() => {
    const element = workspaceRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const lockShell = isDesktop || mobileShowTimeline;

      if (!lockShell) {
        setWorkspaceHeight(null);
        return;
      }

      if (!isDesktop && mobileShowTimeline && window.scrollY !== 0) {
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

  const updateFilters = useCallback(
    (next: MessagesFiltersState) => {
      setFilters(next);
      setTab(next.unreadOnly ? "unread" : "all");
      setPage(1);
      setLoadedConversations([]);
      syncFiltersToUrl(next);
    },
    [syncFiltersToUrl],
  );

  const clearFilters = useCallback(() => {
    updateFilters({ ...DEFAULT_MESSAGES_FILTERS });
  }, [updateFilters]);

  useEffect(() => {
    if (selectedApplicationId) {
      setMobileShowTimeline(true);
    }
  }, [selectedApplicationId]);

  useEffect(() => {
    setPage(1);
    setLoadedConversations([]);
  }, [
    tab,
    filters.publicJobId,
    filters.category,
    filters.applicationStatus,
    filters.interviewStatus,
    filters.offerStatus,
    filters.quickDate,
    filters.dateFrom,
    filters.dateTo,
    filters.unreadOnly,
    filters.employerAction,
    filters.candidateAction,
    filters.conversationType,
    filters.sort,
    debouncedCandidateSearch,
  ]);

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

  /**
   * Tab/KPI totals must stay stable when the list is filtered by Unread/Starred.
   * `pagination.total` on the list query reflects the active readStatus only.
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

  const unreadConversationsStatsQuery = useQuery({
    queryKey: [
      ...employerMessageQueryKeys.stats,
      "unread",
      ...conversationFilterKey,
    ],
    queryFn: () =>
      fetchNotificationConversations({
        page: 1,
        limit: 1,
        readStatus: "unread",
        ...conversationFilterParams,
      }),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const conversationsQuery = useQuery({
    queryKey: [
      ...employerMessageQueryKeys.conversations,
      tab,
      ...conversationFilterKey,
      filters.unreadOnly,
      page,
    ],
    queryFn: () =>
      fetchNotificationConversations({
        page,
        limit: 20,
        readStatus:
          tab === "unread" || filters.unreadOnly ? "unread" : "all",
        ...conversationFilterParams,
      }),
    enabled: tab !== "starred",
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  /**
   * A single shared unread-count heartbeat drives live message refreshes.
   * Sidebar and bell observe the same key, so TanStack Query deduplicates the
   * request. Conversations/timeline refresh once only when the count increases.
   */
  const unreadHeartbeatQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount("employer"),
    queryFn: fetchNotificationUnreadCount,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const unreadCount = unreadHeartbeatQuery.data;
    if (unreadCount === undefined) {
      return;
    }

    const previousUnreadCount = lastUnreadCountRef.current;
    lastUnreadCountRef.current = unreadCount;

    if (previousUnreadCount === null || unreadCount <= previousUnreadCount) {
      return;
    }

    const refreshes = [
      queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.conversations,
      }),
      queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.stats,
      }),
    ];

    if (selectedApplicationId) {
      refreshes.push(
        queryClient.invalidateQueries({
          queryKey: employerMessageQueryKeys.timeline(selectedApplicationId),
        }),
      );
    }

    void Promise.all(refreshes);
  }, [queryClient, selectedApplicationId, unreadHeartbeatQuery.data]);

  useEffect(() => {
    const nextPage = conversationsQuery.data?.conversations;
    if (!nextPage) {
      return;
    }
    setLoadedConversations((current) => {
      if (page === 1) {
        return nextPage;
      }
      const seen = new Set(current.map((item) => item.applicationId));
      const appended = nextPage.filter(
        (item) => !seen.has(item.applicationId),
      );
      return [...current, ...appended];
    });
  }, [conversationsQuery.data, page]);

  const conversations = loadedConversations;

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

  useEffect(() => {
    if (selectedConversation?.candidatePhone) {
      setActionsPhoneHref(buildTelHref(selectedConversation.candidatePhone));
    } else {
      setActionsPhoneHref(null);
    }
  }, [selectedConversation?.candidatePhone]);

  useEffect(() => {
    if (!selectedApplicationId) {
      return;
    }
    const fresh = conversations.find(
      (item) => item.applicationId === selectedApplicationId,
    );
    if (fresh) {
      setSelectedSnapshot(fresh);
    }
  }, [conversations, selectedApplicationId]);

  const timelineQuery = useQuery({
    queryKey: employerMessageQueryKeys.timeline(selectedApplicationId),
    queryFn: () =>
      fetchConversationTimeline(selectedApplicationId!, {
        page: 1,
        limit: 50,
      }),
    enabled: Boolean(selectedApplicationId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (applicationId: string) =>
      markConversationNotificationsAsRead(applicationId),
    onSuccess: (updatedCount, applicationId) => {
      setLoadedConversations((current) =>
        current.map((item) =>
          item.applicationId === applicationId
            ? { ...item, unreadCount: 0 }
            : item,
        ),
      );
      setSelectedSnapshot((current) =>
        current?.applicationId === applicationId
          ? { ...current, unreadCount: 0 }
          : current,
      );

      queryClient.setQueryData<number>(
        notificationQueryKeys.unreadCount("employer"),
        (current) => Math.max(0, (current ?? 0) - updatedCount),
      );

      queryClient.setQueriesData<EmployerMessageConversationListResult>(
        { queryKey: employerMessageQueryKeys.conversations },
        (current) =>
          current
            ? {
                ...current,
                unreadCount: Math.max(
                  0,
                  current.unreadCount - updatedCount,
                ),
                conversations: current.conversations.map((item) =>
                  item.applicationId === applicationId
                    ? { ...item, unreadCount: 0 }
                    : item,
                ),
              }
            : current,
      );

      void queryClient.invalidateQueries({
        queryKey: employerMessageQueryKeys.stats,
      });
    },
  });

  const openConversation = useCallback(
    (conversation: EmployerMessageConversation) => {
      const applicationId = conversation.applicationId?.trim();
      if (!applicationId) {
        return;
      }

      openingApplicationIdRef.current = applicationId;
      setSelectedSnapshot(conversation);
      setMobileShowTimeline(true);

      const params = new URLSearchParams(searchParams.toString());
      writeMessagesFiltersToSearchParams(params, filters);
      params.set("applicationId", applicationId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

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
    if (!selectedApplicationId || markReadMutation.isPending) {
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
    selectedApplicationId,
    selectedSnapshot,
  ]);

  /**
   * WhatsApp Desktop–style: never leave the timeline empty when conversations exist.
   * First load / refresh → latest unread, else most recent.
   * After that, keep the open chat; only auto-open when nothing is selected.
   */
  useEffect(() => {
    if (tab === "starred") {
      return;
    }
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

    openConversation(pick);
  }, [
    conversations,
    conversationsQuery.isLoading,
    openConversation,
    selectedApplicationId,
    tab,
  ]);

  const closeMobileTimeline = () => {
    setMobileShowTimeline(false);
  };

  const timelineMessages = useMemo(() => {
    const items = [...(timelineQuery.data?.notifications ?? [])]
      .filter((item) =>
        timelineMessageMatchesFilters(item.type, item.category, filters),
      )
      .sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      );
    return items;
  }, [filters, timelineQuery.data?.notifications]);

  const timelineGroups = useMemo(() => {
    const groups: {
      label: string;
      key: string;
      items: EmployerMessageTimelineItem[];
    }[] = [];
    for (const item of timelineMessages) {
      const key = dayKey(item.createdAt);
      const label = daySeparatorLabel(item.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(item);
      } else {
        groups.push({ label, key, items: [item] });
      }
    }
    return groups;
  }, [timelineMessages]);

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
  }, [selectedApplicationId]);

  const totalConversations =
    allConversationsStatsQuery.data?.pagination.total ??
    (tab === "all" && !filters.unreadOnly
      ? (conversationsQuery.data?.pagination.total ?? 0)
      : 0);
  const unreadTotal =
    unreadConversationsStatsQuery.data?.pagination.total ??
    (tab === "unread" || filters.unreadOnly
      ? (conversationsQuery.data?.pagination.total ?? 0)
      : 0);
  const activeHiringCount =
    allConversationsStatsQuery.data?.activeHiringCount ??
    conversationsQuery.data?.activeHiringCount ??
    0;
  const interviewWeekCount =
    allConversationsStatsQuery.data?.interviewWeekCount ??
    conversationsQuery.data?.interviewWeekCount ??
    0;
  const jobFacets =
    allConversationsStatsQuery.data?.jobFacets ??
    conversationsQuery.data?.jobFacets ??
    [];
  const showTimeline = Boolean(selectedApplicationId);

  let timelineBody: ReactNode;
  if (!showTimeline) {
    timelineBody = (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="rounded-lg bg-brand-accent/25 px-5 py-3 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-muted">
            Select a conversation
          </p>
          <p className="mt-1 text-xs text-muted">
            Notification activity for each application appears here.
          </p>
        </div>
      </div>
    );
  } else if (timelineQuery.isLoading && !timelineQuery.data) {
    timelineBody = <TimelineSkeleton />;
  } else {
    const candidateName = selectedConversation?.candidateName ?? "Candidate";

    timelineBody = (
      <>
        <header className="sticky top-0 z-10 flex shrink-0 flex-col border-b border-border-subtle bg-surface/95 backdrop-blur-[2px]">
          <div className="flex items-center gap-2 px-3.5 py-3.5 sm:gap-2.5 sm:px-5 sm:py-3.5 lg:px-6">
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
              onClick={closeMobileTimeline}
              aria-label="Back to conversations"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <div className="relative shrink-0">
              <ConversationAvatar name={candidateName} />
              <span
                className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-surface text-resource-guide-icon shadow-sm ring-1 ring-surface sm:hidden"
                title="Verified"
                aria-label="Verified"
              >
                <BadgeCheck className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-foreground">
                  {candidateName}
                </h2>
                <span className="hidden rounded bg-primary-light px-1.5 py-px text-[0.5625rem] font-semibold leading-4 text-primary ring-1 ring-inset ring-primary/20 sm:inline-flex">
                  {statusLabel(selectedConversation?.applicationStatus ?? "")}
                </span>
              </div>
              <p className="truncate text-[0.625rem] font-medium text-muted sm:text-[0.6875rem]">
                {selectedConversation?.jobTitle ?? "Job"}
                {selectedConversation?.publicJobId
                  ? ` - ${selectedConversation.publicJobId}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {actionsPhoneHref ? (
                <a
                  href={actionsPhoneHref}
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-primary lg:size-9"
                  aria-label="Call candidate"
                >
                  <Phone className="size-5" aria-hidden="true" />
                </a>
              ) : (
                <span
                  className="inline-flex size-11 items-center justify-center rounded-full text-muted/40 lg:size-9"
                  aria-hidden="true"
                  title="Phone unavailable"
                >
                  <Phone className="size-5" aria-hidden="true" />
                </span>
              )}
              <ActionsMenu
                applicationId={selectedApplicationId!}
                phoneHref={actionsPhoneHref}
              />
            </div>
          </div>
        </header>

        <div
          ref={timelineScrollRef}
          onScroll={handleTimelineScroll}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2.5 py-2 scrollbar-thin sm:px-5"
        >
          {timelineQuery.isError ? (
            <div className="flex justify-center py-8">
              <div className="rounded-lg bg-brand-accent/25 px-4 py-2.5 text-center shadow-sm">
                <p className="text-sm font-medium text-muted">
                  Unable to load conversation.
                </p>
                <button
                  type="button"
                  onClick={() => void timelineQuery.refetch()}
                  className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : timelineMessages.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="rounded-lg bg-brand-accent/25 px-3 py-1.5 text-center text-sm text-muted shadow-sm">
                No notification activity yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {timelineGroups.map((group) => (
                <div key={group.key}>
                  <div className="mb-1.5 flex justify-center">
                    <span className="rounded-md bg-brand-accent/30 px-2.5 py-0.5 text-[0.6875rem] font-medium text-foreground/70 shadow-sm">
                      {group.label}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        candidateName={candidateName}
                        employerName={employerName}
                        employerImageUrl={employerImageUrl}
                      />
                    ))}
                  </ul>
                </div>
              ))}
              <div ref={timelineEndRef} className="h-px w-full" aria-hidden="true" />
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border-subtle bg-surface/90 px-3 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:pb-1.5">
          <p className="text-center text-[0.6875rem] text-muted">
            This is notification history — not a live chat.
          </p>
        </footer>
      </>
    );
  }

  const isLockedShell = workspaceHeight != null;

  return (
    <div
      ref={workspaceRef}
      style={
        isLockedShell
          ? { height: workspaceHeight, maxHeight: workspaceHeight }
          : undefined
      }
      className={cn(
        "mx-auto flex w-full max-w-[1600px] min-h-0 flex-col px-3 py-3 sm:px-4 lg:px-5",
        isLockedShell
          ? "max-h-dvh overflow-hidden"
          : "overflow-visible pb-[calc(5.875rem+env(safe-area-inset-bottom)+0.75rem)] lg:pb-3",
        "lg:h-[calc(100dvh-4rem)] lg:max-h-[calc(100dvh-4rem)] lg:overflow-hidden",
      )}
    >
      <header
        className={cn(
          "flex shrink-0 flex-wrap items-start justify-between gap-2",
          mobileShowTimeline && "hidden lg:flex",
        )}
      >
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            Messages
          </h1>
          <p className="mt-0.5 text-[11px] leading-snug text-muted sm:text-sm">
            Review hiring notifications for each candidate application in one
            place.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-hero-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:hidden"
        >
          <Filter className="size-3.5" aria-hidden="true" />
          Filters
        </button>
      </header>

      <div
        className={cn(
          "mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(14rem,20%)]",
          isLockedShell
            ? "min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden"
            : "flex-1",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col",
            isLockedShell && "min-h-0 overflow-hidden",
          )}
        >
          <div
            className={cn(
              "shrink-0",
              mobileShowTimeline && "hidden lg:block",
            )}
          >
            <MessagesStatsCards
              totalConversations={totalConversations}
              unreadConversations={unreadTotal}
              activeHiringConversations={activeHiringCount}
              interviewWeekConversations={interviewWeekCount}
            />
          </div>

          <div
            className={cn(
              "mt-2.5 grid gap-0 rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(16rem,31.25%)_minmax(0,1fr)]",
              isLockedShell
                ? "min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden"
                : "flex-1",
              mobileShowTimeline &&
                "mt-0 border-0 shadow-none lg:mt-2.5 lg:border lg:shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
            )}
          >
            <section
              className={cn(
                "min-w-0 flex-col border-border-subtle lg:border-r",
                isLockedShell ? "min-h-0 overflow-hidden" : "overflow-visible",
                mobileShowTimeline ? "hidden lg:flex" : "flex",
              )}
            >
          <div className="shrink-0 border-b border-border-subtle px-2.5 pt-2">
            <div className="flex gap-0.5 overflow-x-auto scrollbar-hidden">
              {(
                [
                  {
                    id: "all" as const,
                    label: "All Conversations",
                    count: totalConversations,
                  },
                  {
                    id: "unread" as const,
                    label: "Unread",
                    count: unreadTotal,
                  },
                  { id: "starred" as const, label: "Starred", count: 0 },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    if (item.id === "unread") {
                      updateFilters({ ...filters, unreadOnly: true });
                    } else if (item.id === "all") {
                      updateFilters({ ...filters, unreadOnly: false });
                    }
                  }}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center gap-1 border-b-2 px-2 py-1.5 text-[11px] font-semibold sm:min-h-11 sm:px-2.5 sm:py-2 sm:text-xs lg:min-h-0 lg:px-2 lg:py-1.5 lg:text-[0.6875rem]",
                    tab === item.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {item.count !== null ? (
                    <span
                      className={cn(
                        "inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[0.5rem] font-bold sm:text-[0.5625rem]",
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

            <div className="relative py-2">
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
                placeholder="Search conversations..."
                className="h-9 w-full rounded-full border border-border-subtle bg-hero-bg py-2 pr-3 pl-9 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-11 sm:text-sm lg:h-8 lg:py-1.5 lg:pl-8 lg:text-xs"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hidden">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "application", label: "Application" },
                  { id: "interview", label: "Interview" },
                  { id: "offer", label: "Offer" },
                  { id: "system", label: "Status" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() =>
                    updateFilters({
                      ...filters,
                      category: chip.id,
                    })
                  }
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs lg:px-2.5 lg:py-0.5 lg:text-[0.625rem]",
                    filters.category === chip.id
                      ? "bg-primary text-surface"
                      : "bg-hero-bg text-muted hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              isLockedShell
                ? "min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
                : "overflow-visible",
            )}
          >
            {tab === "starred" ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Star className="size-7 text-muted" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  Starred conversations coming soon
                </p>
                <p className="text-xs text-muted">
                  Star important candidate threads to find them quickly.
                </p>
              </div>
            ) : conversationsQuery.isLoading && conversations.length === 0 ? (
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
            ) : conversationsQuery.isError ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Unable to load conversations.
                </p>
                <button
                  type="button"
                  onClick={() => void conversationsQuery.refetch()}
                  className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-surface hover:bg-primary-hover"
                >
                  Retry
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <MessageSquare className="size-7 text-muted" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  No conversations yet.
                </p>
                <p className="text-xs text-muted">
                  Application activity will appear here as notifications.
                </p>
              </div>
            ) : (
              <ul>
                {conversations.map((conversation) => {
                  const isActive =
                    conversation.applicationId === selectedApplicationId;
                  return (
                    <li key={conversation.applicationId}>
                      <button
                        type="button"
                        onClick={() => openConversation(conversation)}
                        aria-pressed={isActive}
                        className={cn(
                          "relative flex w-full gap-3 border-b border-border-subtle text-left transition-colors lg:gap-2.5",
                          "min-h-[4.5rem] px-3 py-3 lg:min-h-0 lg:px-2.5 lg:py-2.5",
                          isActive
                            ? "bg-primary-light/50"
                            : "hover:bg-hero-bg",
                          conversation.unreadCount > 0 && !isActive
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
                        <ConversationAvatar name={conversation.candidateName} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate text-xs font-bold text-foreground sm:text-sm lg:text-[0.8125rem]">
                              {conversation.candidateName}
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
                              {conversation.candidatePhone
                                ? ` - ${conversation.candidatePhone}`
                                : ""}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-[0.625rem] font-semibold text-primary lg:hidden">
                            {statusLabel(conversation.applicationStatus)}
                          </span>
                          <span className="mt-0.5 flex items-center justify-between gap-2">
                            <span className="truncate text-[11px] font-normal text-foreground/80 sm:text-xs lg:text-[0.6875rem]">
                              {conversation.latestNotification.title}
                            </span>
                            {conversation.unreadCount > 0 ? (
                              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-pin-state px-1.5 text-[0.625rem] font-bold text-surface lg:min-w-4 lg:px-1 lg:text-[0.5625rem]">
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

          {(conversationsQuery.data?.pagination.totalPages ?? 1) > page ? (
            <div className="shrink-0 border-t border-border-subtle p-2 text-center">
              <button
                type="button"
                disabled={conversationsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-60 lg:min-h-0 lg:text-xs"
              >
                {conversationsQuery.isFetching
                  ? "Loading…"
                  : "Load More Conversations"}
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

        <aside className="hidden min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:flex">
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
