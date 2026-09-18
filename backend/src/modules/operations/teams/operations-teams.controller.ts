import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsTeamsService } from "./operations-teams.service.js";
import type {
  AddOperationsTeamMemberBody,
  CreateOperationsTeamBody,
  ListOperationsTeamsQuery,
  ListTeamMembersQuery,
  OperationsTeamIdParams,
  RemoveOperationsTeamMemberBody,
  UpdateOperationsTeamBody,
} from "./operations-teams.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsTeamsController = {
  async metrics(req: Request, res: Response): Promise<void> {
    const data = await operationsTeamsService.metrics(requireAccess(req));
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team metrics fetched successfully.",
      data,
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsTeamsQuery;
    const data = await operationsTeamsService.list(requireAccess(req), query);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Teams fetched successfully.",
      data,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateOperationsTeamBody;
    const data = await operationsTeamsService.create(requireAccess(req), body);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Team created successfully.",
      data,
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const data = await operationsTeamsService.getById(requireAccess(req), teamId);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team fetched successfully.",
      data,
    });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const body = req.body as UpdateOperationsTeamBody;
    const data = await operationsTeamsService.update(
      requireAccess(req),
      teamId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team updated successfully.",
      data,
    });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const expectedRevision = Number(
      (req.body as { expectedRevision?: number })?.expectedRevision ??
        req.query.expectedRevision,
    );
    const data = await operationsTeamsService.archive(
      requireAccess(req),
      teamId,
      expectedRevision,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team archived successfully.",
      data,
    });
  },

  async listMembers(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const query = req.query as unknown as ListTeamMembersQuery;
    const data = await operationsTeamsService.listMembers(
      requireAccess(req),
      teamId,
      query,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team members fetched successfully.",
      data,
    });
  },

  async addMember(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const body = req.body as AddOperationsTeamMemberBody;
    const data = await operationsTeamsService.addMember(
      requireAccess(req),
      teamId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member added successfully.",
      data,
    });
  },

  async removeMember(req: Request, res: Response): Promise<void> {
    const { teamId, memberId } = req.params as {
      teamId: string;
      memberId: string;
    };
    const body = req.body as RemoveOperationsTeamMemberBody;
    const data = await operationsTeamsService.removeMember(
      requireAccess(req),
      teamId,
      memberId,
      body,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team member removed successfully.",
      data,
    });
  },

  async workSummary(req: Request, res: Response): Promise<void> {
    const { teamId } = req.params as OperationsTeamIdParams;
    const data = await operationsTeamsService.workSummary(
      requireAccess(req),
      teamId,
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Team work summary fetched successfully.",
      data,
    });
  },
};
