import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { EmojiClickData } from "emoji-picker-react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Info,
  Languages,
  LoaderCircle,
  Paperclip,
  Pause,
  Play,
  Smile,
  X,
} from "lucide-react";
import type {
  InboxMessageTranslationItem,
  InboxTranslationLanguageCode,
  WhatsAppInboxConversation,
  WhatsAppInboxMessage,
} from "../../../types/operations-whatsapp-inbox";
import {
  fetchWhatsAppInboxMedia,
  translateWhatsAppInboxDraft,
} from "../../../services/operations-whatsapp-inbox.service";
import { cn } from "../../../utils/cn";
import {
  formatAttachmentSize,
  insertEmojiAtSelection,
  validateInboxAttachment,
} from "../../../utils/whatsapp-inbox-composer";
import {
  formatInboxTimestamp,
  formatMessageTime,
  initialsFromName,
} from "../../../utils/whatsapp-inbox-format";
import whatsappChatBg from "../../../assets/whatsapp-chat-bg.png";
import whatsappChatBgDark from "../../../assets/whatsapp-chat-bg-dark.jpg";
import { useOperationsTheme } from "../../../providers/theme-provider";
import { useInboxChatTranslation } from "../../../hooks/use-inbox-chat-translation";
import {
  inboxLanguageDisplayName,
  type InboxViewLanguage,
} from "../../../constants/inbox-translation-languages";
import {
  applyComposerTranslation,
  editComposerDraft,
  restoreAuthoredDraft,
  shouldApplyDraftTranslation,
  textForNextTranslation,
  translationFailureMessage,
  type ComposerDraftState,
} from "../../../utils/inbox-draft-translation";
import { OperationsCandidateAvatar } from "../candidates/OperationsCandidateAvatar";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { InboxDraftLanguageMenu, InboxTranslateMenu } from "./InboxTranslateMenu";
import { InboxTranslatedBody } from "./InboxTranslatedBody";
import { InboxVoiceMessagePlayer } from "./InboxVoiceMessagePlayer";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

