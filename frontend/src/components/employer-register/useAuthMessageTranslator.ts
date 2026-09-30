"use client";

import { authBundle } from "@/i18n/bundles/auth";
import { useTranslate } from "@/i18n/translate";

type AuthValidationKey = keyof (typeof authBundle)["en"]["auth"]["validation"];

/**
 * Canonical English validation copy. Auth forms keep these strings in state
 * (alongside `AUTH_VALIDATION_MESSAGES` and normalized API messages) and
 * localize them only at render time.
 */
export const AUTH_VALIDATION_COPY = authBundle.en.auth.validation;

const VALIDATION_KEY_BY_MESSAGE: ReadonlyMap<string, AuthValidationKey> =
  new Map(
    (Object.keys(AUTH_VALIDATION_COPY) as AuthValidationKey[]).map(
      (key): [string, AuthValidationKey] => [AUTH_VALIDATION_COPY[key], key],
    ),
  );

export type AuthMessageTranslator = (
  message: string | null | undefined,
) => string | null;

/** Unknown messages (for example server-provided text) are returned unchanged. */
export function useAuthMessageTranslator(): AuthMessageTranslator {
  const t = useTranslate();

  return (message) => {
    if (!message) {
      return null;
    }

    const key = VALIDATION_KEY_BY_MESSAGE.get(message);
    return key ? t(`auth.validation.${key}`) : message;
  };
}
