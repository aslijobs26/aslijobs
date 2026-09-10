import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  assertOperationsPermissionKey,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import {
  PLACEMENTS_DETAIL_UPDATE_JOINING_KEY,
  PLACEMENTS_LIST_EXPORT_KEY,
} from "../rbac/operations-permission-catalog.js";
import { operationsPlacementsService } from "./operations-placements.service.js";
import type {
  ExportOperationsPlacementsQuery,
  ListOperationsPlacementsQuery,
  OperationsPlacementIdParams,
  PlacementsAnalyticsQueryInput,
  UpdatePlacementJoiningStatusBody,
} from "./operations-placements.validation.js";

const PLACEMENTS_LIST_VIEW_KEY = "placements.list.view";
const PLACEMENTS_LIST_SEARCH_KEY = "placements.list.search";
const PLACEMENTS_LIST_FILTER_KEY = "placements.list.filter";
const PLACEMENTS_DETAIL_VIEW_KEY = "placements.detail.view";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

function stripUnauthorizedListQuery(
  query: ListOperationsPlacementsQuery,
  access: ReturnType<typeof requireAccess>,
): ListOperationsPlacementsQuery {
  const next = { ...query };
  if (!operationsAccessCanKey(access, PLACEMENTS_LIST_SEARCH_KEY)) {
    next.search = "";
  }
  if (!operationsAccessCanKey(access, PLACEMENTS_LIST_FILTER_KEY)) {
    next.status = "all";
    next.category = "";
    next.state = "";
    next.city = "";
    next.employerId = "";
    next.jobId = "";
    next.preset = "all";
    next.dateFrom = "";
    next.dateTo = "";
  }
  return next;
}

export const operationsPlacementsController = {
  async analytics(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, PLACEMENTS_LIST_VIEW_KEY);
    const query = req.query as unknown as PlacementsAnalyticsQueryInput;
    const data = await operationsPlacementsService.getAnalytics(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations placements analytics fetched successfully.",
      data,
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, PLACEMENTS_LIST_VIEW_KEY);
    const query = stripUnauthorizedListQuery(
      req.query as unknown as ListOperationsPlacementsQuery,
      access,
    );
    const result = await operationsPlacementsService.list(query, access);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations placements fetched successfully.",
      data: result,
    });
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, PLACEMENTS_LIST_VIEW_KEY);
    assertOperationsPermissionKey(access, PLACEMENTS_LIST_EXPORT_KEY);
    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    const query = stripUnauthorizedListQuery(
      req.query as unknown as ExportOperationsPlacementsQuery,
      access,
    ) as ExportOperationsPlacementsQuery;
    const format = query.format === "csv" ? "csv" : "xlsx";
    const file = await operationsPlacementsService.export(
      query,
      access,
      format,
      { operationsUserId },
    );

    res.setHeader("Content-Type", file.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.fileName}"`,
    );
    res.status(HTTP_STATUS.OK).send(file.buffer);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, PLACEMENTS_DETAIL_VIEW_KEY);
    const { id } = req.params as OperationsPlacementIdParams;
    const result = await operationsPlacementsService.getById(id, access);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations placement fetched successfully.",
      data: result,
    });
  },

  async updateJoiningStatus(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, PLACEMENTS_DETAIL_UPDATE_JOINING_KEY);
    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    const { id } = req.params as OperationsPlacementIdParams;
    const body = req.body as UpdatePlacementJoiningStatusBody;
    const result = await operationsPlacementsService.updateJoiningStatus(
      id,
      body,
      access,
      operationsUserId,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Placement joining status updated successfully.",
      data: result,
    });
  },
};
