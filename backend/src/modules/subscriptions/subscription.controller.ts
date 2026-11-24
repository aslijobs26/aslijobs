import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { subscriptionService } from "./subscription.service.js";
import type { EnterpriseEnquiryBody } from "./subscription.validation.js";

export const subscriptionController = {
  listPlans: async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, HTTP_STATUS.OK, { data: await subscriptionService.listPlans() });
  },

  getMine: async (req: Request, res: Response): Promise<void> => {
    const employerId = req.employerId?.trim();
    if (!employerId) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }
    sendSuccess(res, HTTP_STATUS.OK, {
      data: await subscriptionService.getMySubscription(employerId),
    });
  },

  enterpriseEnquiry: async (req: Request, res: Response): Promise<void> => {
    const body = req.body as EnterpriseEnquiryBody;
    const result = await subscriptionService.createEnterpriseLead({
      employerId: req.employerId ?? null,
      contactName: body.contactName,
      phone: body.phone,
      email: body.email,
      companyName: body.companyName,
      expectedMonthlyHires: body.expectedMonthlyHires ?? null,
      message: body.message,
    });
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Thanks! Our sales team will contact you shortly.",
      data: result,
    });
  },
};
