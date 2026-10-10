import {
  documentTypesForEmployerAccount,
  isBusinessEmployerAccountType,
} from "../../constants/employer.constants.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { EmployerAccountType } from "./employer.types.js";

export function allowedEmployerDocumentTypes(
  accountType: EmployerAccountType,
): readonly string[] {
  return documentTypesForEmployerAccount(accountType);
}

export function assertEmployerDocumentTypeForAccount(
  accountType: EmployerAccountType,
  documentType: string,
): void {
  const allowed = new Set(documentTypesForEmployerAccount(accountType));

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
