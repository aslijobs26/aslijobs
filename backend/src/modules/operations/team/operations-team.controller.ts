import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsTeamService } from "./operations-team.service.js";
import type {
  CreateOperationsTeamMemberBody,
  ListOperationsTeamQuery,
  OperationsTeamMemberIdParams,
  UpdateOperationsTeamMemberBody,
  UpdateOperationsTeamMemberStatusBody,
} from "./operations-team.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsTeamController = {
  async overview(req: Request, res: Response): Promise<void> {
    const data = await operationsTeamService.overview(requireAccess(req));
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team overview fetched successfully.",
      data,
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsTeamQuery;
    const data = await operationsTeamService.list(requireAccess(req), query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team members fetched successfully.",
      data,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateOperationsTeamMemberBody;
    const data = await operationsTeamService.create(requireAccess(req), body);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: data.invitationEmailSent
        ? "Team member created and invitation email sent."
        : "Team member created. Invitation email could not be delivered.",
      data,
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { memberId } = req.params as OperationsTeamMemberIdParams;
    const body = req.body as UpdateOperationsTeamMemberBody;
    const data = await operationsTeamService.update(
      requireAccess(req),
      memberId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member updated successfully.",
      data,
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { memberId } = req.params as OperationsTeamMemberIdParams;
    const body = req.body as UpdateOperationsTeamMemberStatusBody;
    const data = await operationsTeamService.updateStatus(
      requireAccess(req),
      memberId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member status updated successfully.",
      data,
    });
  },

  async resendInvitation(req: Request, res: Response): Promise<void> {
    const { memberId } = req.params as OperationsTeamMemberIdParams;
    const data = await operationsTeamService.resendInvitation(
      requireAccess(req),
      memberId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: data.invitationEmailSent
        ? "Invitation email sent."
        : "Invitation could not be delivered. Try again later.",
      data,
    });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { memberId } = req.params as OperationsTeamMemberIdParams;
    const data = await operationsTeamService.remove(
      requireAccess(req),
      memberId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Person deleted permanently.",
      data,
    });
  },
};
