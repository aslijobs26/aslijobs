import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { operationsDashboardService } from "./operations-dashboard.service.js";
import type {
  OperationsDashboardExportQuery,
  OperationsDashboardOverviewQuery,
} from "./operations-dashboard.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsDashboardController = {
  async overview(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const query = req.query as unknown as OperationsDashboardOverviewQuery;
    const data = await operationsDashboardService.getOverview(query, access);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const query = req.query as unknown as OperationsDashboardExportQuery;
    const file = await operationsDashboardService.exportOverview(query, access);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.body);
  },
};
