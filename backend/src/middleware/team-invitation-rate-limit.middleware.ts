import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/http-status.js";

/** Rate-limit invitation preview + acceptance attempts. */
export const teamInvitationAcceptRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many invitation attempts. Please try again later.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
