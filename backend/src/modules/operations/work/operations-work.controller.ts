import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import {
  assertOperationsPermissionKey,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import {
  WORK_ASSIGN_KEY,
  WORK_CLAIM_KEY,
  WORK_CREATE_KEY,
  WORK_DETAIL_VIEW_KEY,
  WORK_DUE_UPDATE_KEY,
  WORK_EXPORT_KEY,
  WORK_LIST_FILTER_KEY,
  WORK_LIST_SEARCH_KEY,
  WORK_LIST_VIEW_KEY,
  WORK_PRIORITY_UPDATE_KEY,
  WORK_REASSIGN_KEY,
  WORK_UPDATE_KEY,
  WORK_COMPLETE_KEY,
} from "../rbac/operations-permission-catalog.js";
import { operationsWorkService } from "./operations-work.service.js";
import type {
  AssignOperationsWorkBody,
  ClaimOperationsWorkBody,
  CreateOperationsWorkBody,
  ExportOperationsWorkQuery,
  ListOperationsWorkQuery,
  OperationsWorkIdParams,
  UpdateWorkDueBody,
  UpdateWorkPriorityBody,
  UpdateWorkStatusBody,
} from "./operations-work.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

function stripUnauthorizedListQuery(
  query: ListOperationsWorkQuery,
  access: ReturnType<typeof requireAccess>,
): ListOperationsWorkQuery {
  const next = { ...query };
  if (!operationsAccessCanKey(access, WORK_LIST_SEARCH_KEY)) {
    next.search = "";
  }
  if (!operationsAccessCanKey(access, WORK_LIST_FILTER_KEY)) {
    next.type = "";
    next.priority = "";
    next.due = "all";
  }
  return next;
}

export const operationsWorkController = {
  async analytics(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_LIST_VIEW_KEY);
    const data = await operationsWorkService.getAnalytics(access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations work analytics fetched successfully.",
      data,
    });
  },

  async performance(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_LIST_VIEW_KEY);
    const data = await operationsWorkService.getPerformance(access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations work performance fetched successfully.",
      data,
    });
  },

  async export(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_LIST_VIEW_KEY);
    assertOperationsPermissionKey(access, WORK_EXPORT_KEY);
    const operationsUserId = req.operationsUserId;
    if (!operationsUserId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    const query = stripUnauthorizedListQuery(
      req.query as unknown as ListOperationsWorkQuery,
      access,
    );
    const exportQuery = {
      ...query,
      format:
        (req.query as { format?: string }).format === "csv" ? "csv" : "xlsx",
    } as ExportOperationsWorkQuery;
    const format = exportQuery.format === "csv" ? "csv" : "xlsx";
    const file = await operationsWorkService.export(
      exportQuery,
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

  async list(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_LIST_VIEW_KEY);
    const query = stripUnauthorizedListQuery(
      req.query as unknown as ListOperationsWorkQuery,
      access,
    );
    const data = await operationsWorkService.list(query, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations work items fetched successfully.",
      data,
    });
  },

  async eligibleAssignees(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    if (
      !operationsAccessCanKey(access, WORK_ASSIGN_KEY) &&
      !operationsAccessCanKey(access, WORK_REASSIGN_KEY)
    ) {
      throw new AppError(
        "You do not have permission to assign work.",
        HTTP_STATUS.FORBIDDEN,
      );
    }
    const data = await operationsWorkService.listEligibleAssignees(access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Eligible assignees fetched successfully.",
      data: { items: data },
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_DETAIL_VIEW_KEY);
    const { id } = req.params as OperationsWorkIdParams;
    const data = await operationsWorkService.getById(id, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations work item fetched successfully.",
      data,
    });
  },

  async create(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_CREATE_KEY);
    const body = req.body as CreateOperationsWorkBody;
    const data = await operationsWorkService.create(body, access);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Work item created successfully.",
      data,
    });
  },

  async assign(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const { id } = req.params as OperationsWorkIdParams;
    const body = req.body as AssignOperationsWorkBody;
    const data = await operationsWorkService.assign(id, body, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Work item assigned successfully.",
      data,
    });
  },

  async claim(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_CLAIM_KEY);
    const { id } = req.params as OperationsWorkIdParams;
    const body = req.body as ClaimOperationsWorkBody;
    const data = await operationsWorkService.claim(id, body, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Work item claimed successfully.",
      data,
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    const { id } = req.params as OperationsWorkIdParams;
    const body = req.body as UpdateWorkStatusBody;
    if (body.status === "completed") {
      assertOperationsPermissionKey(access, WORK_COMPLETE_KEY);
    } else {
      assertOperationsPermissionKey(access, WORK_UPDATE_KEY);
    }
    const data = await operationsWorkService.updateStatus(id, body, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Work item status updated successfully.",
      data,
    });
  },

  async updatePriority(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_PRIORITY_UPDATE_KEY);
    const { id } = req.params as OperationsWorkIdParams;
    const body = req.body as UpdateWorkPriorityBody;
    const data = await operationsWorkService.updatePriority(id, body, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Work item priority updated successfully.",
      data,
    });
  },

  async updateDue(req: Request, res: Response): Promise<void> {
    const access = requireAccess(req);
    assertOperationsPermissionKey(access, WORK_DUE_UPDATE_KEY);
    const { id } = req.params as OperationsWorkIdParams;
    const body = req.body as UpdateWorkDueBody;
    const data = await operationsWorkService.updateDue(id, body, access);
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Work item due date updated successfully.",
      data,
    });
  },
};
