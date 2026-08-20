import type { Request, Response } from "express";
import { operationsService } from "./operations.service.js";

/**
 * Operations HTTP handlers.
 * Implementation pending — scaffold only.
 */
export const operationsController = {
  async dashboard(_req: Request, res: Response) {
    await operationsService.getDashboardOverview();
    res.status(501).json({
      success: false,
      message: "Operations dashboard API not implemented",
    });
  },
};
