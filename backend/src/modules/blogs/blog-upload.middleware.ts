import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { BLOG_IMAGE_MAX_BYTES, BLOG_IMAGE_MIME_TYPES } from "./blog.constants.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: BLOG_IMAGE_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!(BLOG_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      callback(
        new AppError(
          "Invalid image. Use PNG, JPG, or WEBP up to 5 MB.",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single("image");

export function blogImageUpload(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Image must be 5 MB or smaller.", HTTP_STATUS.BAD_REQUEST));
      return;
    }
    next(error);
  });
}
