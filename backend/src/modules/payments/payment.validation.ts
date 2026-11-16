import { z } from "zod";
import { PURCHASABLE_PLAN_CODES } from "../subscriptions/subscription.constants.js";

export const createPaymentOrderBodySchema = z.object({
  planCode: z.enum(PURCHASABLE_PLAN_CODES, {
    message: "Choose a valid plan",
  }),
});

export const paymentOrderIdParamsSchema = z.object({
  orderId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,45}$/, "Invalid order id"),
});

export type CreatePaymentOrderBody = z.infer<typeof createPaymentOrderBodySchema>;
