import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireEmployerAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { paymentController } from "./payment.controller.js";
import {
  createPaymentOrderBodySchema,
  paymentOrderIdParamsSchema,
} from "./payment.validation.js";

const paymentRouter = Router();

/** Webhook path is exempt from the global limiter (see app.ts); bound it here. */
const cashfreeWebhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests" },
});

const createOrderRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment attempts. Please wait and try again." },
});

paymentRouter.post(
  "/webhooks/cashfree",
  cashfreeWebhookRateLimit,
  asyncHandler(paymentController.cashfreeWebhook),
);

paymentRouter.post(
  "/orders",
  createOrderRateLimit,
  asyncHandler(requireEmployerAuth),
  validate(createPaymentOrderBodySchema, "body"),
  asyncHandler(paymentController.createOrder),
);

paymentRouter.get(
  "/orders",
  asyncHandler(requireEmployerAuth),
  asyncHandler(paymentController.listOrders),
);

paymentRouter.get(
  "/orders/:orderId",
  asyncHandler(requireEmployerAuth),
  validate(paymentOrderIdParamsSchema, "params"),
  asyncHandler(paymentController.getOrder),
);

paymentRouter.get(
  "/orders/:orderId/invoice",
  asyncHandler(requireEmployerAuth),
  validate(paymentOrderIdParamsSchema, "params"),
  asyncHandler(paymentController.downloadInvoice),
);

paymentRouter.post(
  "/orders/:orderId/verify",
  asyncHandler(requireEmployerAuth),
  validate(paymentOrderIdParamsSchema, "params"),
  asyncHandler(paymentController.verifyOrder),
);

export default paymentRouter;
