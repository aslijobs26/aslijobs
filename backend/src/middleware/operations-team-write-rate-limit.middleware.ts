import rateLimit from "express-rate-limit";

/** Sensitive Operations team/role mutations. */
export const operationsTeamWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many team management requests. Please try again later.",
  },
});
