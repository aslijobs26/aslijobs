import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  listOperationsAuditEvents,
  type ListOperationsAuditQuery,
} from "./operations-audit.list.js";

export async function listOperationsAuditController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  const data = await listOperationsAuditEvents(
    req.operationsAccess,
    req.query as unknown as ListOperationsAuditQuery,
  );

  sendSuccess(res, HTTP_STATUS.OK, {
    message: "Activity log fetched successfully.",
    data,
  });
}
