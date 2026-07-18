import type { Response } from "express";

type SuccessPayload = {
  message?: string;
  data?: unknown;
  meta?: unknown;
};

export function sendSuccess(
  res: Response,
  statusCode: number,
  payload: SuccessPayload = {},
): void {
  res.status(statusCode).json({
    success: true,
    message: payload.message,
    data: payload.data ?? null,
    ...(payload.meta ? { meta: payload.meta } : {}),
  });
}
