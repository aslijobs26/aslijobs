import path from "node:path";
import multer from "multer";
import { HTTP_STATUS } from "../constants/http-status.js";
import {
  JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS,
  JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES,
  JOB_SEEKER_UPLOADED_RESUME_MIME_TYPES,
} from "../modules/resumes/resume.constants.js";
import { AppError } from "./error.middleware.js";

const memoryStorage = multer.memoryStorage();

function hasAllowedExtension(originalName: string): boolean {
  const extension = path.extname(originalName).toLowerCase();
  return (JOB_SEEKER_UPLOADED_RESUME_EXTENSIONS as readonly string[]).includes(
    extension,
  );
}

function isAllowedMimeType(mimeType: string): boolean {
  return (JOB_SEEKER_UPLOADED_RESUME_MIME_TYPES as readonly string[]).includes(
    mimeType,
  );
}

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: JOB_SEEKER_UPLOADED_RESUME_MAX_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAllowedMimeType(file.mimetype) || !hasAllowedExtension(file.originalname)) {
      callback(
        new AppError(
          "Invalid file type. Only PDF, DOC, and DOCX files are allowed",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export const jobSeekerResumeUpload = upload.single("resume");
