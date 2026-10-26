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
  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col border-r border-border-subtle bg-surface"
      aria-label="Conversations"
    >
      <div className="border-b border-border-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">Inbox</h2>
          <div className="flex rounded-lg bg-hero-bg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onModeChange("conversations")}
              className={cn(
                "rounded-md px-2 py-1 font-medium",
                mode === "conversations" ? "bg-surface text-foreground shadow-sm" : "text-muted",
              )}
            >
              Chats
            </button>
            <button
              type="button"
              onClick={() => onModeChange("contacts")}
              className={cn(
                "rounded-md px-2 py-1 font-medium",
                mode === "contacts" ? "bg-surface text-foreground shadow-sm" : "text-muted",
              )}
            >
              Contacts
            </button>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-hero-bg px-3 py-2">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="sr-only">Search conversations</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={mode === "contacts" ? "Search registered contacts" : "Search name or phone"}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
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
                  active
                    ? "bg-primary text-white"
                    : "bg-hero-bg text-muted hover:bg-primary-light hover:text-primary",
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
          <p className="px-4 py-8 text-sm text-muted">
            {mode === "contacts" ? "Loading contacts…" : "Loading conversations…"}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="px-4 py-8 text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {!loading && !errorMessage && mode === "conversations" && items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">
            No saved WhatsApp conversations yet. Open Contacts to choose a registered
            Employer or Job Seeker. History appears only for messages AsliJobs has stored.
          </p>
        ) : null}
        {!loading && !errorMessage && mode === "contacts" && contacts.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">
            No registered contacts match this search.
          </p>
        ) : null}
        <ul className="divide-y divide-border-subtle">
          {mode === "contacts"
            ? contacts.map((contact) => (
                <li key={`${contact.participantType}-${contact.accountId}`}>
                  <button
                    type="button"
                    onClick={() => onSelectContact(contact)}
                    className="flex w-full gap-3 px-4 py-3 text-left hover:bg-hero-bg"
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
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {contact.displayName}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted">
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
                          <span className="truncate text-[11px] text-muted">
                            {contact.statusLabel}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted">
                          {contact.lastMessagePreview || contact.phoneDisplay}
                        </span>
                        {contact.unreadCount > 0 ? (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-success px-1.5 text-[10px] font-semibold text-white">
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
                    selected
                      ? "bg-primary-light/70"
                      : "hover:bg-hero-bg",
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
                        <span className="block truncate text-sm font-semibold text-foreground">
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
                      <span className="shrink-0 text-[11px] text-muted">
                        {formatInboxTimestamp(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted">
                        {conversation.lastMessagePreview || "No messages yet"}
                      </span>
                      {conversation.unreadCount > 0 ? (
                        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-success px-1.5 text-[10px] font-semibold text-white">
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
              className="w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-light disabled:opacity-60"
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
  const className =
    "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-semibold text-primary";
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
