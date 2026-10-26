import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchWhatsAppInboxContact,
  fetchWhatsAppInboxContacts,
  fetchWhatsAppInboxConversations,
  fetchWhatsAppInboxMessages,
  markWhatsAppInboxRead,
  openWhatsAppInboxConversation,
  sendWhatsAppInboxMessage,
  setWhatsAppInboxBotPaused,
} from "../services/operations-whatsapp-inbox.service";
import type { WhatsAppInboxListParams } from "../types/operations-whatsapp-inbox";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

export const OPERATIONS_WHATSAPP_INBOX_QUERY_KEY = [
  "operations",
  "whatsapp-inbox",
] as const;

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 3) return false;
  return isOperationsSessionTransientError(error);
}

export function useWhatsAppInboxConversations(
  params: WhatsAppInboxListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY, "list", params],
    queryFn: () => fetchWhatsAppInboxConversations(params),
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useWhatsAppInboxContacts(
  params: WhatsAppInboxListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY, "contacts", params],
    queryFn: () => fetchWhatsAppInboxContacts(params),
    staleTime: 30_000,
    retry: shouldRetry,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useOpenWhatsAppInboxConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openWhatsAppInboxConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY, "list"],
      });
    },
  });
}

export function useWhatsAppInboxMessages(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY,
      "messages",
      conversationId,
    ],
    queryFn: () =>
      fetchWhatsAppInboxMessages({
        conversationId: conversationId as string,
        limit: 80,
      }),
    staleTime: 5_000,
    refetchInterval: conversationId ? 8_000 : false,
    refetchOnWindowFocus: true,
    retry: shouldRetry,
    enabled: Boolean(conversationId) && (options?.enabled ?? true),
  });
}

export function useWhatsAppInboxContact(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [
      ...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY,
      "contact",
      conversationId,
    ],
    queryFn: () => fetchWhatsAppInboxContact(conversationId as string),
    staleTime: 30_000,
    retry: shouldRetry,
    enabled: Boolean(conversationId) && (options?.enabled ?? true),
  });
}

export function useMarkWhatsAppInboxRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      markWhatsAppInboxRead(conversationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_WHATSAPP_INBOX_QUERY_KEY,
      });
    },
  });
}

export function useSetWhatsAppInboxBotPaused() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setWhatsAppInboxBotPaused,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: OPERATIONS_WHATSAPP_INBOX_QUERY_KEY,
      });
    },
  });
}

export function useSendWhatsAppInboxMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendWhatsAppInboxMessage,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [
          ...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY,
          "messages",
          variables.conversationId,
        ],
      });
      void queryClient.invalidateQueries({
        queryKey: [...OPERATIONS_WHATSAPP_INBOX_QUERY_KEY, "list"],
      });
    },
  });
}
