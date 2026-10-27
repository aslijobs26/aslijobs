import type { InboxTranslationLanguage } from "../constants/inbox-translation-languages";

export type ComposerDraftMode = "original" | "translated";

export interface ComposerDraftState {
  draft: string;
  /** Last text the admin wrote before the latest translation. */
  authoredText: string;
  mode: ComposerDraftMode;
  targetLanguage: InboxTranslationLanguage | null;
  lastTranslatedText: string | null;
}

export function emptyComposerDraft(): ComposerDraftState {
  return {
    draft: "",
    authoredText: "",
    mode: "original",
    targetLanguage: null,
    lastTranslatedText: null,
  };
}

/** Text that should be sent to the translator for the next language choice. */
export function textForNextTranslation(state: ComposerDraftState): string {
  const showingUntouchedTranslation =
    state.mode === "translated" &&
    state.lastTranslatedText != null &&
    state.draft === state.lastTranslatedText &&
    state.authoredText.trim().length > 0;
  return showingUntouchedTranslation ? state.authoredText : state.draft;
}

export function editComposerDraft(
  state: ComposerDraftState,
  nextDraft: string,
): ComposerDraftState {
  if (
    state.mode === "translated" &&
    state.lastTranslatedText != null &&
    nextDraft !== state.lastTranslatedText
  ) {
    return {
      ...state,
      draft: nextDraft,
      targetLanguage: null,
    };
  }
  if (state.mode === "translated" && nextDraft === state.draft) {
    return state;
  }
  return {
    draft: nextDraft,
    authoredText: nextDraft,
    mode: "original",
    targetLanguage: null,
    lastTranslatedText: null,
  };
}

export function applyComposerTranslation(
  state: ComposerDraftState,
  translatedText: string,
  targetLanguage: InboxTranslationLanguage,
): ComposerDraftState {
  const source = textForNextTranslation(state);
  return {
    draft: translatedText,
    authoredText: source,
    mode: "translated",
    targetLanguage,
    lastTranslatedText: translatedText,
  };
}

export function restoreAuthoredDraft(
  state: ComposerDraftState,
): ComposerDraftState {
  if (!state.authoredText) return { ...state, mode: "original", targetLanguage: null };
  return {
    draft: state.authoredText,
    authoredText: state.authoredText,
    mode: "original",
    targetLanguage: null,
    lastTranslatedText: null,
  };
}

export function shouldApplyDraftTranslation(input: {
  requestId: number;
  activeRequestId: number;
  requestConversationId: string;
  activeConversationId: string | null;
  sourceSnapshot: string;
  state: ComposerDraftState;
}): boolean {
  if (input.requestId !== input.activeRequestId) return false;
  if (input.activeConversationId !== input.requestConversationId) return false;
  return textForNextTranslation(input.state).trim() === input.sourceSnapshot.trim();
}

export function translationFailureMessage(errorCode?: string): string {
  if (errorCode === "missing_key") {
    return "Translation is unavailable because SARVAM_API_KEY is not configured on the server. Your draft was not changed.";
  }
  if (errorCode === "timeout") {
    return "Translation timed out. Your draft was not changed.";
  }
  if (errorCode === "layout_mismatch" || errorCode === "protected_token") {
    return "Translation could not keep the message formatting. Your draft was not changed.";
  }
  return "Translation failed. Your draft was not changed.";
}
