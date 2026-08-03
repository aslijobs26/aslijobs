import rateLimit from "express-rate-limit";

/** Limit unauthenticated registration continuation by employerId. */
export const employerRegistrationContinuationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});
