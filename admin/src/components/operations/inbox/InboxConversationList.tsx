import { Search } from "lucide-react";
import type {
  WhatsAppInboxContact,
  WhatsAppInboxConversation,
  WhatsAppInboxFilterType,
} from "../../../types/operations-whatsapp-inbox";
import { cn } from "../../../utils/cn";
import {
  formatInboxTimestamp,
  initialsFromName,
} from "../../../utils/whatsapp-inbox-format";
import { useOperationsTheme } from "../../../providers/theme-provider";
import { OperationsCandidateAvatar } from "../candidates/OperationsCandidateAvatar";
import { OperationsBadge } from "../../ui/OperationsBadge";

interface InboxConversationListProps {
  mode: "conversations" | "contacts";
  items: WhatsAppInboxConversation[];
  contacts: WhatsAppInboxContact[];
  selectedId: string | null;
  search: string;
  filter: WhatsAppInboxFilterType;
  loading: boolean;
  errorMessage: string | null;
  onModeChange: (mode: "conversations" | "contacts") => void;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: WhatsAppInboxFilterType) => void;
  onSelect: (conversation: WhatsAppInboxConversation) => void;
  onSelectContact: (contact: WhatsAppInboxContact) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const FILTERS: Array<{ id: WhatsAppInboxFilterType; label: string }> = [
  { id: "all", label: "All" },
  { id: "job_seeker", label: "Job Seekers" },
  { id: "employer", label: "Employers" },
];

