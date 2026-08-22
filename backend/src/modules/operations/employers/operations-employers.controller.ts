import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsEmployersService } from "./operations-employers.service.js";
import type {
  ListOperationsEmployersQuery,
  OperationsEmployerIdParams,
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
};
