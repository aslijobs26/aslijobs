import { Router } from "express";
import {
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
} from "./whatsapp-webhook.controller.js";

const whatsappRouter = Router();

whatsappRouter.get("/webhook", verifyWhatsAppWebhook);
whatsappRouter.post("/webhook", receiveWhatsAppWebhook);

export default whatsappRouter;
