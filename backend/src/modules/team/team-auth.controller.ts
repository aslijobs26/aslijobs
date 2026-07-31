import type { Request, Response } from "express";
import { z } from "zod";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { teamAuthService } from "./team-auth.service.js";

export const teamMemberLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export type TeamMemberLoginBody = z.infer<typeof teamMemberLoginSchema>;

function requireRbac(req: Request) {
  if (!req.rbac) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.rbac;
}

export class TeamAuthController {
  login = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as TeamMemberLoginBody;
    const result = await teamAuthService.login(body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member login successful.",
      data: result,
    });
  };

  session = async (req: Request, res: Response): Promise<void> => {
    const context = requireRbac(req);
    const result = teamAuthService.getRbacSession(context);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "RBAC session fetched successfully.",
      data: result,
    });
  };
}

export const teamAuthController = new TeamAuthController();
