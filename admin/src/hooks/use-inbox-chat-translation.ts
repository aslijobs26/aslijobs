import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchWhatsAppInboxViewLanguage,
  setWhatsAppInboxViewLanguage,
  translateWhatsAppInboxMessages,
} from "../services/operations-whatsapp-inbox.service";
import type {
  InboxMessageTranslationItem,
  InboxTranslationLanguageCode,
  InboxViewLanguageCode,
  WhatsAppInboxMessage,
} from "../types/operations-whatsapp-inbox";
import {
  isTranslatableInboxMessage,
  translationCacheKey,
} from "../utils/inbox-translation";
import { isInboxViewLanguage } from "../constants/inbox-translation-languages";

type TranslationEntry = InboxMessageTranslationItem & {
  loading?: boolean;
};

export function useInboxChatTranslation(input: {
  conversationId: string | null;
  messages: WhatsAppInboxMessage[];
  scrollRoot: HTMLElement | null;
}) {
  const [viewLanguage, setViewLanguage] =
    useState<InboxViewLanguageCode>("original");
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [translations, setTranslations] = useState<
    Record<string, TranslationEntry>
  >({});
  const [showOriginalIds, setShowOriginalIds] = useState<Set<string>>(
    () => new Set(),
  );
  const inFlightRef = useRef<Set<string>>(new Set());
  const translationsRef = useRef(translations);
  const messagesRef = useRef(input.messages);
  const requestGenerationRef = useRef(0);
  const visibleIdsRef = useRef<Set<string>>(new Set());

  translationsRef.current = translations;
  messagesRef.current = input.messages;

  useEffect(() => {
    requestGenerationRef.current += 1;
    setTranslations({});
    setShowOriginalIds(new Set());
    inFlightRef.current.clear();
    visibleIdsRef.current.clear();
    setViewLanguage("original");

    if (!input.conversationId) return;

    let cancelled = false;
    const generation = requestGenerationRef.current;
    setPreferenceLoading(true);
    void fetchWhatsAppInboxViewLanguage(input.conversationId)
      .then((result) => {
        if (cancelled || generation !== requestGenerationRef.current) return;
        if (isInboxViewLanguage(result.language)) {
          setViewLanguage(result.language);
        }
      })
      .catch(() => {
        if (!cancelled && generation === requestGenerationRef.current) {
          setViewLanguage("original");
        }
      })
      .finally(() => {
        if (!cancelled && generation === requestGenerationRef.current) {
          setPreferenceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [input.conversationId]);

  const requestTranslations = useCallback(
    async (messageIds: string[], language: InboxTranslationLanguageCode) => {
      const conversationId = input.conversationId;
      if (!conversationId || messageIds.length === 0) return;
      const generation = requestGenerationRef.current;
      const eligible = messageIds.filter((id) => {
        const message = messagesRef.current.find((row) => row.id === id);
        if (!message || !isTranslatableInboxMessage(message)) return false;
        const key = translationCacheKey(conversationId, id, language);
        if (inFlightRef.current.has(key)) return false;
        const existing = translationsRef.current[key];
        if (
          existing &&
          !existing.loading &&
          (existing.status === "ready" || existing.status === "same_language")
        ) {
          return false;
        }
        if (existing?.loading) return false;
        return true;
      });
      if (eligible.length === 0) return;

      for (const id of eligible) {
        inFlightRef.current.add(
          translationCacheKey(conversationId, id, language),
        );
      }

      setTranslations((current) => {
        const next = { ...current };
        for (const id of eligible) {
          const key = translationCacheKey(conversationId, id, language);
          next[key] = {
            messageId: id,
            targetLanguage: language,
            status: current[key]?.status ?? "ready",
            translatedText: current[key]?.translatedText ?? null,
            sourceLanguage: current[key]?.sourceLanguage ?? null,
            cached: Boolean(current[key]?.cached),
            loading: true,
          };
        }
        return next;
      });

      try {
        const result = await translateWhatsAppInboxMessages({
          conversationId,
          targetLanguage: language,
          messageIds: eligible,
        });
        if (generation !== requestGenerationRef.current) return;
        setTranslations((current) => {
          const next = { ...current };
          for (const item of result.items) {
            const key = translationCacheKey(
              conversationId,
              item.messageId,
              language,
            );
            next[key] = { ...item, loading: false };
          }
          return next;
        });
      } catch {
        if (generation !== requestGenerationRef.current) return;
        setTranslations((current) => {
          const next = { ...current };
          for (const id of eligible) {
            const key = translationCacheKey(conversationId, id, language);
            next[key] = {
              messageId: id,
              targetLanguage: language,
              status: "failed",
              translatedText: null,
              sourceLanguage: null,
              cached: false,
              loading: false,
              errorCode: "request_failed",
            };
          }
          return next;
        });
      } finally {
        for (const id of eligible) {
          inFlightRef.current.delete(
            translationCacheKey(conversationId, id, language),
          );
        }
      }
    },
    [input.conversationId],
  );

  useEffect(() => {
    if (!input.conversationId || viewLanguage === "original") return;
    const visible = [...visibleIdsRef.current];
    if (visible.length > 0) {
      void requestTranslations(visible, viewLanguage);
      return;
    }
    // First paint: translate the newest messages until observer attaches.
    const newest = input.messages.slice(-12).map((message) => message.id);
    void requestTranslations(newest, viewLanguage);
  }, [input.conversationId, viewLanguage, input.messages, requestTranslations]);

  useEffect(() => {
    const root = input.scrollRoot;
    if (!root || !input.conversationId || viewLanguage === "original") {
      return;
    }
    const activeLanguage = viewLanguage;

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        const newlyVisible: string[] = [];
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.messageId;
          if (!id) continue;
          if (entry.isIntersecting) {
            if (!visibleIdsRef.current.has(id)) {
              visibleIdsRef.current.add(id);
              newlyVisible.push(id);
              changed = true;
            }
          } else if (visibleIdsRef.current.delete(id)) {
            changed = true;
          }
        }
        if (changed && newlyVisible.length > 0) {
          void requestTranslations(newlyVisible, activeLanguage);
        }
      },
      { root, rootMargin: "120px 0px", threshold: 0.1 },
    );

    const nodes = root.querySelectorAll<HTMLElement>("[data-message-id]");
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [
    input.scrollRoot,
    input.conversationId,
    input.messages,
    viewLanguage,
    requestTranslations,
  ]);

  const selectViewLanguage = useCallback(
    async (language: InboxViewLanguageCode) => {
      // Drop prior ready/same_language entries so a newly selected language
      // re-evaluates mixed-script messages against the current pipeline.
      requestGenerationRef.current += 1;
      inFlightRef.current.clear();
      setTranslations({});
      setShowOriginalIds(new Set());
      setViewLanguage(language);
      if (!input.conversationId) return;
      try {
        await setWhatsAppInboxViewLanguage({
          conversationId: input.conversationId,
          language,
        });
      } catch {
        /* preference persistence is best-effort; UI still switches */
      }
    },
    [input.conversationId],
  );

  const toggleShowOriginal = useCallback((messageId: string) => {
    setShowOriginalIds((current) => {
      const next = new Set(current);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const retryMessage = useCallback(
    (messageId: string) => {
      if (!input.conversationId || viewLanguage === "original") return;
      const key = translationCacheKey(
        input.conversationId,
        messageId,
        viewLanguage,
      );
      setTranslations((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      void requestTranslations([messageId], viewLanguage);
    },
    [input.conversationId, requestTranslations, viewLanguage],
  );

  const getTranslation = useCallback(
    (messageId: string): TranslationEntry | null => {
      if (!input.conversationId || viewLanguage === "original") return null;
      return (
        translations[
          translationCacheKey(input.conversationId, messageId, viewLanguage)
        ] ?? null
      );
    },
    [input.conversationId, translations, viewLanguage],
  );

  return useMemo(
    () => ({
      viewLanguage,
      preferenceLoading,
      selectViewLanguage,
      getTranslation,
      showOriginalIds,
      toggleShowOriginal,
      retryMessage,
    }),
    [
      viewLanguage,
      preferenceLoading,
      selectViewLanguage,
      getTranslation,
      showOriginalIds,
      toggleShowOriginal,
      retryMessage,
    ],
  );
}
