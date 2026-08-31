import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsEmployersService } from "./operations-employers.service.js";
import type {
  ListOperationsEmployerJobsQuery,
  ListOperationsEmployersQuery,
  OperationsEmployerIdParams,
  UpdateOperationsEmployerStatusBody,
  UpdateOperationsEmployerVerificationBody,
} from "./operations-employers.validation.js";

export const operationsEmployersController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListOperationsEmployersQuery;
    const result = await operationsEmployersService.listEmployers(query);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employers fetched successfully.",
      data: result,
    });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const result = await operationsEmployersService.getEmployerById(employerId);

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer fetched successfully.",
      data: result,
    });
  },

  async listJobs(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const query = req.query as unknown as ListOperationsEmployerJobsQuery;
    const result = await operationsEmployersService.listEmployerJobs(
      employerId,
      query,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Operations employer jobs fetched successfully.",
      data: result,
    });
  },

  async updateVerification(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const body = req.body as UpdateOperationsEmployerVerificationBody;
    const result = await operationsEmployersService.updateVerification(
      employerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer verification updated successfully.",
      data: result,
    });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { employerId } = req.params as OperationsEmployerIdParams;
    const body = req.body as UpdateOperationsEmployerStatusBody;
    const result = await operationsEmployersService.updateStatus(
      employerId,
      body,
    );

    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Employer status updated successfully.",
      data: result,
    });
  },
};
