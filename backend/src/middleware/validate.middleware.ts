import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.js";

type RequestTarget = "body" | "query" | "params";

function assignValidatedTarget<T>(
  req: Request,
  target: RequestTarget,
  data: T,
): void {
  // Express 5 exposes req.query (and sometimes req.params) as getter-only.
  // Replacing the property via defineProperty keeps validated/coerced values available.
  if (target === "query" || target === "params") {
    Object.defineProperty(req, target, {
      value: data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return;
  }

  req[target] = data;
}

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

    assignValidatedTarget(req, target, result.data);
    next();
  };
}
