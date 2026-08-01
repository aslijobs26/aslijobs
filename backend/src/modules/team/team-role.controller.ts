import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { teamRoleService } from "./team-role.service.js";
import type {
  CreateRoleInput,
  DuplicateRoleInput,
  ListRolesQuery,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
} from "./team-role.validation.js";

function requireEmployerId(req: Request): string {
  if (!req.employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.employerId;
}

export class TeamRoleController {
  list = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const query = req.query as unknown as ListRolesQuery;
    const result = await teamRoleService.listRolesPaged(employerId, query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Roles fetched successfully.",
      data: result,
    });
  };

  /** Module 2 dropdown list — unchanged response shape. */
  listAssignable = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const roles = await teamRoleService.listRoles(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Roles fetched successfully.",
      data: { roles },
    });
  };

  getPermissionMatrixMeta = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    const result = teamRoleService.getPermissionMatrixMeta();
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Permission matrix metadata fetched successfully.",
      data: result,
    });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as CreateRoleInput;
    const result = await teamRoleService.createRole(employerId, body);

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Role created successfully.",
      data: result,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.getRole(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role fetched successfully.",
      data: result,
    });
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.getRoleDetails(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role details fetched successfully.",
      data: result,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const body = req.body as UpdateRoleInput;
    const result = await teamRoleService.updateRole(employerId, roleId, body);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role updated successfully.",
      data: result,
    });
  };

  updatePermissions = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const body = req.body as UpdateRolePermissionsInput;
    const result = await teamRoleService.updatePermissions(
      employerId,
      roleId,
      body,
      {
        actorMemberId: req.rbac?.memberId ?? null,
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      },
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role permissions updated successfully.",
      data: result,
    });
  };

  duplicate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const body = req.body as DuplicateRoleInput;
    const result = await teamRoleService.duplicateRole(
      employerId,
      roleId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Role duplicated successfully.",
      data: result,
    });
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.archiveRole(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role archived successfully.",
      data: result,
    });
  };

  deactivate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.deactivateRole(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role deactivated successfully.",
      data: result,
    });
  };

  activate = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.activateRole(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role activated successfully.",
      data: result,
    });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const { roleId } = req.params as { roleId: string };
    const result = await teamRoleService.deleteRole(employerId, roleId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Role deleted successfully.",
      data: result,
    });
  };
}

export const teamRoleController = new TeamRoleController();
