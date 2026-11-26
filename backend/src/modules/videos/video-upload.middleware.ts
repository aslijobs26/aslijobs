import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";

const VIDEO_MAX_BYTES = 100 * 1024 * 1024;
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!VIDEO_MIME_TYPES.includes(file.mimetype)) {
      callback(new AppError("Invalid video. Use MP4 or WebM up to 100 MB.", HTTP_STATUS.BAD_REQUEST));
      return;
    }
    callback(null, true);
  },
}).single("video");

export function videoUpload(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Video must be 100 MB or smaller.", HTTP_STATUS.BAD_REQUEST));
      return;
    }
    next(error);
  });
}
