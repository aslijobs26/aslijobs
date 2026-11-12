import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/http-status.js";
import { sendSuccess } from "../../utils/api-response.js";
import { reverseGeocodeLanguageRegion } from "./language-region.service.js";
import type { ReverseGeocodeBody } from "./language-region.validation.js";

export const languageRegionController = {
  async resolve(req: Request, res: Response): Promise<void> {
    const body = req.body as ReverseGeocodeBody;
    const region = await reverseGeocodeLanguageRegion(body.lat, body.lon, {
      requestId: req.requestId,
    });
    sendSuccess(res, HTTP_STATUS.OK, {
      message: "Language region resolved.",
      data: region,
    });
  },
};
