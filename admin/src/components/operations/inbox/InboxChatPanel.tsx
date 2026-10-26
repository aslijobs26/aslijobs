import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Info,
  Paperclip,
  Pause,
  Play,
  SendHorizontal,
  Smile,
} from "lucide-react";
import type {
  WhatsAppInboxConversation,
  WhatsAppInboxMessage,
} from "../../../types/operations-whatsapp-inbox";
import { cn } from "../../../utils/cn";
import {
  formatInboxTimestamp,
  formatMessageTime,
  initialsFromName,
} from "../../../utils/whatsapp-inbox-format";
import whatsappChatBg from "../../../assets/whatsapp-chat-bg.png";
import { OperationsCandidateAvatar } from "../candidates/OperationsCandidateAvatar";
import { OperationsBadge } from "../../ui/OperationsBadge";

interface InboxChatPanelProps {
  conversation: WhatsAppInboxConversation | null;
  messages: WhatsAppInboxMessage[];
  loading: boolean;
  errorMessage: string | null;
  sending: boolean;
  sendError: string | null;
  onSend: (text: string, clientMessageId: string) => Promise<void>;
  hasOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onToggleBot?: () => void;
  onBack?: () => void;
  onOpenDetails?: () => void;
}

export function InboxChatPanel({
  conversation,
  messages,
  loading,
  errorMessage,
  sending,
  sendError,
  onSend,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  onToggleBot,
  onBack,
  onOpenDetails,
}: InboxChatPanelProps) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const inputId = useId();

  useEffect(() => {
    setDraft("");
    stickToBottomRef.current = true;
  }, [conversation?.id]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [conversation?.id, messages]);

  if (!conversation) {
    return (
      <section className="flex h-full min-h-0 flex-col items-center justify-center bg-[#f3f6f7] px-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Select a conversation
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Choose a Job Seeker or Employer thread from the left to view WhatsApp
          history and reply.
        </p>
      </section>
    );
  }

  const canSend =
    conversation.canSendFreeForm &&
    !sending &&
    draft.trim().length > 0 &&
    draft.trim().length <= 4000;

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!conversation || !text || sending || !conversation.canSendFreeForm) {
      return;
    }
    const clientMessageId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      await onSend(text, clientMessageId);
      setDraft("");
    } catch {
      // Draft is preserved on failure.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-[#f3f6f7]">
      <header className="flex h-14 shrink-0 items-center gap-0.5 border-b border-border-subtle bg-surface px-1 sm:h-auto sm:gap-2 sm:px-3 sm:py-2.5">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Conversations"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#54656f] lg:hidden"
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        <ChatHeaderAvatar
          name={conversation.displayName}
          avatarUrl={conversation.avatarUrl}
          jobSeekerId={conversation.jobSeekerId}
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h2 className="truncate text-[0.95rem] font-semibold leading-tight text-foreground">
              {conversation.displayName}
            </h2>
            <OperationsBadge
              className="hidden shrink-0 sm:inline-flex"
              variant={accountBadgeVariant(conversation.participantType)}
            >
              {conversation.participantLabel}
            </OperationsBadge>
          </div>
          <p className="truncate text-[11px] leading-tight text-muted">
            <span className="sm:hidden">
              {conversation.botPaused ? "Human handling" : "Bot active"}
              {" · "}
            </span>
            {conversation.phoneDisplay}
          </p>
        </div>
        <span className="hidden shrink-0 text-[11px] font-medium text-muted sm:inline">
          {conversation.botPaused ? "Human handling" : "Bot active"}
        </span>
        {onToggleBot ? (
          <button
            type="button"
            onClick={onToggleBot}
            aria-label={conversation.botPaused ? "Resume bot" : "Pause bot"}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#54656f] sm:h-9 sm:w-auto sm:gap-1.5 sm:rounded-lg sm:border sm:border-border sm:px-2.5 sm:text-xs sm:font-medium sm:text-foreground"
          >
            {conversation.botPaused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
            <span className="hidden sm:inline">
              {conversation.botPaused ? "Resume bot" : "Pause bot"}
            </span>
          </button>
        ) : null}
        {onOpenDetails ? (
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label="Contact details"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#54656f] sm:h-9 sm:w-auto sm:gap-1.5 sm:rounded-lg sm:border sm:border-border sm:px-2.5 sm:text-xs sm:font-medium sm:text-foreground xl:hidden"
          >
            <Info className="size-4" />
            <span className="hidden sm:inline">Details</span>
          </button>
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage: `url(${whatsappChatBg})`,
            backgroundRepeat: "repeat",
            backgroundSize: "360px",
          }}
        />
        <div
          ref={listRef}
          onScroll={() => {
            const node = listRef.current;
            if (!node) return;
            stickToBottomRef.current =
              node.scrollHeight - node.scrollTop - node.clientHeight < 80;
          }}
          className="scrollbar-hidden relative z-[1] flex h-full min-h-0 flex-col overflow-y-auto px-3 pb-2 pt-3"
          aria-live="polite"
        >
        <div className={cn("flex flex-col gap-2", messages.length > 0 && "mt-auto")}>
        {hasOlder && onLoadOlder ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={loadingOlder}
              className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground disabled:opacity-60"
            >
              {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
            </button>
          </div>
        ) : null}
        {loading && messages.length === 0 ? (
          <p className="text-center text-sm text-muted">Loading messages…</p>
        ) : null}
        {errorMessage ? (
          <p className="text-center text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {!loading && !errorMessage && messages.length === 0 ? (
          <p className="text-center text-sm text-muted">
            No saved WhatsApp messages for this contact. New OTP, notification, bot,
            and admin messages will appear here. Older messages that were never stored
            cannot be reconstructed.
          </p>
        ) : null}
        {messages.map((message) => {
          const outbound = message.direction === "outbound";
          return (
            <div
              key={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm text-[#111b21] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
                  outbound
                    ? "rounded-br-none bg-[#d9fdd3]"
                    : "rounded-bl-none bg-white",
                  message.status === "failed" && "ring-1 ring-danger/40",
                )}
              >
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#667781]">
                  {senderLabel(message.senderType)}
                </p>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
                  <span>{formatMessageTime(message.createdAt)}</span>
                  {outbound ? <StatusTicks status={message.status} /> : null}
                </div>
                {message.status === "failed" && message.failureReason ? (
                  <p className="mt-1 text-[11px] text-danger">
                    Failed to send
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
        </div>
        </div>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="shrink-0 border-t border-border-subtle bg-[#f0f2f5] px-2 py-1.5 sm:bg-surface sm:px-3 sm:py-2.5"
      >
        {!conversation.canSendFreeForm ? (
          <p
            className="mb-1 line-clamp-2 text-[11px] leading-snug text-warning sm:line-clamp-none sm:text-xs"
            role="status"
            title={serviceWindowMessage(conversation)}
          >
            <span className="sm:hidden">{serviceWindowMessageShort(conversation)}</span>
            <span className="hidden sm:inline">{serviceWindowMessage(conversation)}</span>
          </p>
        ) : null}
        {sendError ? (
          <p className="mb-1 text-[11px] text-danger sm:text-xs" role="alert">
            {sendError}
          </p>
        ) : null}
        <div className="flex items-end gap-1">
          <span className="hidden pb-2.5 text-muted sm:inline" aria-hidden>
            <Paperclip className="size-4 opacity-40" />
          </span>
          <label htmlFor={inputId} className="sr-only">
            Type a message
          </label>
          <textarea
            id={inputId}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending || !conversation.canSendFreeForm}
            className="max-h-24 min-h-10 flex-1 resize-none rounded-full border border-border bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-60 sm:max-h-28 sm:rounded-2xl sm:bg-hero-bg"
          />
          <span className="hidden pb-2.5 text-muted sm:inline" aria-hidden>
            <Smile className="size-4 opacity-40" />
          </span>
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition enabled:hover:bg-primary-hover disabled:opacity-40"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

function ChatHeaderAvatar({
  name,
  avatarUrl,
  jobSeekerId,
}: {
  name: string;
  avatarUrl?: string;
  jobSeekerId?: string | null;
}) {
  const className =
    "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#dfe5e7] text-xs font-semibold text-[#54656f]";
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
      <span className={className}>
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return <span className={className}>{initialsFromName(name)}</span>;
}

function accountBadgeVariant(
  participantType: string,
): "employer" | "candidate" | "default" {
  if (participantType === "employer" || participantType === "both") return "employer";
  if (participantType === "job_seeker") return "candidate";
  return "default";
}

function serviceWindowMessageShort(conversation: WhatsAppInboxConversation): string {
  if (conversation.serviceWindow === "expired") {
    return "Reply window closed. The customer must message again.";
  }
  return "Replies open after this customer messages you on WhatsApp.";
}

function serviceWindowMessage(conversation: WhatsAppInboxConversation): string {
  if (conversation.serviceWindow === "expired" && conversation.lastInboundAt) {
    const when = formatInboxTimestamp(conversation.lastInboundAt);
    return when
      ? `The customer last messaged at ${when}. Free-form replies stay closed until they send another WhatsApp message. Pausing the bot does not extend this 24-hour window.`
      : "The customer's last WhatsApp message is older than 24 hours. Free-form replies stay closed until they message again.";
  }
  return "No incoming WhatsApp message from this customer is stored on this server yet. OTP and notification messages do not open the 24-hour reply window. It opens after the customer messages the AsliJobs business number and that webhook is saved here.";
}

function senderLabel(senderType: WhatsAppInboxMessage["senderType"]): string {
  if (senderType === "admin") return "Admin";
  if (senderType === "bot") return "AsliJobs bot";
  if (senderType === "notification") return "AsliJobs";
  return "Customer";
}

function StatusTicks({ status }: { status: WhatsAppInboxMessage["status"] }) {
  if (status === "failed") {
    return <Check className="size-3.5 text-danger" aria-label="Failed" />;
  }
  if (status === "pending") {
    return <Check className="size-3.5 text-[#8696a0]" aria-label="Pending" />;
  }
  if (status === "read") {
    return <CheckCheck className="size-3.5 text-[#53bdeb]" aria-label="Read" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="size-3.5 text-[#8696a0]" aria-label="Delivered" />;
  }
  return <Check className="size-3.5 text-[#8696a0]" aria-label="Sent" />;
}
