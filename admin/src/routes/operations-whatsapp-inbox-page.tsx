import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { InboxChatPanel } from "../components/operations/inbox/InboxChatPanel";
import { InboxContactPanel } from "../components/operations/inbox/InboxContactPanel";
import { InboxConversationList } from "../components/operations/inbox/InboxConversationList";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import {
  useMarkWhatsAppInboxRead,
  useOpenWhatsAppInboxConversation,
  useSendWhatsAppInboxMedia,
  useSendWhatsAppInboxMessage,
  useSetWhatsAppInboxBotPaused,
  useWhatsAppInboxContact,
  useWhatsAppInboxContacts,
  useWhatsAppInboxConversations,
  useWhatsAppInboxMessages,
} from "../hooks/use-operations-whatsapp-inbox";
import { fetchWhatsAppInboxMessages } from "../services/operations-whatsapp-inbox.service";
import type {
  WhatsAppInboxContact,
  WhatsAppInboxConversation,
  WhatsAppInboxFilterType,
  WhatsAppInboxMessage,
} from "../types/operations-whatsapp-inbox";
import { cn } from "../utils/cn";

type MobilePane = "list" | "chat" | "details";

function readApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message?.trim()) return message.trim();
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function OperationsWhatsAppInboxPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<WhatsAppInboxFilterType>("all");
  const [mode, setMode] = useState<"conversations" | "contacts">("conversations");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openedConversation, setOpenedConversation] =
    useState<WhatsAppInboxConversation | null>(null);
  const [olderMessages, setOlderMessages] = useState<WhatsAppInboxMessage[]>([]);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("list");
  const [sendError, setSendError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const [conversationPages, setConversationPages] = useState<
    WhatsAppInboxConversation[][]
  >([]);
  const [contactPages, setContactPages] = useState<WhatsAppInboxContact[][]>([]);
  const [contactOpenError, setContactOpenError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setListPage(1);
    setContactPage(1);
    setConversationPages([]);
    setContactPages([]);
  }, [search, filter]);

  const listQuery = useWhatsAppInboxConversations({
    page: listPage,
    limit: 40,
    search,
    participantType: filter,
  });

  const contactsQuery = useWhatsAppInboxContacts(
    {
      page: contactPage,
      limit: 40,
      search,
      participantType: filter,
    },
    { enabled: mode === "contacts" },
  );

  useEffect(() => {
    if (!listQuery.data || listQuery.isPlaceholderData) return;
    setConversationPages((current) => {
      const next = current.slice(0, listPage);
      next[listPage - 1] = listQuery.data?.items ?? [];
      return next;
    });
  }, [listQuery.data, listQuery.isPlaceholderData, listPage]);

  useEffect(() => {
    if (!contactsQuery.data || contactsQuery.isPlaceholderData) return;
    setContactPages((current) => {
      const next = current.slice(0, contactPage);
      next[contactPage - 1] = contactsQuery.data?.items ?? [];
      return next;
    });
  }, [contactsQuery.data, contactsQuery.isPlaceholderData, contactPage]);

  const conversations = useMemo(() => {
    const pages = conversationPages.flat();
    if (pages.length > 0) return pages;
    return listQuery.isPlaceholderData ? [] : (listQuery.data?.items ?? []);
  }, [conversationPages, listQuery.data, listQuery.isPlaceholderData]);
  const contacts = useMemo(() => {
    const pages = contactPages.flat();
    if (pages.length > 0) return pages;
    return contactsQuery.isPlaceholderData ? [] : (contactsQuery.data?.items ?? []);
  }, [contactPages, contactsQuery.data, contactsQuery.isPlaceholderData]);
  const selectedConversation = useMemo(() => {
    return (
      conversations.find((item) => item.id === selectedId) ??
      (openedConversation?.id === selectedId ? openedConversation : null)
    );
  }, [conversations, openedConversation, selectedId]);

  const messagesQuery = useWhatsAppInboxMessages(selectedId);
  const contactQuery = useWhatsAppInboxContact(selectedId);
  const markRead = useMarkWhatsAppInboxRead();
  const sendMessage = useSendWhatsAppInboxMessage();
  const sendMedia = useSendWhatsAppInboxMedia();
  const openConversation = useOpenWhatsAppInboxConversation();
  const setBotPaused = useSetWhatsAppInboxBotPaused();

  useEffect(() => {
    setOlderMessages([]);
    setOlderCursor(null);
    setHasOlder(false);
  }, [selectedId]);

  useEffect(() => {
    if (olderMessages.length > 0) return;
    setHasOlder(Boolean(messagesQuery.data?.hasMore));
    setOlderCursor(messagesQuery.data?.nextBefore ?? null);
  }, [messagesQuery.data?.hasMore, messagesQuery.data?.nextBefore, olderMessages.length]);

  const visibleMessages = useMemo(() => {
    const latest = messagesQuery.data?.items ?? [];
    const seen = new Set<string>();
    return [...olderMessages, ...latest].filter((message) => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    });
  }, [messagesQuery.data?.items, olderMessages]);

  function handleSelect(conversation: WhatsAppInboxConversation) {
    setSelectedId(conversation.id);
    setOpenedConversation(conversation);
    setSendError(null);
    setMobilePane("chat");
    if (conversation.unreadCount > 0) {
      markRead.mutate(conversation.id);
    }
  }

  async function handleSelectContact(contact: WhatsAppInboxContact) {
    setContactOpenError(null);
    try {
      const conversation = await openConversation.mutateAsync({
        participantType: contact.participantType,
        accountId: contact.accountId,
      });
      handleSelect(conversation);
      setMode("conversations");
    } catch (error) {
      setContactOpenError(readApiError(error));
    }
  }

  async function handleLoadOlder() {
    if (!selectedId || !olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await fetchWhatsAppInboxMessages({
        conversationId: selectedId,
        limit: 50,
        before: olderCursor,
      });
      setOlderMessages((current) => [...page.items, ...current]);
      setOlderCursor(page.nextBefore);
      setHasOlder(page.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleSend(text: string, clientMessageId: string) {
    if (!selectedId) return;
    setSendError(null);
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedId,
        text,
        clientMessageId,
      });
    } catch (error) {
      const message = readApiError(error);
      setSendError(message);
      throw error;
    }
  }

  async function handleSendMedia(
    file: File,
    caption: string,
    clientMessageId: string,
    onProgress: (percent: number) => void,
  ) {
    if (!selectedId) return;
    setSendError(null);
    try {
      await sendMedia.mutateAsync({
        conversationId: selectedId,
        file,
        caption,
        clientMessageId,
        onProgress,
      });
    } catch (error) {
      setSendError(readApiError(error));
      throw error;
    }
  }

  return (
    <OperationsLayout
      title="Inbox"
      subtitle="WhatsApp conversations with Job Seekers and Employers"
      density="compact"
    >
      <div className="-mx-2 -my-2 flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden rounded-t-xl border border-border-subtle bg-surface shadow-sm sm:-mx-3 sm:-my-2.5 lg:-mx-3.5">
        <div
          className={cn(
            "h-full min-h-0 w-full shrink-0 border-border-subtle md:w-[320px] md:border-r lg:w-[340px]",
            mobilePane === "list" ? "flex" : "hidden md:flex",
          )}
        >
          <InboxConversationList
            mode={mode}
            items={conversations}
            contacts={contacts}
            selectedId={selectedId}
            search={searchInput}
            filter={filter}
            loading={
              mode === "contacts"
                ? contactsQuery.isLoading ||
                  (contactsQuery.isFetching && contacts.length === 0)
                : listQuery.isLoading ||
                  (listQuery.isFetching && conversations.length === 0)
            }
            errorMessage={
              mode === "contacts"
                ? contactsQuery.isError
                  ? readApiError(contactsQuery.error)
                  : contactOpenError
                : listQuery.isError
                  ? readApiError(listQuery.error)
                  : null
            }
            hasMore={
              mode === "contacts"
                ? contactPage < (contactsQuery.data?.totalPages ?? 1)
                : listPage < (listQuery.data?.totalPages ?? 1)
            }
            loadingMore={
              mode === "contacts"
                ? contactsQuery.isFetching && contactPage > 1
                : listQuery.isFetching && listPage > 1
            }
            onLoadMore={() => {
              if (mode === "contacts") {
                setContactPage((page) => page + 1);
                return;
              }
              setListPage((page) => page + 1);
            }}
            onModeChange={setMode}
            onSearchChange={setSearchInput}
            onFilterChange={setFilter}
            onSelect={handleSelect}
            onSelectContact={(contact) => {
              void handleSelectContact(contact);
            }}
          />
        </div>

        <div
          className={cn(
            "h-full min-h-0 min-w-0 flex-1",
            mobilePane === "details"
              ? "hidden xl:flex"
              : mobilePane === "chat"
                ? "flex"
                : "hidden md:flex",
          )}
        >
          <div className="flex h-full min-h-0 w-full flex-1">
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
              <InboxChatPanel
                conversation={selectedConversation}
                messages={visibleMessages}
                loading={messagesQuery.isLoading}
                errorMessage={
                  messagesQuery.isError ? readApiError(messagesQuery.error) : null
                }
                sending={sendMessage.isPending || sendMedia.isPending}
                sendError={sendError}
                hasOlder={hasOlder}
                loadingOlder={loadingOlder}
                onLoadOlder={() => {
                  void handleLoadOlder();
                }}
                onSend={handleSend}
                onSendMedia={handleSendMedia}
                onToggleBot={
                  selectedId
                    ? () => {
                        setBotPaused.mutate({
                          conversationId: selectedId,
                          paused: !selectedConversation?.botPaused,
                        });
                      }
                    : undefined
                }
                onBack={() => setMobilePane("list")}
                onOpenDetails={() => setMobilePane("details")}
              />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "h-full min-h-0 min-w-0 flex-col xl:flex xl:w-[22.5rem] xl:max-w-[40%] xl:shrink-0 xl:flex-none",
            mobilePane === "details" ? "flex w-full flex-1" : "hidden",
          )}
        >
          <InboxContactPanel
            conversation={selectedConversation}
            contact={contactQuery.data ?? null}
            loading={contactQuery.isLoading}
            onClose={
              mobilePane === "details" ? () => setMobilePane("chat") : undefined
            }
          />
        </div>
      </div>
    </OperationsLayout>
  );
}
