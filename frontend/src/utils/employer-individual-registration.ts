import { AUTH_VALIDATION_MESSAGES } from "../constants/auth-validation-messages";
import type { AuthFieldErrors } from "./auth-field-errors";

/** Identity document is required for individual employer registration. Profile photo is not. */
export function individualRegistrationDocumentErrors(input: {
  documentType: string | null | undefined;
  hasDocumentFile: boolean;
}): AuthFieldErrors {
  const errors: AuthFieldErrors = {};

  if (!input.documentType?.trim()) {
    errors.documentType = AUTH_VALIDATION_MESSAGES.DOCUMENT_TYPE_REQUIRED;
  }

  if (!input.hasDocumentFile) {
    errors.documentFile = AUTH_VALIDATION_MESSAGES.DOCUMENT_REQUIRED;
  }

  return errors;
}