export function InboxConversationList({
  mode,
  items,
  contacts,
  selectedId,
  search,
  filter,
  loading,
  errorMessage,
  onModeChange,
  onSearchChange,
  onFilterChange,
  onSelect,
  onSelectContact,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: InboxConversationListProps) {
  const { theme } = useOperationsTheme();
  const isDark = theme === "dark";
  const panelBg = isDark ? "bg-[#111b21]" : "bg-white";
  const headerBorder = isDark ? "border-[#222d34]" : "border-[#e9edef]";
  const titleClass = isDark ? "text-[#e9edef]" : "text-[#111b21]";
  const mutedClass = isDark ? "text-[#8696a0]" : "text-[#667781]";
  const searchBg = isDark ? "bg-[#202c33]" : "bg-[#f0f2f5]";
  const chipIdle = isDark
    ? "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]"
    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]";
  const chipActive = "bg-[#00a884] text-white";
  const rowHover = isDark ? "hover:bg-[#202c33]" : "hover:bg-[#f5f6f6]";
  const rowSelected = isDark ? "bg-[#2a3942]" : "bg-[#f0f2f5]";
  const divider = isDark ? "divide-[#222d34]" : "divide-[#e9edef]";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col border-r",
        panelBg,
        headerBorder,
      )}
      aria-label="Conversations"
    >
      <div className={cn("border-b px-4 py-3", headerBorder)}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn("text-base font-semibold", titleClass)}>Inbox</h2>
          <div className={cn("flex rounded-lg p-0.5 text-xs", searchBg)}>
            <button
              type="button"
              onClick={() => onModeChange("conversations")}
              className={cn(
                "rounded-md px-2 py-1 font-medium",
                mode === "conversations"
                  ? isDark
                    ? "bg-[#2a3942] text-[#e9edef] shadow-sm"
                    : "bg-white text-[#111b21] shadow-sm"
                  : mutedClass,
              )}
            >
              Chats
            </button>
            <button
              type="button"
              onClick={() => onModeChange("contacts")}
              className={cn(
                "rounded-md px-2 py-1 font-medium",
                mode === "contacts"
                  ? isDark
                    ? "bg-[#2a3942] text-[#e9edef] shadow-sm"
                    : "bg-white text-[#111b21] shadow-sm"
                  : mutedClass,
              )}
            >
              Contacts
            </button>
          </div>
        </div>
        <label
          className={cn(
            "mt-3 flex items-center gap-2 rounded-lg px-3 py-2",
            searchBg,
          )}
        >
          <Search className={cn("size-4 shrink-0", mutedClass)} aria-hidden />
          <span className="sr-only">Search conversations</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={mode === "contacts" ? "Search registered contacts" : "Search name or phone"}
            className={cn(
              "w-full bg-transparent text-sm outline-none",
              titleClass,
              isDark ? "placeholder:text-[#8696a0]" : "placeholder:text-[#667781]",
            )}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Participant filter">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(item.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active ? chipActive : chipIdle,
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && (mode === "contacts" ? contacts.length === 0 : items.length === 0) ? (
          <p className={cn("px-4 py-8 text-sm", mutedClass)}>
            {mode === "contacts" ? "Loading contacts…" : "Loading conversations…"}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="px-4 py-8 text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {!loading && !errorMessage && mode === "conversations" && items.length === 0 ? (
          <p className={cn("px-4 py-8 text-sm", mutedClass)}>
            No saved WhatsApp conversations yet. Open Contacts to choose a registered
            Employer or Job Seeker. History appears only for messages AsliJobs has stored.
          </p>
        ) : null}
        {!loading && !errorMessage && mode === "contacts" && contacts.length === 0 ? (
          <p className={cn("px-4 py-8 text-sm", mutedClass)}>
            No registered contacts match this search.
          </p>
        ) : null}
        <ul className={cn("divide-y", divider)}>
          {mode === "contacts"
            ? contacts.map((contact) => (
                <li key={`${contact.participantType}-${contact.accountId}`}>
                  <button
                    type="button"
                    onClick={() => onSelectContact(contact)}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                      rowHover,
                    )}
                  >
                    <InboxAvatar
                      name={contact.displayName}
                      avatarUrl={contact.avatarUrl}
                      jobSeekerId={
                        contact.participantType === "job_seeker"
                          ? contact.accountId
                          : null
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("block truncate text-sm font-semibold", titleClass)}>
                          {contact.displayName}
                        </span>
                        <span className={cn("shrink-0 text-[11px]", mutedClass)}>
                          {formatInboxTimestamp(contact.lastMessageAt)}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <OperationsBadge
                          variant={
                            contact.participantType === "employer"
                              ? "employer"
                              : "candidate"
                          }
                        >
                          {contact.participantType === "employer"
                            ? "Employer"
                            : "Job Seeker"}
                        </OperationsBadge>
                        {contact.statusLabel ? (
                          <span className={cn("truncate text-[11px]", mutedClass)}>
                            {contact.statusLabel}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", mutedClass)}>
                          {contact.lastMessagePreview || contact.phoneDisplay}
                        </span>
                        {contact.unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[10px] font-semibold text-white">
                            {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            : null}
          {mode === "conversations"
            ? items.map((conversation) => {
            const selected = conversation.id === selectedId;
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                    selected ? rowSelected : rowHover,
                  )}
                >
                  <InboxAvatar
                    name={conversation.displayName}
                    avatarUrl={conversation.avatarUrl}
                    jobSeekerId={conversation.jobSeekerId}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-semibold", titleClass)}>
                          {conversation.displayName}
                        </span>
                        <OperationsBadge
                          variant={
                            conversation.participantType === "employer" ||
                            conversation.participantType === "both"
                              ? "employer"
                              : conversation.participantType === "job_seeker"
                                ? "candidate"
                                : "default"
                          }
                          className="mt-1"
                        >
                          {conversation.participantLabel}
                        </OperationsBadge>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px]",
                          conversation.unreadCount > 0
                            ? "font-medium text-[#25d366]"
                            : mutedClass,
                        )}
                      >
                        {formatInboxTimestamp(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-xs",
                          conversation.unreadCount > 0
                            ? isDark
                              ? "font-medium text-[#e9edef]"
                              : "font-medium text-[#111b21]"
                            : mutedClass,
                        )}
                      >
                        {conversation.lastMessagePreview || "No messages yet"}
                      </span>
                      {conversation.unreadCount > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#25d366] px-1.5 text-[10px] font-semibold text-white">
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })
            : null}
        </ul>
        {hasMore ? (
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-xs font-semibold text-[#00a884] disabled:opacity-60",
                isDark
                  ? "border-[#2a3942] hover:bg-[#202c33]"
                  : "border-[#e9edef] hover:bg-[#f0f2f5]",
              )}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function InboxAvatar({
  name,
  avatarUrl,
  jobSeekerId,
}: {
  name: string;
  avatarUrl?: string;
  jobSeekerId?: string | null;
}) {
  const { theme } = useOperationsTheme();
  const className =
    theme === "dark"
      ? "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6b7c85] text-xs font-semibold text-[#111b21]"
      : "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe5e7] text-xs font-semibold text-[#54656f]";
  if (jobSeekerId && avatarUrl?.includes("/photo")) {
    return (
      <OperationsCandidateAvatar
        name={name}
        jobSeekerId={jobSeekerId}
        photoUrl={avatarUrl}
        className={className}
      />
    );
  }
  if (avatarUrl && /^https?:\/\//i.test(avatarUrl)) {
    return (
      <span className={className} aria-hidden>
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span className={className} aria-hidden>
      {initialsFromName(name)}
    </span>
  );
}
