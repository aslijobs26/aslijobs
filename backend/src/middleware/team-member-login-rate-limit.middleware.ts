import rateLimit from "express-rate-limit";

/** Team member password login — dedicated budget separate from OTP paths. */
export const teamMemberLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});
