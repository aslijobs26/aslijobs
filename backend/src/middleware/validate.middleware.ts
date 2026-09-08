import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "./error.middleware.js";
import { HTTP_STATUS } from "../constants/http-status.js";

type RequestTarget = "body" | "query" | "params";

export type ValidationIssueSummary = {
  path: string;
  message: string;
};

export type ValidationErrorDetails = {
  code: "VALIDATION_ERROR";
  fieldErrors: Record<string, string>;
  issues: ValidationIssueSummary[];
};

type ZodIssueLike = {
  path: readonly PropertyKey[];
  message: string;
};

function issuePathKey(path: readonly PropertyKey[]): string {
  if (path.length === 0) {
    return "_form";
  }

  return path.map(String).join(".");
}

/**
 * Builds the AppError payload for Zod validation failures.
 * First issue wins when the same field appears more than once.
 */
export function buildValidationErrorFromZodIssues(issues: readonly ZodIssueLike[]): {
  message: string;
  details: ValidationErrorDetails;
} {
  const fieldErrors: Record<string, string> = {};
  const issueSummaries: ValidationIssueSummary[] = [];

  for (const issue of issues) {
    const path = issuePathKey(issue.path);
    const message = issue.message;

    if (!(path in fieldErrors)) {
      fieldErrors[path] = message;
    }

    issueSummaries.push({ path, message });
  }

  const message =
    issues.length === 1
      ? (issues[0]?.message ?? "Please correct the highlighted fields.")
      : "Please correct the highlighted fields.";

  return {
    message,
    details: {
      code: "VALIDATION_ERROR",
      fieldErrors,
      issues: issueSummaries,
    },
  };
}

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
      const { message, details } = buildValidationErrorFromZodIssues(
        result.error.issues,
      );

      next(new AppError(message, HTTP_STATUS.BAD_REQUEST, details));
      return;
    }

    assignValidatedTarget(req, target, result.data);
    next();
  };
}
