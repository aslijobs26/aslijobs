import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
} from "./whatsapp-webhook.controller.js";

const whatsappRouter = Router();

/**
 * Dedicated webhook limiter. Path is exempt from the global API limiter so Meta
 * delivery is not blocked by other traffic — still bound abuse (unsigned POSTs,
 * verify-token guessing) without being so tight that legitimate bursts fail.
 */
const whatsappWebhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests" },
});

whatsappRouter.get("/webhook", whatsappWebhookRateLimit, verifyWhatsAppWebhook);
whatsappRouter.post("/webhook", whatsappWebhookRateLimit, receiveWhatsAppWebhook);

export default whatsappRouter;
