import rateLimit from "express-rate-limit";

/** Operations team password login — separate budget from employer/job seeker paths. */
export const operationsLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
