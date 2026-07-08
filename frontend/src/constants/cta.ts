import { ROUTES } from "./routes";

export const WHATSAPP_JOIN_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_JOIN_URL ?? "#";

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
    title: "Are you an Employer?",
    description: "Post jobs, find verified candidates fast",
    actionLabel: "Post a Job",
    href: ROUTES.POST_JOB,
  },
] as const;
