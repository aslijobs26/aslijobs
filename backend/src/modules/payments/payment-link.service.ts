import crypto from "node:crypto";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { EmployerModel } from "../employers/employer.model.js";
import { resolveSubscriptionPlans } from "../subscriptions/subscription-plan.service.js";
import { PaymentOrderModel } from "./payment-order.model.js";
import { PaymentLinkModel } from "./payment-link.model.js";
import { paymentService } from "./payment.service.js";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const paymentLinkService = {
  async create(input: { employerId: string; planCode: string; discountPercent: number; expiryHours: number; customPlan?: { name?: string; priceInr: number; jobCredits: number; listingValidityDays: number; maxCities: number } }) {
    if (!mongoose.Types.ObjectId.isValid(input.employerId)) throw new AppError("Choose an employer.", HTTP_STATUS.BAD_REQUEST);
    if (![1, 6, 24].includes(input.expiryHours)) throw new AppError("Choose a valid link expiry.", HTTP_STATUS.BAD_REQUEST);
    if (!Number.isFinite(input.discountPercent) || input.discountPercent < 0 || input.discountPercent > 100) throw new AppError("Discount must be between 0 and 100%.", HTTP_STATUS.BAD_REQUEST);
    const employer = await EmployerModel.findById(input.employerId).select("emailAddress whatsappNumber").lean();
    if (!employer) throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    if (!employer.whatsappNumber) throw new AppError("This employer has no WhatsApp number on their account.", HTTP_STATUS.BAD_REQUEST);

    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + input.expiryHours * 60 * 60 * 1000);
    const url = `${env.FRONTEND_URL.replace(/\/$/, "")}/pay/${token}`;
    const order = await paymentService.createOrder({
      employerId: input.employerId,
      planCode: input.planCode,
      customPlan: input.customPlan,
      discountPercent: input.discountPercent,
      expiresInMinutes: input.expiryHours * 60,
      returnUrl: `${url}?order_id={order_id}`,
      allowReuse: false,
    });
    await PaymentLinkModel.create({ tokenHash: hashToken(token), orderId: order.orderId, status: "active", expiresAt });
    const plan = (await resolveSubscriptionPlans())[input.planCode as keyof Awaited<ReturnType<typeof resolveSubscriptionPlans>>];
    return {
      url,
      orderId: order.orderId,
      employerEmail: employer.emailAddress ?? "",
      employerPhone: employer.whatsappNumber,
      planName: order.planName || plan?.name || input.planCode,
      planPrice: order.planPrice ?? order.baseAmount + (order.discountAmount ?? 0),
      discountPercent: input.discountPercent,
      discountAmount: order.discountAmount ?? 0,
      baseAmount: order.baseAmount,
      gstRatePercent: order.gstRatePercent,
      gstAmount: order.gstAmount,
      amount: order.amount,
      jobCredits: input.customPlan?.jobCredits ?? plan?.jobCredits ?? 0,
      listingValidityDays: input.customPlan?.listingValidityDays ?? plan?.listingValidityDays ?? 0,
      maxCities: input.customPlan?.maxCities ?? plan?.maxCities ?? 0,
      expiresAt: expiresAt.toISOString(),
    };
  },

  async getPublic(token: string) {
    const link = await PaymentLinkModel.findOne({ tokenHash: hashToken(token), status: { $in: ["active", "paid"] } }).lean();
    if (!link) throw new AppError("This payment link is invalid or has already been used.", HTTP_STATUS.NOT_FOUND);
    if (link.status !== "paid" && link.expiresAt <= new Date()) {
      await PaymentLinkModel.updateOne({ _id: link._id }, { $set: { status: "expired" } });
      throw new AppError("This payment link has expired. Please ask the sender for a new one.", HTTP_STATUS.GONE);
    }
    const order = await PaymentOrderModel.findOne({ orderId: link.orderId }).select("+paymentSessionId").lean();
    if (!order || (order.status !== "paid" && !["created", "failed", "user_dropped"].includes(order.status)) || (order.status !== "paid" && !order.paymentSessionId)) throw new AppError("This payment link is no longer available.", HTTP_STATUS.GONE);
    return { orderId: order.orderId, planName: order.planName, amount: order.amount, baseAmount: order.baseAmount ?? order.amount, gstAmount: order.gstAmount ?? 0, discountPercent: order.discountPercent ?? 0, discountAmount: order.discountAmount ?? 0, jobCredits: order.jobCredits, listingValidityDays: order.listingValidityDays, maxCities: order.maxCities, currency: order.currency, paymentSessionId: order.paymentSessionId, environment: order.environment, expiresAt: link.expiresAt.toISOString(), status: order.status };
  },

  async verifyPublic(token: string) {
    const link = await PaymentLinkModel.findOne({ tokenHash: hashToken(token), status: { $in: ["active", "paid"] } }).lean();
    if (!link) throw new AppError("This payment link is invalid or has expired.", HTTP_STATUS.NOT_FOUND);
    if (link.expiresAt <= new Date()) {
      await PaymentLinkModel.updateOne({ _id: link._id }, { $set: { status: "expired" } });
      throw new AppError("This payment link has expired. Please ask the sender for a new one.", HTTP_STATUS.GONE);
    }
    const result = await paymentService.reconcileOrder(link.orderId);
    if (result.status === "paid") await PaymentLinkModel.updateOne({ _id: link._id }, { $set: { status: "paid" } });
    return result;
  },
};
