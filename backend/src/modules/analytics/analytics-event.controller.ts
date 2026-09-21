import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { trackAnalyticsEvent } from "./analytics-event.service.js";
import type { TrackAnalyticsEventBody } from "./analytics-event.validation.js";

export const analyticsEventController = {
  async track(req: Request, res: Response): Promise<void> {
    const body = req.body as TrackAnalyticsEventBody;
    const data = await trackAnalyticsEvent(body);
    sendSuccess(res, HTTP_STATUS.CREATED, {
      message: "Analytics event recorded.",
      data,
    });
  },
};
