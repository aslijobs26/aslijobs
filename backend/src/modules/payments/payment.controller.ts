import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendSuccess } from "../../utils/api-response.js";
import { paymentService } from "./payment.service.js";
import { paymentLinkService } from "./payment-link.service.js";
import type { CreatePaymentOrderBody } from "./payment.validation.js";

function requireEmployerId(req: Request): string {
  const employerId = req.employerId?.trim();
  if (!employerId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }
  return employerId;
}

export const paymentController = {
  createOrder: async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const body = req.body as CreatePaymentOrderBody;
    const result = await paymentService.createOrder({
      employerId,
      teamMemberId: req.teamMemberId ?? null,
      planCode: body.planCode,
    });
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Payment order created.",
      data: result,
    });
  },

  listOrders: async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    sendSuccess(res, HTTP_STATUS.OK, {
      data: await paymentService.listMyOrders(employerId),
    });
  },

  getOrder: async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    sendSuccess(res, HTTP_STATUS.OK, {
      data: await paymentService.getMyOrder(employerId, String(req.params.orderId)),
    });
  },

  downloadInvoice: async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    const file = await paymentService.getMyOrderInvoice(
      employerId,
      String(req.params.orderId),
    );
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    res.setHeader("Content-Length", String(file.buffer.length));
    res.setHeader("Cache-Control", "private, no-store");
    res.status(HTTP_STATUS.OK).send(file.buffer);
  },

  verifyOrder: async (req: Request, res: Response): Promise<void> => {
    const employerId = requireEmployerId(req);
    sendSuccess(res, HTTP_STATUS.OK, {
      data: await paymentService.verifyMyOrder(employerId, String(req.params.orderId)),
    });
  },

  getPublicPaymentLink: async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, HTTP_STATUS.OK, { data: await paymentLinkService.getPublic(String(req.params.token)) });
  },
  verifyPublicPaymentLink: async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, HTTP_STATUS.OK, { data: await paymentLinkService.verifyPublic(String(req.params.token)) });
  },
};
