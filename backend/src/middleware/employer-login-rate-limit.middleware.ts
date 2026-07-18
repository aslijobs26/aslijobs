import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../constants/http-status.js";

export const employerLoginSendOtpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again later.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

export const employerLoginVerifyOtpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
