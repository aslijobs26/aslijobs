import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { operationsOrganizationService } from "./operations-organization.service.js";
import type {
  CreateOrgUnitBody,
  ListOrgTreeQuery,
  OrgUnitPeopleQuery,
  UpdateOrgUnitBody,
  UpdateOrganizationSettingsBody,
} from "./operations-organization.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const operationsOrganizationController = {
  async tree(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const query = req.query as unknown as ListOrgTreeQuery;
    const data = await operationsOrganizationService.getTree(query, access);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async getUnit(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const unitId = String(req.params.unitId);
    const data = await operationsOrganizationService.getUnit(unitId, access);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async overview(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const unitId = String(req.params.unitId);
    const data = await operationsOrganizationService.getOverview(unitId, access);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async people(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const unitId = String(req.params.unitId);
    const query = req.query as unknown as OrgUnitPeopleQuery;
    const data = await operationsOrganizationService.listPeople(
      unitId,
      query,
      access,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async create(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const body = req.body as CreateOrgUnitBody;
    const data = await operationsOrganizationService.createUnit(access, body);
    res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  },

  async createSubUnit(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const parentId = String(req.params.unitId);
    const body = req.body as CreateOrgUnitBody;
    const data = await operationsOrganizationService.createUnit(access, {
      ...body,
      parentId,
    });
    res.status(HTTP_STATUS.CREATED).json({ success: true, data });
  },

  async update(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const unitId = String(req.params.unitId);
    const body = req.body as UpdateOrgUnitBody;
    const data = await operationsOrganizationService.updateUnit(
      unitId,
      access,
      body,
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async getSettings(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const data = await operationsOrganizationService.getSettings(access);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },

  async updateSettings(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const body = req.body as UpdateOrganizationSettingsBody;
    const data = await operationsOrganizationService.updateSettings(access, body);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
  },
};
