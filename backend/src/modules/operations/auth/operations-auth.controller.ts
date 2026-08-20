import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import type { OperationsTeamLoginBody } from "./operations-auth.validation.js";
import { operationsAuthService } from "./operations-auth.service.js";

function requireOperationsUserId(req: Request): string {
  if (!req.operationsUserId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsUserId;
}

export class OperationsAuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as OperationsTeamLoginBody;
    const result = await operationsAuthService.login(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations login successful.",
      data: result,
    });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await operationsAuthService.refresh(refreshToken);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations session refreshed.",
      data: result,
    });
  };

  session = async (req: Request, res: Response): Promise<void> => {
    const userId = requireOperationsUserId(req);
    const result = await operationsAuthService.getSession(userId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations session fetched successfully.",
      data: result,
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const userId = requireOperationsUserId(req);
    await operationsAuthService.logout(userId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations logout successful.",
      data: { success: true },
    });
  };
}

export const operationsAuthController = new OperationsAuthController();
