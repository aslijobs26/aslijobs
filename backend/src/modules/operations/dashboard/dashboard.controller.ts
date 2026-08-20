import type { Request, Response } from "express";
import { operationsDashboardService } from "./dashboard.service.js";

export const operationsDashboardController = {
  async overview(_req: Request, res: Response) {
    await operationsDashboardService.getOverview();
    res.status(501).json({
      success: false,
      message: "Operations dashboard overview not implemented",
    });
  },
};
