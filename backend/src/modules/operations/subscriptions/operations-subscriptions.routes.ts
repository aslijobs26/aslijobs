import { Router } from "express";
import { requireOperationsAuth, requireOperationsPermission } from "../../../middleware/operations-auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { operationsSubscriptionsController } from "./operations-subscriptions.controller.js";
import { createSubscriptionPaymentLinkSchema, operationsSubscriptionGrantParamsSchema, operationsSubscriptionsAnalyticsQuerySchema, operationsSubscriptionsQuerySchema, subscriptionPlanCodeParamsSchema, updateSubscriptionGrantBodySchema, updateSubscriptionPlanBodySchema } from "./operations-subscriptions.validation.js";

export const operationsSubscriptionsRouter = Router();
operationsSubscriptionsRouter.use(asyncHandler(requireOperationsAuth));
operationsSubscriptionsRouter.get("/", requireOperationsPermission("billing", "read"), validate(operationsSubscriptionsQuerySchema, "query"), asyncHandler(operationsSubscriptionsController.list));
operationsSubscriptionsRouter.get("/analytics", requireOperationsPermission("billing", "read"), validate(operationsSubscriptionsAnalyticsQuerySchema, "query"), asyncHandler(operationsSubscriptionsController.analytics));
operationsSubscriptionsRouter.patch("/plans/:code", requireOperationsPermission("billing", "update"), validate(subscriptionPlanCodeParamsSchema, "params"), validate(updateSubscriptionPlanBodySchema, "body"), asyncHandler(operationsSubscriptionsController.updatePlan));
operationsSubscriptionsRouter.patch("/grants/:grantId", requireOperationsPermission("billing", "update"), validate(operationsSubscriptionGrantParamsSchema, "params"), validate(updateSubscriptionGrantBodySchema, "body"), asyncHandler(operationsSubscriptionsController.updateGrant));
operationsSubscriptionsRouter.post("/payment-links", requireOperationsPermission("billing", "update"), validate(createSubscriptionPaymentLinkSchema, "body"), asyncHandler(operationsSubscriptionsController.createPaymentLink));

export default operationsSubscriptionsRouter;
