import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.js";

type RequestTarget = "body" | "query" | "params";

export function validate<T>(schema: ZodType<T>, target: RequestTarget = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join("; ");

      next(new AppError(message || "Validation failed", HTTP_STATUS.BAD_REQUEST));
      return;
    }

    req[target] = result.data;
    next();
  };
}
