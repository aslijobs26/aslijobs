"use client";

import {
  formatNotificationTime,
  notificationIcon,
} from "@/components/notifications/notification-utils";
import { getCandidateInitials } from "@/components/employer-candidates/candidates-ats-utils";
import { ROUTES } from "@/constants/routes";
import {
  fetchConversationTimeline,
  fetchNotificationConversations,
  markConversationNotificationsAsRead,
} from "@/services/notifications.service";
import type {
  EmployerMessageConversation,
  EmployerMessageTimelineItem,
} from "@/types/employer-messages";
import {
  EMPLOYER_APPLICATION_STATUS_LABELS,
  type EmployerApplicationStatus,
} from "@/types/employer-applications";
import type { NotificationType } from "@/types/notifications";
import { cn } from "@/utils/cn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  CalendarDays,
  FileText,
  Gift,
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
type CategoryChip = "all" | "application" | "interview" | "offer" | "system";

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

function daySeparatorLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Older";
  }
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) {
    return "Today";
  }
  if (sameDay(date, yesterday)) {
    return "Yesterday";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(status: string): string {
  if (status in EMPLOYER_APPLICATION_STATUS_LABELS) {
    return EMPLOYER_APPLICATION_STATUS_LABELS[
      status as EmployerApplicationStatus
    ];
  }
  return status || "—";
}

function ConversationAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-surface",
        size === "md" ? "size-11 text-xs" : "size-9 text-[0.625rem]",
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
      <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle bg-surface px-4 py-3">
        <div className="size-11 animate-pulse rounded-full bg-primary-light/50" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-primary-light/50" />
          <div className="h-3 w-56 animate-pulse rounded bg-primary-light/40" />
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-16 max-w-[70%] animate-pulse rounded-lg shadow-sm",
              index % 2 === 0
                ? "mr-auto rounded-tl-none bg-white/70"
                : "ml-auto rounded-tr-none bg-[#d9fdd3]/80",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  candidateName,
}: {
  message: EmployerMessageTimelineItem;
  candidateName: string;
}) {
  const employerSide = isOutgoingTimelineItem(message);
  const Icon = notificationIcon(message.type);
  const badge = notificationBadgeLabel(message.type);

  return (
    <li
      className={cn("flex items-end gap-1.5", employerSide ? "justify-end" : "justify-start")}
    >
      {!employerSide ? (
        <ConversationAvatar name={candidateName} size="sm" />
      ) : null}
      <article
        className={cn(
          "relative max-w-[min(85%,26rem)] px-2.5 pt-1.5 pb-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
          employerSide
            ? "rounded-lg rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
            : "rounded-lg rounded-tl-none bg-white text-[#111b21]",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 pr-1">
          <Icon
            className="size-3.5 shrink-0 text-[#00a884]"
            aria-hidden="true"
          />
          <h3 className="text-[0.8125rem] font-semibold leading-snug">
            {message.title}
          </h3>
          <span className="rounded px-1 py-px text-[0.625rem] font-medium text-[#667781]">
            {badge}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-[0.875rem] leading-[1.35] text-[#111b21]">
          {message.body}
        </p>
        <p className="mt-0.5 flex justify-end pl-8 text-[0.6875rem] leading-none text-[#667781]">
          <span className="pt-1">{formatBubbleTime(message.createdAt)}</span>
        </p>
      </article>
      {employerSide ? (
        <ConversationAvatar name="You" size="sm" />
      ) : null}
    </li>
  );
}

function ActionsMenu({
  applicationId,
  phoneHref,
}: {
  applicationId: string;
  phoneHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const candidateHref = ROUTES.employerCandidateDetail(applicationId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-primary-light hover:text-primary"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 z-20 mt-1 min-w-44 rounded-lg border border-border-subtle bg-surface py-1 shadow-lg">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-hero-bg"
                onClick={() => setOpen(false)}
              >
                Call candidate
              </a>
            ) : null}
            <Link
              href={candidateHref}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-hero-bg"
              onClick={() => setOpen(false)}
            >
              Open candidate profile
            </Link>
            <Link
              href={candidateHref}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-hero-bg"
              onClick={() => setOpen(false)}
            >
              View resume
            </Link>
            <Link
              href={candidateHref}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-hero-bg"
              onClick={() => setOpen(false)}
            >
              Schedule interview
            </Link>
            <Link
              href={candidateHref}
              className="block px-3 py-2 text-xs font-medium text-foreground hover:bg-hero-bg"
              onClick={() => setOpen(false)}
            >
              Send offer
            </Link>
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

  const [tab, setTab] = useState<ConversationTab>("all");
  const [category, setCategory] = useState<CategoryChip>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const [loadedConversations, setLoadedConversations] = useState<
    EmployerMessageConversation[]
  >([]);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<EmployerMessageConversation | null>(null);
  const [mobileShowTimeline, setMobileShowTimeline] = useState(
    Boolean(selectedApplicationId),
  );
  const [actionsPhoneHref, setActionsPhoneHref] = useState<string | null>(null);

  const timelineEndRef = useRef<HTMLDivElement>(null);
  const openingApplicationIdRef = useRef<string | null>(null);
  const hasAppliedInitialSelectionRef = useRef(false);

  const search = useDebouncedValue(searchDraft.trim().replace(/\s+/g, " "), 300);

  useEffect(() => {
    if (selectedApplicationId) {
      setMobileShowTimeline(true);
    }
  }, [selectedApplicationId]);

  useEffect(() => {
    setPage(1);
    setLoadedConversations([]);
  }, [tab, category, search]);

  const conversationsQuery = useQuery({
    queryKey: [
      "employer",
      "messages",
      "conversations",
      tab,
      category,
      search,
      page,
    ],
    queryFn: () =>
      fetchNotificationConversations({
        page,
        limit: 20,
        search: search || undefined,
        readStatus: tab === "unread" ? "unread" : "all",
        category: category === "all" ? "all" : category,
      }),
    enabled: tab !== "starred",
  });

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

  const timelineQuery = useQuery({
    queryKey: [
      "notifications",
      "employer",
      "messages",
      "timeline",
      selectedApplicationId,
    ],
    queryFn: () =>
      fetchConversationTimeline(selectedApplicationId!, {
        page: 1,
        limit: 50,
      }),
    enabled: Boolean(selectedApplicationId),
    refetchInterval: selectedApplicationId ? 12_000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: (applicationId: string) =>
      markConversationNotificationsAsRead(applicationId),
    onSuccess: async (_count, applicationId) => {
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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "notifications",
            "employer",
            "messages",
            "timeline",
            applicationId,
          ],
        }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({
          queryKey: ["employer", "messages", "conversations"],
        }),
      ]);
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
      params.set("applicationId", applicationId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      if (conversation.unreadCount > 0) {
        markReadMutation.mutate(applicationId);
      }
    },
    [markReadMutation, pathname, router, searchParams],
  );

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
      openConversation(pick);
      return;
    }

    if (selectedApplicationId) {
      const stillAvailable =
        conversations.some(
          (item) => item.applicationId === selectedApplicationId,
        ) ||
        selectedSnapshot?.applicationId === selectedApplicationId ||
        openingApplicationIdRef.current === selectedApplicationId;
      if (stillAvailable) {
        return;
      }
    }

    if (
      pick.applicationId === selectedApplicationId ||
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
    selectedSnapshot?.applicationId,
    tab,
  ]);

  const closeMobileTimeline = () => {
    setMobileShowTimeline(false);
  };

  const timelineMessages = useMemo(() => {
    const items = [...(timelineQuery.data?.notifications ?? [])].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );
    return items;
  }, [timelineQuery.data?.notifications]);

  const timelineGroups = useMemo(() => {
    const groups: {
      label: string;
      key: string;
      items: EmployerMessageTimelineItem[];
    }[] = [];
    for (const item of timelineMessages) {
      const label = daySeparatorLabel(item.createdAt);
      const key = dayKey(item.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.items.push(item);
      } else {
        groups.push({ label, key, items: [item] });
      }
    }
    return groups;
  }, [timelineMessages]);

  useEffect(() => {
    if (!selectedApplicationId || timelineMessages.length === 0) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selectedApplicationId, timelineMessages.length, timelineQuery.dataUpdatedAt]);

  const totalConversations = conversationsQuery.data?.pagination.total ?? 0;
  const unreadTotal = conversationsQuery.data?.unreadCount ?? 0;
  const showTimeline = Boolean(selectedApplicationId);

  let timelineBody: ReactNode;
  if (!showTimeline) {
    timelineBody = (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="rounded-lg bg-[#ffeecd]/95 px-5 py-3 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-medium text-[#54656f]">
            Select a conversation
          </p>
          <p className="mt-1 text-xs text-[#667781]">
            Notification activity for each application appears here.
          </p>
        </div>
      </div>
    );
  } else if (timelineQuery.isLoading && !timelineQuery.data) {
    timelineBody = <TimelineSkeleton />;
  } else {
    const candidateName = selectedConversation?.candidateName ?? "Candidate";
    const candidateHref = ROUTES.employerCandidateDetail(selectedApplicationId!);

    timelineBody = (
      <>
        <header className="flex shrink-0 items-start gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 sm:px-4">
          <button
            type="button"
            className="mt-2.5 text-xs font-semibold text-[#00a884] lg:hidden"
            onClick={closeMobileTimeline}
          >
            Back
          </button>
          <ConversationAvatar name={candidateName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-[1rem] font-medium text-[#111b21]">
                {candidateName}
              </h2>
              <span className="rounded-md bg-white px-2 py-0.5 text-[0.625rem] font-semibold text-[#00a884] ring-1 ring-inset ring-[#00a884]/25">
                {statusLabel(selectedConversation?.applicationStatus ?? "")}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-[#667781]">
              {selectedConversation?.jobTitle ?? "Job"}
              {selectedConversation?.publicJobId
                ? ` · ${selectedConversation.publicJobId}`
                : ""}
              {` · App ${selectedApplicationId!.slice(-6).toUpperCase()}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {actionsPhoneHref ? (
              <a
                href={actionsPhoneHref}
                className="inline-flex size-8 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
                aria-label="Call candidate"
              >
                <Phone className="size-4" aria-hidden="true" />
              </a>
            ) : null}
            <Link
              href={candidateHref}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
              aria-label="Open candidate profile"
            >
              <Briefcase className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={candidateHref}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
              aria-label="View resume"
            >
              <FileText className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={candidateHref}
              className="inline-flex size-8 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
              aria-label="Schedule interview"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href={candidateHref}
              className="hidden size-8 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5 sm:inline-flex"
              aria-label="Send offer"
            >
              <Gift className="size-4" aria-hidden="true" />
            </Link>
            <ActionsMenu
              applicationId={selectedApplicationId!}
              phoneHref={actionsPhoneHref}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 scrollbar-hidden sm:px-8">
          {timelineQuery.isError ? (
            <div className="flex justify-center py-12">
              <div className="rounded-lg bg-[#ffeecd]/95 px-5 py-3 text-center shadow-sm">
                <p className="text-sm font-medium text-[#54656f]">
                  Unable to load conversation.
                </p>
                <button
                  type="button"
                  onClick={() => void timelineQuery.refetch()}
                  className="mt-3 rounded-lg bg-[#00a884] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008f72]"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : timelineMessages.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="rounded-lg bg-[#ffeecd]/95 px-4 py-2 text-center text-sm text-[#54656f] shadow-sm">
                No notification activity yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timelineGroups.map((group) => (
                <div key={group.key}>
                  <div className="mb-3 flex justify-center">
                    <span className="rounded-[7.5px] bg-[#ffeecd] px-3 py-1.5 text-[0.75rem] font-medium text-[#54656f] shadow-sm">
                      {group.label}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {group.items.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        candidateName={candidateName}
                      />
                    ))}
                  </ul>
                </div>
              ))}
              <div ref={timelineEndRef} className="h-px w-full" aria-hidden="true" />
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] px-4 py-2.5">
          <p className="text-center text-xs text-[#667781]">
            Notification history for this application — not a live chat.
          </p>
        </footer>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-5 sm:px-5 lg:px-6">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review hiring notifications for each candidate application in one
          place.
        </p>
      </header>

      <div className="mt-4 grid min-h-[min(72dvh,46rem)] flex-1 overflow-hidden rounded-xl border border-border-subtle bg-surface lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section
          className={cn(
            "min-h-0 flex-col border-border-subtle lg:border-r",
            mobileShowTimeline ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="shrink-0 border-b border-border-subtle px-3 pt-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-hidden">
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
                  { id: "starred" as const, label: "Starred", count: null },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs font-semibold",
                    tab === item.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {item.count !== null ? (
                    <span
                      className={cn(
                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[0.625rem] font-bold",
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

            <div className="relative py-3">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search conversations..."
                className="w-full rounded-lg border border-border-subtle bg-hero-bg py-2 pr-3 pl-9 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hidden">
              {(
                [
                  { id: "all" as const, label: "All" },
                  { id: "application" as const, label: "Application" },
                  { id: "interview" as const, label: "Interview" },
                  { id: "offer" as const, label: "Offer" },
                  { id: "system" as const, label: "Status" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategory(chip.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
                    category === chip.id
                      ? "bg-primary text-surface"
                      : "bg-hero-bg text-muted hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
            {tab === "starred" ? (
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                <Star className="size-8 text-muted" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  Starred conversations coming soon
                </p>
                <p className="text-xs text-muted">
                  Star important candidate threads to find them quickly.
                </p>
              </div>
            ) : conversationsQuery.isLoading && conversations.length === 0 ? (
              <ul className="space-y-0 p-2" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <li key={index} className="flex gap-3 rounded-lg px-2 py-3">
                    <div className="size-11 animate-pulse rounded-full bg-primary-light/50" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-3.5 w-2/3 animate-pulse rounded bg-primary-light/50" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-primary-light/40" />
                      <div className="h-3 w-full animate-pulse rounded bg-primary-light/30" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : conversationsQuery.isError ? (
              <div className="px-4 py-12 text-center">
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
              <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
                <MessageSquare className="size-8 text-muted" aria-hidden="true" />
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
                          "flex w-full gap-3 border-b border-border-subtle px-3 py-3 text-left transition-colors",
                          isActive
                            ? "bg-primary-light/40"
                            : "hover:bg-hero-bg",
                          conversation.unreadCount > 0 && !isActive
                            ? "bg-primary-light/15"
                            : "",
                        )}
                      >
                        <ConversationAvatar name={conversation.candidateName} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {conversation.candidateName}
                            </span>
                            <span className="shrink-0 text-[0.6875rem] text-muted">
                              {formatNotificationTime(
                                conversation.lastActivityAt,
                              )}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {conversation.jobTitle}
                            {conversation.publicJobId
                              ? ` · ${conversation.publicJobId}`
                              : ""}
                          </span>
                          <span className="mt-1 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-foreground/80">
                              {conversation.latestNotification.title}
                            </span>
                            {conversation.unreadCount > 0 ? (
                              <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.625rem] font-bold text-surface">
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
            <div className="shrink-0 border-t border-border-subtle p-3 text-center">
              <button
                type="button"
                disabled={conversationsQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
                className="text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-60"
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
            "relative min-h-0 min-w-0 flex-col",
            mobileShowTimeline ? "flex" : "hidden lg:flex",
          )}
          style={{
            backgroundColor: "#e5ddd5",
            backgroundImage: "url('/images/whatsapp-chat-bg.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "420px",
          }}
        >
          {timelineBody}
        </section>
      </div>
    </div>
  );
}
