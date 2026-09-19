import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
    this.details = details;
  }
}

function mapKnownPersistenceError(
  err: Error,
): { statusCode: number; message: string } | null {
  const code = (err as { code?: number }).code;
  if (code === 11000) {
    return {
      statusCode: 409,
      message: "A record with these details already exists.",
    };
  }
  if (err.name === "ValidationError") {
    return {
      statusCode: 400,
      message: "The submitted data is invalid.",
    };
  }
  if (err.name === "VersionError") {
    return {
      statusCode: 409,
      message: "This record was updated by someone else. Reload and try again.",
    };
  }
  if (err.name === "CastError") {
    return {
      statusCode: 400,
      message: "The submitted data is invalid.",
    };
  }
  return null;
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum allowed size is 5 MB"
        : err.message;

    res.status(400).json({
      success: false,
      message,
      ...(_req.requestId ? { requestId: _req.requestId } : {}),
    });
    return;
  }

  const mapped = mapKnownPersistenceError(err);
  const statusCode =
    err instanceof AppError
      ? err.statusCode
      : mapped?.statusCode ?? 500;
  const message =
    err instanceof AppError
      ? err.message
      : mapped?.message ?? "Internal server error";
  const details = err instanceof AppError ? err.details : undefined;

  if (process.env.NODE_ENV === "development" || statusCode >= 500) {
    console.error(
      `[error] requestId=${_req.requestId ?? "n/a"} status=${statusCode}`,
      err,
    );
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(_req.requestId ? { requestId: _req.requestId } : {}),
  });
}