interface InboxChatPanelProps {
  conversation: WhatsAppInboxConversation | null;
  messages: WhatsAppInboxMessage[];
  loading: boolean;
  errorMessage: string | null;
  sending: boolean;
  sendError: string | null;
  onSend: (text: string, clientMessageId: string) => Promise<void>;
  onSendMedia: (
    file: File,
    caption: string,
    clientMessageId: string,
    onProgress: (percent: number) => void,
  ) => Promise<void>;
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
  onSendMedia,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  onToggleBot,
  onBack,
  onOpenDetails,
}: InboxChatPanelProps) {
  const [draft, setDraft] = useState("");
  const [originalDraft, setOriginalDraft] = useState<string | null>(null);
  const [draftMode, setDraftMode] = useState<"original" | "translated">(
    "original",
  );
  const [draftTargetLanguage, setDraftTargetLanguage] =
    useState<InboxTranslationLanguageCode | null>(null);
  const [lastTranslatedText, setLastTranslatedText] = useState<string | null>(
    null,
  );
  const draftRequestRef = useRef(0);
  const conversationIdRef = useRef<string | null>(conversation?.id ?? null);
  const draftStateRef = useRef({
    draft: "",
    originalDraft: null as string | null,
    draftMode: "original" as "original" | "translated",
    draftTargetLanguage: null as InboxTranslationLanguageCode | null,
    lastTranslatedText: null as string | null,
  });
  const [draftTranslateBusy, setDraftTranslateBusy] = useState(false);
  const [draftTranslateError, setDraftTranslateError] = useState<string | null>(
    null,
  );
  const [draftLanguageMenuOpen, setDraftLanguageMenuOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftTranslateButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiRootRef = useRef<HTMLFormElement | null>(null);
  const inputId = useId();
  const emojiPanelId = useId();
  const { theme } = useOperationsTheme();
  const isDarkTheme = theme === "dark";
  const chatPaneBg = isDarkTheme ? "bg-[#0b141a]" : "bg-[#efeae2]";
  const chatWallpaper = isDarkTheme ? whatsappChatBgDark : whatsappChatBg;
  const translation = useInboxChatTranslation({
    conversationId: conversation?.id ?? null,
    messages,
    scrollRoot,
  });

  conversationIdRef.current = conversation?.id ?? null;
  draftStateRef.current = {
    draft,
    originalDraft,
    draftMode,
    draftTargetLanguage,
    lastTranslatedText,
  };

  useEffect(() => {
    draftRequestRef.current += 1;
    setDraft("");
    setOriginalDraft(null);
    setDraftMode("original");
    setDraftTargetLanguage(null);
    setLastTranslatedText(null);
    setDraftTranslateBusy(false);
    setDraftTranslateError(null);
    setDraftLanguageMenuOpen(false);
    setAttachment(null);
    setAttachmentError(null);
    setEmojiOpen(false);
    setUploadProgress(null);
    stickToBottomRef.current = true;
  }, [conversation?.id]);

  useEffect(() => {
    if (!emojiOpen) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!emojiRootRef.current?.contains(event.target as Node)) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [emojiOpen]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [conversation?.id, messages]);

  if (!conversation) {
    return (
      <section
        className={cn(
          "flex h-full min-h-0 flex-col items-center justify-center px-6 text-center",
          isDarkTheme ? "bg-[#0b141a]" : "bg-[#f3f6f7]",
        )}
      >
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

  const caption = draft.trim();
  const captionTooLong = attachment ? caption.length > 1024 : caption.length > 4000;
  const canSend =
    conversation.canSendFreeForm &&
    !sending &&
    !captionTooLong &&
    (attachment !== null || (caption.length > 0 && caption.length <= 4000));

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!conversation || sending || !conversation.canSendFreeForm || !canSend) {
      return;
    }
    const clientMessageId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      if (attachment) {
        setUploadProgress(0);
        await onSendMedia(attachment, caption, clientMessageId, setUploadProgress);
        setAttachment(null);
        setAttachmentError(null);
        setUploadProgress(null);
      } else {
        await onSend(caption, clientMessageId);
      }
      setDraft("");
      setOriginalDraft(null);
      setDraftMode("original");
      setDraftTargetLanguage(null);
      setLastTranslatedText(null);
      setDraftTranslateError(null);
      setEmojiOpen(false);
    } catch {
      setUploadProgress(null);
    }
  }

  function composerState(): ComposerDraftState {
    return {
      draft,
      authoredText: originalDraft ?? draft,
      mode: draftMode,
      targetLanguage: draftTargetLanguage,
      lastTranslatedText,
    };
  }

  function currentComposerState(): ComposerDraftState {
    const current = draftStateRef.current;
    return {
      draft: current.draft,
      authoredText: current.originalDraft ?? current.draft,
      mode: current.draftMode,
      targetLanguage: current.draftTargetLanguage,
      lastTranslatedText: current.lastTranslatedText,
    };
  }

  function commitComposer(next: ComposerDraftState) {
    setDraft(next.draft);
    setOriginalDraft(next.mode === "translated" ? next.authoredText : null);
    setDraftMode(next.mode);
    setDraftTargetLanguage(next.targetLanguage);
    setLastTranslatedText(next.lastTranslatedText);
  }

  function openDraftLanguageMenu() {
    if (!draft.trim() || draftTranslateBusy || attachment) return;
    setEmojiOpen(false);
    setDraftTranslateError(null);
    setDraftLanguageMenuOpen((open) => !open);
  }

  async function translateDraft(language: InboxTranslationLanguageCode) {
    if (!conversation || draftTranslateBusy || attachment) return;
    const source = textForNextTranslation(composerState()).trim();
    if (!source) return;
    const requestId = draftRequestRef.current + 1;
    draftRequestRef.current = requestId;
    const requestConversationId = conversation.id;
    setDraftLanguageMenuOpen(false);
    setDraftTranslateBusy(true);
    setDraftTranslateError(null);
    try {
      const result = await translateWhatsAppInboxDraft({
        conversationId: requestConversationId,
        text: source,
        targetLanguage: language,
      });
      const stillCurrent = shouldApplyDraftTranslation({
        requestId,
        activeRequestId: draftRequestRef.current,
        requestConversationId,
        activeConversationId: conversationIdRef.current,
        sourceSnapshot: source,
        state: currentComposerState(),
      });
      if (!stillCurrent) return;
      if (result.failed) {
        setDraftTranslateError(translationFailureMessage(result.errorCode));
        return;
      }
      if (result.skipped || result.translatedText.trim() === source) {
        setDraftTranslateError(
          `This draft is already in ${inboxLanguageDisplayName(language)}.`,
        );
        return;
      }
      commitComposer(
        applyComposerTranslation(currentComposerState(), result.translatedText, language),
      );
    } catch {
      if (
        draftRequestRef.current !== requestId ||
        conversationIdRef.current !== requestConversationId
      ) {
        return;
      }
      setDraftTranslateError(translationFailureMessage());
    } finally {
      if (draftRequestRef.current === requestId) {
        setDraftTranslateBusy(false);
      }
    }
  }

  function restoreOriginalDraft() {
    const restored = restoreAuthoredDraft(composerState());
    if (restored.draft === draft && draftMode === "original") return;
    commitComposer(restored);
    setDraftTranslateError(null);
  }

  function insertEmoji(emoji: string) {
    const node = textareaRef.current;
    const start = node?.selectionStart ?? draft.length;
    const end = node?.selectionEnd ?? draft.length;
    const next = insertEmojiAtSelection(draft, start, end, emoji);
    commitComposer(editComposerDraft(composerState(), next.value));
    requestAnimationFrame(() => {
      node?.focus();
      node?.setSelectionRange(next.cursor, next.cursor);
    });
  }

  function handleEmojiClick(data: EmojiClickData) {
    insertEmoji(data.emoji);
  }

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    const error = validateInboxAttachment({ type: file.type, size: file.size });
    if (error) {
      setAttachmentError(error);
      return;
    }
    setAttachmentError(null);
    setAttachment(file);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col @container/inbox-chat",
        chatPaneBg,
      )}
    >
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border-subtle bg-surface px-2 @min-[40rem]/inbox-chat:gap-2 @min-[40rem]/inbox-chat:px-3">
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
              className="hidden shrink-0 @min-[28rem]/inbox-chat:inline-flex"
              variant={accountBadgeVariant(conversation.participantType)}
            >
              {conversation.participantLabel}
            </OperationsBadge>
          </div>
          {conversation.secondaryDisplayName?.trim() ? (
            <p className="truncate text-[11px] font-normal leading-tight text-muted">
              {conversation.secondaryDisplayName.trim()}
            </p>
          ) : null}
          <p className="truncate text-[11px] leading-tight text-muted">
            <span className="@min-[40rem]/inbox-chat:hidden">
              {conversation.botPaused ? "Human handling" : "Bot active"}
              {" · "}
            </span>
            {conversation.phoneDisplay}
          </p>
        </div>
        <span className="hidden shrink-0 text-[11px] font-medium text-muted @min-[40rem]/inbox-chat:inline">
          {conversation.botPaused ? "Human handling" : "Bot active"}
        </span>
        <InboxTranslateMenu
          language={translation.viewLanguage}
          disabled={translation.preferenceLoading}
          onSelect={(language: InboxViewLanguage) => {
            void translation.selectViewLanguage(language);
          }}
        />
        {onToggleBot ? (
          <button
            type="button"
            onClick={onToggleBot}
            aria-label={conversation.botPaused ? "Resume bot" : "Pause bot"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#54656f] @min-[40rem]/inbox-chat:h-9 @min-[40rem]/inbox-chat:w-auto @min-[40rem]/inbox-chat:gap-1.5 @min-[40rem]/inbox-chat:rounded-lg @min-[40rem]/inbox-chat:border @min-[40rem]/inbox-chat:border-border @min-[40rem]/inbox-chat:px-2.5 @min-[40rem]/inbox-chat:text-xs @min-[40rem]/inbox-chat:font-medium @min-[40rem]/inbox-chat:text-foreground"
          >
            {conversation.botPaused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
            <span className="hidden @min-[40rem]/inbox-chat:inline">
              {conversation.botPaused ? "Resume bot" : "Pause bot"}
            </span>
          </button>
        ) : null}
        {onOpenDetails ? (
          <button
            type="button"
            onClick={onOpenDetails}
            aria-label="Contact details"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[#54656f] @min-[40rem]/inbox-chat:h-9 @min-[40rem]/inbox-chat:w-auto @min-[40rem]/inbox-chat:gap-1.5 @min-[40rem]/inbox-chat:rounded-lg @min-[40rem]/inbox-chat:border @min-[40rem]/inbox-chat:border-border @min-[40rem]/inbox-chat:px-2.5 @min-[40rem]/inbox-chat:text-xs @min-[40rem]/inbox-chat:font-medium @min-[40rem]/inbox-chat:text-foreground @min-[72rem]/inbox-chat:hidden"
          >
            <Info className="size-4" />
            <span className="hidden @min-[40rem]/inbox-chat:inline">Details</span>
          </button>
        ) : null}
      </header>

      <div className={cn("relative min-h-0 flex-1 overflow-hidden", chatPaneBg)}>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            isDarkTheme ? "opacity-[0.55]" : "opacity-[0.42]",
          )}
          style={{
            backgroundImage: `url(${chatWallpaper})`,
            backgroundRepeat: "repeat",
            backgroundSize: "320px",
            backgroundPosition: "center top",
          }}
        />
        <div
          ref={(node) => {
            listRef.current = node;
            setScrollRoot(node);
          }}
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
              data-message-id={message.id}
              className={cn("flex", outbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "min-w-0 max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
                  isDarkTheme ? "text-[#e9edef]" : "text-[#111b21]",
                  outbound
                    ? isDarkTheme
                      ? "rounded-br-none bg-[#005c4b]"
                      : "rounded-br-none bg-[#d9fdd3]"
                    : isDarkTheme
                      ? "rounded-bl-none bg-[#202c33]"
                      : "rounded-bl-none bg-white",
                  message.status === "failed" && "ring-1 ring-danger/40",
                )}
              >
                <p
                  className={cn(
                    "mb-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    isDarkTheme ? "text-[#8696a0]" : "text-[#667781]",
                  )}
                >
                  {senderLabel(message.senderType)}
                </p>
                <MessageContent
                  conversationId={conversation.id}
                  message={message}
                  translation={translation.getTranslation(message.id)}
                  showOriginal={translation.showOriginalIds.has(message.id)}
                  onToggleOriginal={() =>
                    translation.toggleShowOriginal(message.id)
                  }
                  onRetryTranslation={() => translation.retryMessage(message.id)}
                />
                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[11px]",
                    isDarkTheme ? "text-[#8696a0]" : "text-[#667781]",
                  )}
                >
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
        ref={emojiRootRef}
        onSubmit={(event) => void handleSubmit(event)}
        className={cn(
          "relative shrink-0 border-t px-2 py-1.5 sm:px-3 sm:py-2.5",
          isDarkTheme
            ? "border-[#222d34] bg-[#1f2c34]"
            : "border-[#e9edef] bg-[#f0f2f5]",
        )}
      >
        {!conversation.canSendFreeForm ? (
          <p
            className="mb-1 line-clamp-2 text-[11px] leading-snug text-warning"
            role="status"
            title={serviceWindowMessage(conversation)}
          >
            {serviceWindowMessage(conversation)}
          </p>
        ) : null}
        {sendError ||
        attachmentError ||
        captionTooLong ||
        draftTranslateError ? (
          <p className="mb-1 text-[11px] text-danger sm:text-xs" role="alert">
            {attachmentError ||
              draftTranslateError ||
              (captionTooLong
                ? "Message is too long for WhatsApp."
                : sendError)}
          </p>
        ) : null}
        {draftMode === "translated" && originalDraft != null ? (
          <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>
              {draftTargetLanguage
                ? `Draft translated to ${inboxLanguageDisplayName(draftTargetLanguage)}. Review before sending.`
                : "You edited this translation. Review before sending."}
            </span>
            <button
              type="button"
              onClick={restoreOriginalDraft}
              className="font-medium text-[#027eb5] underline"
            >
              Show original draft
            </button>
          </div>
        ) : null}
        {attachment ? (
          <div
            className={cn(
              "mb-1 flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs",
              isDarkTheme
                ? "border-[#2a3942] bg-[#2a3942] text-[#e9edef]"
                : "border-border bg-white",
            )}
          >
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate font-medium",
                  isDarkTheme ? "text-[#e9edef]" : "text-foreground",
                )}
              >
                {attachment.name}
              </p>
              <p className={isDarkTheme ? "text-[#8696a0]" : "text-muted"}>
                {attachment.type || "file"} · {formatAttachmentSize(attachment.size)}
                {uploadProgress !== null ? ` · ${uploadProgress}%` : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label="Remove attachment"
              disabled={sending}
              onClick={() => {
                setAttachment(null);
                setAttachmentError(null);
                setUploadProgress(null);
              }}
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40",
                isDarkTheme
                  ? "text-[#aebac1] hover:bg-[#182229]"
                  : "text-muted hover:bg-hero-bg",
              )}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <div className="relative flex min-w-0 items-center gap-0.5 @min-[28rem]/inbox-chat:gap-1">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-label="Choose a file"
            accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,audio/mpeg,audio/mp4,audio/ogg,audio/aac,audio/amr,video/mp4,video/3gpp"
            disabled={sending || !conversation.canSendFreeForm}
            onChange={(event) => {
              handleFileChange(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Attach file"
            disabled={sending || !conversation.canSendFreeForm}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed @min-[28rem]/inbox-chat:size-10",
              isDarkTheme
                ? "text-[#aebac1] hover:bg-[#2a3942]"
                : "text-[#54656f] hover:bg-white",
            )}
          >
            <Paperclip className="size-5 @min-[28rem]/inbox-chat:size-6" strokeWidth={1.75} />
          </button>
          <label htmlFor={inputId} className="sr-only">
            Type a message
          </label>
          <textarea
            ref={textareaRef}
            id={inputId}
            rows={1}
            value={draft}
            onChange={(event) =>
              commitComposer(editComposerDraft(composerState(), event.target.value))
            }
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending || !conversation.canSendFreeForm}
            className={cn(
              "max-h-24 min-h-9 min-w-0 flex-1 resize-none rounded-lg border-0 px-3 py-2 text-sm outline-none disabled:opacity-60 @min-[28rem]/inbox-chat:min-h-10 @min-[28rem]/inbox-chat:max-h-28",
              isDarkTheme
                ? "bg-[#2a3942] text-[#e9edef] placeholder:text-[#8696a0]"
                : "bg-white text-[#111b21] placeholder:text-[#667781]",
            )}
          />
          <div>
            {emojiOpen ? (
              <div
                id={emojiPanelId}
                className={cn(
                  "absolute bottom-full left-2 z-30 mb-2 w-[min(20rem,calc(100%-1rem))] overflow-hidden rounded-xl border shadow-lg [--epr-category-icon-active-color:#00a884] [--epr-highlight-color:#00a884]",
                  isDarkTheme
                    ? "border-[#2a3942] bg-[#202c33] [--epr-bg-color:#202c33] [--epr-category-label-bg-color:#202c33] [--epr-text-color:#e9edef] [--epr-hover-bg-color:#2a3942] [--epr-focus-bg-color:#005c4b] [--epr-search-input-bg-color:#2a3942]"
                    : "border-[#e9edef] bg-white [--epr-hover-bg-color:#f0f2f5] [--epr-focus-bg-color:#e7fce3]",
                )}
              >
                <Suspense
                  fallback={
                    <p className="px-3 py-6 text-center text-xs text-muted">
                      Loading emojis...
                    </p>
                  }
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height={320}
                    lazyLoadEmojis
                    previewConfig={{ showPreview: false }}
                    theme={isDarkTheme ? "dark" : "light"}
                  />
                </Suspense>
              </div>
            ) : null}
            <button
              type="button"
              aria-label={emojiOpen ? "Close emoji picker" : "Open emoji picker"}
              aria-expanded={emojiOpen}
              aria-controls={emojiPanelId}
              disabled={sending || !conversation.canSendFreeForm}
              onClick={() => setEmojiOpen((open) => !open)}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed @min-[28rem]/inbox-chat:size-10",
                isDarkTheme ? "hover:bg-[#2a3942]" : "hover:bg-white",
                emojiOpen
                  ? "text-[#00a884]"
                  : isDarkTheme
                    ? "text-[#aebac1]"
                    : "text-[#54656f]",
              )}
            >
              <Smile className="size-5 @min-[28rem]/inbox-chat:size-6" strokeWidth={1.75} />
            </button>
          </div>
          <div className="relative shrink-0">
            <InboxDraftLanguageMenu
              open={draftLanguageMenuOpen}
              anchorRef={draftTranslateButtonRef}
              onClose={() => setDraftLanguageMenuOpen(false)}
              onSelect={(language) => void translateDraft(language)}
            />
            <button
              ref={draftTranslateButtonRef}
              type="button"
              aria-label="Translate draft"
              aria-haspopup="menu"
              aria-expanded={draftLanguageMenuOpen}
              disabled={
                sending ||
                !conversation.canSendFreeForm ||
                draftTranslateBusy ||
                !draft.trim() ||
                Boolean(attachment)
              }
              onClick={openDraftLanguageMenu}
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed @min-[40rem]/inbox-chat:h-9 @min-[40rem]/inbox-chat:w-auto @min-[40rem]/inbox-chat:gap-1 @min-[40rem]/inbox-chat:px-2 @min-[40rem]/inbox-chat:text-xs @min-[40rem]/inbox-chat:font-medium",
                isDarkTheme
                  ? "text-[#aebac1] hover:bg-[#2a3942] disabled:opacity-50"
                  : "text-[#54656f] hover:bg-white disabled:opacity-50",
                draftMode === "translated" && "text-[#00a884]",
              )}
            >
              {draftTranslateBusy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Languages className="size-4" aria-hidden="true" />
              )}
              <span className="hidden @min-[40rem]/inbox-chat:inline">Translate</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white transition enabled:hover:bg-[#008069] disabled:cursor-not-allowed @min-[28rem]/inbox-chat:size-10"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                fill="currentColor"
                d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"
              />
            </svg>
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

function MessageContent({
  conversationId,
  message,
  translation,
  showOriginal,
  onToggleOriginal,
  onRetryTranslation,
}: {
  conversationId: string;
  message: WhatsAppInboxMessage;
  translation: (InboxMessageTranslationItem & { loading?: boolean }) | null;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  onRetryTranslation: () => void;
}) {
  const isMedia = ["image", "document", "audio", "video"].includes(message.messageType);
  const hideBody =
    message.hasMedia &&
    (message.body === "[Image]" ||
      message.body === "[Audio]" ||
      message.body === "[Video]" ||
      message.body === "[Voice message]" ||
      message.body.startsWith("[Document]"));

  return (
    <div className="space-y-1">
      {isMedia ? (
        <InboxMedia conversationId={conversationId} message={message} />
      ) : null}
      {message.body && !hideBody ? (
        <InboxTranslatedBody
          originalBody={message.body}
          translation={translation}
          showOriginal={showOriginal}
          onToggleOriginal={onToggleOriginal}
          onRetry={onRetryTranslation}
        />
      ) : null}
    </div>
  );
}

function InboxMedia({
  conversationId,
  message,
}: {
  conversationId: string;
  message: WhatsAppInboxMessage;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!message.hasMedia || (message.messageType !== "image" && message.messageType !== "video")) {
      return;
    }
    let objectUrl = "";
    let cancelled = false;
    void fetchWhatsAppInboxMedia(conversationId, message.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("This file could not be retrieved.");
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [conversationId, message.hasMedia, message.id, message.messageType]);

  if (!message.hasMedia) {
    return (
      <p className="text-xs text-[#667781]">
        File unavailable. The WhatsApp media reference was not stored.
      </p>
    );
  }

  if (error) {
    return <p className="text-xs text-danger">{error}</p>;
  }

  if (
    (message.messageType === "image" || message.messageType === "video") &&
    !previewUrl
  ) {
    return <p className="text-xs text-[#667781]">Loading file...</p>;
  }

  if (message.messageType === "image" && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={message.mediaFileName || "WhatsApp image"}
        className="max-h-64 max-w-full rounded-md object-contain"
      />
    );
  }

  if (message.messageType === "video" && previewUrl) {
    return (
      <video src={previewUrl} controls className="max-h-64 max-w-full rounded-md" />
    );
  }

  if (message.messageType === "audio") {
    return (
      <InboxVoiceMessagePlayer
        conversationId={conversationId}
        messageId={message.id}
        mediaMimeType={message.mediaMimeType}
        outbound={message.direction === "outbound"}
      />
    );
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const blob = await fetchWhatsAppInboxMedia(conversationId, message.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = message.mediaFileName || "whatsapp-file";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("This file could not be retrieved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void download()}
      disabled={busy}
      className="max-w-full break-all text-left text-xs font-medium text-[#027eb5] underline disabled:opacity-60"
    >
      {busy ? "Opening file..." : message.mediaFileName || "Download file"}
    </button>
  );
}
