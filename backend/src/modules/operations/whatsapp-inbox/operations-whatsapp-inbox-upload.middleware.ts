import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024, files: 1 },
});

export function whatsAppInboxMediaUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("file")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(
        new AppError(
          "File is larger than the 16 MB WhatsApp limit.",
          HTTP_STATUS.BAD_REQUEST,
          { code: "WHATSAPP_MEDIA_REJECTED" },
        ),
      );
      return;
    }
    next(error);
  });
}
