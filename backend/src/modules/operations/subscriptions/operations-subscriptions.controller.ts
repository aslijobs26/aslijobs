import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { sendSuccess } from "../../../utils/api-response.js";
import { operationsSubscriptionsService } from "./operations-subscriptions.service.js";
import type { updateSubscriptionPlanBodySchema, updateSubscriptionGrantBodySchema, operationsSubscriptionsAnalyticsQuerySchema, createSubscriptionPaymentLinkSchema } from "./operations-subscriptions.validation.js";
import type { z } from "zod";
import type { SubscriptionPlanCode } from "../../subscriptions/subscription.constants.js";
import { paymentLinkService } from "../../payments/payment-link.service.js";

export const operationsSubscriptionsController = {
  async list(_req: Request, res: Response) {
    sendSuccess(res, HTTP_STATUS.OK, { data: await operationsSubscriptionsService.list() });
  },
  async analytics(req: Request, res: Response) {
    const query = req.query as z.infer<typeof operationsSubscriptionsAnalyticsQuerySchema>;
    sendSuccess(res, HTTP_STATUS.OK, { data: await operationsSubscriptionsService.analytics(query.period) });
  },
  async updatePlan(req: Request, res: Response) {
    const actorId = req.operationsAccess?.userId;
    if (!actorId) throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const result = await operationsSubscriptionsService.updatePlan(
      String(req.params.code) as SubscriptionPlanCode,
      req.body as z.infer<typeof updateSubscriptionPlanBodySchema>,
      actorId,
    );
    sendSuccess(res, HTTP_STATUS.OK, { message: "Plan updated.", data: result });
  },
  async updateGrant(req: Request, res: Response) {
    const result = await operationsSubscriptionsService.updateGrant(
      String(req.params.grantId),
      req.body as z.infer<typeof updateSubscriptionGrantBodySchema>,
    );
    sendSuccess(res, HTTP_STATUS.OK, { message: "Employer subscription updated.", data: result });
  },
  async createPaymentLink(req: Request, res: Response) {
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Payment link created.",
      data: await paymentLinkService.create(req.body as z.infer<typeof createSubscriptionPaymentLinkSchema>),
    });
  },
};
