import multer from "multer";
import {
  EMPLOYER_DOCUMENT_MAX_SIZE_BYTES,
  EMPLOYER_DOCUMENT_MIME_TYPES,
} from "../constants/employer.constants.js";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.js";

const memoryStorage = multer.memoryStorage();

function isAllowedMimeType(mimeType: string): boolean {
  return (EMPLOYER_DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export const employerDocumentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: EMPLOYER_DOCUMENT_MAX_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(file.mimetype)) {
      callback(
        new AppError(
          "Invalid file type. Only PDF, PNG, JPG, and JPEG files are allowed",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }

    callback(null, true);
  },
}).single("document");
