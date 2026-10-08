import {
  EMPLOYER_BUSINESS_DOCUMENT_TYPES,
  EMPLOYER_IDENTITY_DOCUMENT_TYPES,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { EmployerAccountType } from "./employer.types.js";

const BUSINESS_DOCUMENT_TYPES = new Set<string>(EMPLOYER_BUSINESS_DOCUMENT_TYPES);
const IDENTITY_DOCUMENT_TYPES = new Set<string>(EMPLOYER_IDENTITY_DOCUMENT_TYPES);

export function allowedEmployerDocumentTypes(
  accountType: EmployerAccountType,
): readonly string[] {
  return isBusinessEmployerAccountType(accountType)
    ? EMPLOYER_BUSINESS_DOCUMENT_TYPES
    : EMPLOYER_IDENTITY_DOCUMENT_TYPES;
}

export function assertEmployerDocumentTypeForAccount(
  accountType: EmployerAccountType,
  documentType: string,
): void {
  const allowed = isBusinessEmployerAccountType(accountType)
    ? BUSINESS_DOCUMENT_TYPES
    : IDENTITY_DOCUMENT_TYPES;

  if (!allowed.has(documentType)) {
    throw new AppError(
      isBusinessEmployerAccountType(accountType)
        ? "Select a valid business verification document"
        : "Select a valid identity document",
      HTTP_STATUS.BAD_REQUEST,
      {
        fieldErrors: {
          documentType: "Select a valid document type.",
        },
      },
    );
  }
}
