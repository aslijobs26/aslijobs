export type AuthFieldErrors = Record<string, string>;

export function mergeFieldErrors(
  current: AuthFieldErrors,
  incoming: AuthFieldErrors,
): AuthFieldErrors {
  return {
    ...current,
    ...incoming,
  };
}

export function clearFieldError(
  errors: AuthFieldErrors,
  field: string,
): AuthFieldErrors {
  if (!(field in errors)) {
    return errors;
  }

  const next = { ...errors };
  delete next[field];
  return next;
}

export function firstInvalidFieldName(
  errors: AuthFieldErrors,
): string | null {
  const keys = Object.keys(errors);
  return keys[0] ?? null;
}

/**
 * Focuses a field by `name` attribute, falling back to element `id`.
 * Scrolls the target into view for mobile-friendly error recovery.
 */
export function focusFieldByName(fieldName: string): void {
  if (typeof document === "undefined" || !fieldName) {
    return;
  }

  const byName = document.querySelector<HTMLElement>(
    `[name="${CSS.escape(fieldName)}"]`,
  );
  const byId = document.getElementById(fieldName);
  const element = byName ?? byId;

  if (!element) {
    return;
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });

  const focusTarget =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLButtonElement
      ? element
      : element.querySelector<HTMLElement>("input, textarea, select, button");

  focusTarget?.focus({ preventScroll: true });
}

export function focusFirstInvalidField(errors: AuthFieldErrors): void {
  const first = firstInvalidFieldName(errors);
  if (first) {
    focusFieldByName(first);
  }
}
