import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import {
  tokenRefreshService,
  type RefreshTokenBody,
} from "./token-refresh.service.js";

function toTokenPayload(result: {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  principal: string;
}) {
  return {
    principal: result.principal,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
  };
}

export class TokenRefreshController {
  refreshWorkspace = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RefreshTokenBody;
    const result = await tokenRefreshService.refreshWorkspace(body.refreshToken);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Session refreshed successfully.",
      data: toTokenPayload(result),
    });
  };

  refreshJobSeeker = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as RefreshTokenBody;
    const result = await tokenRefreshService.refreshJobSeeker(body.refreshToken);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Session refreshed successfully.",
      data: toTokenPayload(result),
    });
  };

  logoutWorkspace = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<RefreshTokenBody>;
    await tokenRefreshService.logoutWorkspace(body.refreshToken ?? null);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Logged out successfully.",
      data: { success: true },
    });
  };

  logoutJobSeeker = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as Partial<RefreshTokenBody>;
    await tokenRefreshService.logoutJobSeeker(body.refreshToken ?? null);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Logged out successfully.",
      data: { success: true },
    });
  };
}

export const tokenRefreshController = new TokenRefreshController();
