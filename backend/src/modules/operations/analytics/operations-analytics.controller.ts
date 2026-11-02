import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  canExportOperationsAnalytics,
  canViewOperationsAnalytics,
} from "./operations-analytics-access.js";
import { operationsAnalyticsService } from "./operations-analytics.service.js";
import type {
  OperationsAnalyticsDrilldownQuery,
  OperationsAnalyticsExportQuery,
  OperationsAnalyticsOverviewQuery,
} from "./operations-analytics.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

function assertAnalyticsRead(access: ReturnType<typeof requireAccess>) {
  if (canViewOperationsAnalytics(access)) return;
  throw new AppError(
    "Access denied. You do not have permission to perform this action.",
    HTTP_STATUS.FORBIDDEN,
  );
}

function assertAnalyticsExport(access: ReturnType<typeof requireAccess>) {
  if (canExportOperationsAnalytics(access)) return;
  throw new AppError(
    "Access denied. You do not have permission to perform this action.",
    HTTP_STATUS.FORBIDDEN,
  );
}

export const operationsAnalyticsController = {
  async overview(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertAnalyticsRead(access);
    const query = req.query as unknown as OperationsAnalyticsOverviewQuery;
    const data = await operationsAnalyticsService.getOverview(query, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations analytics overview fetched successfully.",
      data,
    });
  },

  async drilldown(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertAnalyticsRead(access);
    const query = req.query as unknown as OperationsAnalyticsDrilldownQuery;
    const data = await operationsAnalyticsService.drilldown(query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations analytics breakdown fetched successfully.",
      data,
    });
  },

  async exportDrilldown(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertAnalyticsExport(access);
    const query = req.query as unknown as OperationsAnalyticsDrilldownQuery;
    const file = await operationsAnalyticsService.exportDrilldown(query, access);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("X-Export-Scope", "filtered");
    res.setHeader("X-Export-Truncated", file.truncated ? "true" : "false");
    res.setHeader("X-Export-Row-Count", String(file.exported));
    res.status(HTTP_STATUS.OK).send(file.body);
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertAnalyticsExport(access);
    const query = req.query as unknown as OperationsAnalyticsExportQuery;
    const file = await operationsAnalyticsService.exportOverview(query, access);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.body);
  },
};
