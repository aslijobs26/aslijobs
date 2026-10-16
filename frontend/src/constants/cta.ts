import { ROUTES } from "./routes";

/** Public-site contact deep link. Official wa.me URL, no pre-filled message. */
export const WHATSAPP_CONTACT_URL = "https://wa.me/919248719057";

const configuredWhatsAppJoinUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_JOIN_URL?.trim() ?? "";

/** Opens the AsliJobs WhatsApp chat. Env override wins when it is a real URL. */
export const WHATSAPP_JOIN_URL =
  configuredWhatsAppJoinUrl.startsWith("http")
    ? configuredWhatsAppJoinUrl
    : WHATSAPP_CONTACT_URL;

export const HERO_CTA_CARDS = [
  {
    id: "whatsapp",
    variant: "whatsapp" as const,
    title: "Join AsliJobs on WhatsApp",
    description: "Get job alerts and apply in seconds",
    actionLabel: "Join on WhatsApp",
    href: WHATSAPP_JOIN_URL,
  },
  {
    id: "employer",
    variant: "employer" as const,
    title: "Looking for Staff?",
    description: "Post a job and hire the right people",
    actionLabel: "Post a Job FREE",
    href: ROUTES.POST_JOB,
  },
  {
    id: "assist",
    variant: "assist" as const,
    title: "Need Help Hiring?",
    description: "Our experts will help you hire faster",
    actionLabel: "Get Hire Assist",
    href: ROUTES.CONTACT,
  },
] as const;
