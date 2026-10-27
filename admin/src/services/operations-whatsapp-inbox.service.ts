import { apiClient } from "./api-client";
import type {
  InboxDraftTranslateResult,
  InboxMessageTranslationsResult,
  InboxRecipientLanguageResult,
  InboxTranslationLanguageCode,
  InboxViewLanguageCode,
  InboxViewLanguageResult,
  WhatsAppInboxContactDetails,
  WhatsAppInboxContactsResult,
  WhatsAppInboxConversation,
  WhatsAppInboxConversationsResult,
  WhatsAppInboxListParams,
  WhatsAppInboxMessagesResult,
  WhatsAppInboxSendResult,
} from "../types/operations-whatsapp-inbox";

const BASE = "/operations/whatsapp-inbox";

export async function fetchWhatsAppInboxConversations(
  params: WhatsAppInboxListParams,
): Promise<WhatsAppInboxConversationsResult> {
  const response = await apiClient.get<{ data: WhatsAppInboxConversationsResult }>(
    `${BASE}/conversations`,
    {
      params: {
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        participantType: params.participantType,
      },
    },
  );
  const payload = response.data?.data;
  if (!payload || !Array.isArray(payload.items)) {
    throw new Error("WhatsApp Inbox returned an unexpected response.");
  }
  return payload;
}

export async function fetchWhatsAppInboxContacts(
  params: WhatsAppInboxListParams,
): Promise<WhatsAppInboxContactsResult> {
  const response = await apiClient.get<{
    data: WhatsAppInboxContactsResult;
  }>(`${BASE}/contacts`, {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      participantType: params.participantType,
    },
  });
  const payload = response.data?.data;
  if (!payload || !Array.isArray(payload.items)) {
    throw new Error("WhatsApp Inbox contacts returned an unexpected response.");
  }
  return payload;
}

export async function openWhatsAppInboxConversation(input: {
  participantType: "job_seeker" | "employer";
  accountId: string;
}): Promise<WhatsAppInboxConversation> {
  const response = await apiClient.post<{ data: WhatsAppInboxConversation }>(
    `${BASE}/contacts/open`,
    input,
  );
  return response.data.data;
}

export async function fetchWhatsAppInboxConversation(
  conversationId: string,
): Promise<WhatsAppInboxConversation> {
  const response = await apiClient.get<{ data: WhatsAppInboxConversation }>(
    `${BASE}/conversations/${conversationId}`,
  );
  return response.data.data;
}

export async function fetchWhatsAppInboxMessages(input: {
  conversationId: string;
  limit?: number;
  before?: string;
}): Promise<WhatsAppInboxMessagesResult> {
  const response = await apiClient.get<{ data: WhatsAppInboxMessagesResult }>(
    `${BASE}/conversations/${input.conversationId}/messages`,
    {
      params: {
        limit: input.limit ?? 50,
        before: input.before || undefined,
      },
    },
  );
  return response.data.data;
}

export async function fetchWhatsAppInboxContact(
  conversationId: string,
): Promise<WhatsAppInboxContactDetails> {
  const response = await apiClient.get<{ data: WhatsAppInboxContactDetails }>(
    `${BASE}/conversations/${conversationId}/contact`,
  );
  return response.data.data;
}

export async function setWhatsAppInboxBotPaused(input: {
  conversationId: string;
  paused: boolean;
}): Promise<WhatsAppInboxConversation> {
  const response = await apiClient.post<{ data: WhatsAppInboxConversation }>(
    `${BASE}/conversations/${input.conversationId}/bot`,
    { paused: input.paused },
  );
  return response.data.data;
}

export async function markWhatsAppInboxRead(
  conversationId: string,
): Promise<void> {
  await apiClient.post(`${BASE}/conversations/${conversationId}/read`);
}

export async function sendWhatsAppInboxMessage(input: {
  conversationId: string;
  text: string;
  clientMessageId?: string;
}): Promise<WhatsAppInboxSendResult> {
  const response = await apiClient.post<{ data: WhatsAppInboxSendResult }>(
    `${BASE}/conversations/${input.conversationId}/messages`,
    {
      text: input.text,
      clientMessageId: input.clientMessageId || undefined,
    },
  );
  return response.data.data;
}

export async function sendWhatsAppInboxMedia(input: {
  conversationId: string;
  file: File;
  caption?: string;
  clientMessageId?: string;
  onProgress?: (percent: number) => void;
}): Promise<WhatsAppInboxSendResult> {
  const form = new FormData();
  form.append("file", input.file);
  if (input.caption?.trim()) form.append("caption", input.caption.trim());
  if (input.clientMessageId) form.append("clientMessageId", input.clientMessageId);
  const response = await apiClient.post<{ data: WhatsAppInboxSendResult }>(
    `${BASE}/conversations/${input.conversationId}/messages/media`,
    form,
    {
      onUploadProgress: (event) => {
        if (!input.onProgress || !event.total) return;
        input.onProgress(
          Math.min(100, Math.round((event.loaded / event.total) * 100)),
        );
      },
    },
  );
  return response.data.data;
}

export async function fetchWhatsAppInboxMedia(
  conversationId: string,
  messageId: string,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `${BASE}/conversations/${conversationId}/messages/${messageId}/media`,
    { responseType: "blob" },
  );
  return response.data;
}

export async function fetchWhatsAppInboxViewLanguage(
  conversationId: string,
): Promise<InboxViewLanguageResult> {
  const response = await apiClient.get<{ data: InboxViewLanguageResult }>(
    `${BASE}/conversations/${conversationId}/view-language`,
  );
  return response.data.data;
}

export async function setWhatsAppInboxViewLanguage(input: {
  conversationId: string;
  language: InboxViewLanguageCode;
}): Promise<InboxViewLanguageResult> {
  const response = await apiClient.put<{ data: InboxViewLanguageResult }>(
    `${BASE}/conversations/${input.conversationId}/view-language`,
    { language: input.language },
  );
  return response.data.data;
}

export async function fetchWhatsAppInboxRecipientLanguage(
  conversationId: string,
): Promise<InboxRecipientLanguageResult> {
  const response = await apiClient.get<{ data: InboxRecipientLanguageResult }>(
    `${BASE}/conversations/${conversationId}/recipient-language`,
  );
  return response.data.data;
}

export async function translateWhatsAppInboxMessages(input: {
  conversationId: string;
  targetLanguage: InboxTranslationLanguageCode;
  messageIds: string[];
}): Promise<InboxMessageTranslationsResult> {
  const response = await apiClient.post<{ data: InboxMessageTranslationsResult }>(
    `${BASE}/conversations/${input.conversationId}/translations`,
    {
      targetLanguage: input.targetLanguage,
      messageIds: input.messageIds,
    },
  );
  return response.data.data;
}

export async function translateWhatsAppInboxDraft(input: {
  conversationId: string;
  text: string;
  targetLanguage: InboxTranslationLanguageCode;
}): Promise<InboxDraftTranslateResult> {
  const response = await apiClient.post<{ data: InboxDraftTranslateResult }>(
    `${BASE}/conversations/${input.conversationId}/draft-translate`,
    {
      text: input.text,
      targetLanguage: input.targetLanguage,
    },
  );
  return response.data.data;
}
