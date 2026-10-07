import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import {
  EMPLOYER_COMPANY_MEDIA_MAX_COUNT,
  EMPLOYER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_DOCUMENT_MIME_TYPES,
} from "../constants/employer.constants.js";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.js";

const memoryStorage = multer.memoryStorage();

function isAllowedMimeType(mimeType: string): boolean {
  return (EMPLOYER_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

const employerUploadBase = multer({
  storage: memoryStorage,
  limits: {
    fileSize: EMPLOYER_DOCUMENT_MAX_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(file.mimetype)) {
      callback(
        new AppError(
          "Invalid file type. Only PDF, PNG, JPG, JPEG, and WEBP files are allowed",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }

    callback(null, true);
  },
});

/** @deprecated Prefer field-based uploaders for multi-file profile forms. */
export const employerDocumentUpload = employerUploadBase.single("document");

export const employerCompanyProfileUpload = employerUploadBase.fields([
  { name: "document", maxCount: 1 },
  { name: "companyLogo", maxCount: 1 },
]);

export const employerIndividualIdentityUpload = employerUploadBase.fields([
  { name: "document", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);

export const employerProfileUpdateUpload = employerUploadBase.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
  { name: "companyMedia", maxCount: EMPLOYER_COMPANY_MEDIA_MAX_COUNT },
]);

export const employerOperationsCompleteUpload = employerUploadBase.fields([
  { name: "companyLogo", maxCount: 1 },
  { name: "profilePhoto", maxCount: 1 },
]);

/** Keep JSON complete-employer requests working when no photo is attached. */
export function optionalMultipart(
  upload: (req: Request, res: Response, next: NextFunction) => void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = String(req.headers["content-type"] ?? "").toLowerCase();
    if (contentType.includes("multipart/form-data")) {
      upload(req, res, next);
      return;
    }
    next();
  };
}

export function getUploadedFile(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  fieldName: string,
): Express.Multer.File | undefined {
  if (!files || Array.isArray(files)) {
    return undefined;
  }

  return files[fieldName]?.[0];
}

export function getUploadedFiles(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined,
  fieldName: string,
): Express.Multer.File[] {
  if (!files || Array.isArray(files)) {
    return [];
  }

  return files[fieldName] ?? [];
}