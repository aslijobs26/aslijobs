import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { hireAssistService } from "./hire-assist.service.js";
import type {
  CreateHireAssistBody,
  HireAssistTicketIdParams,
  ListHireAssistTicketsQuery,
} from "./hire-assist.validation.js";
import type { UpdateWorkStatusBody } from "../operations/work/operations-work.validation.js";

function requireAccess(req: Request) {
  if (!req.operationsAccess) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return req.operationsAccess;
}

export const hireAssistController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as CreateHireAssistBody;
    const data = await hireAssistService.submit(body);
    sendSuccess(res, data.created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK, {
      message: data.created
        ? "Your Hire Assist request has been submitted."
        : "This request was already submitted.",
      data,
    });
  },

  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListHireAssistTicketsQuery;
    const data = await hireAssistService.list(query);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async detail(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as HireAssistTicketIdParams;
    const data = await hireAssistService.getById(id);
    sendSuccess(res, HTTP_STATUS.OK, { data });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params as unknown as HireAssistTicketIdParams;
    const body = req.body as UpdateWorkStatusBody;
    const data = await hireAssistService.updateStatus(
      id,
      body,
      requireAccess(req),
    );
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Ticket status updated.",
      data,
    });
  },
};
