import type { AsliJobsBenefit } from "@/types/trust-resources";

export const ASLI_JOBS_BENEFITS: AsliJobsBenefit[] = [
  {
    id: "whatsapp-first",
    title: "WhatsApp First",
    description: "No app installation.\nUse WhatsApp\nto find and apply.",
    icon: "whatsapp",
    iconVariant: "primary",
  },
  {
    id: "multi-language-support",
    title: "Multi-Language\nSupport",
    description: "Search and apply\nin your language.",
    icon: "languages",
    iconVariant: "glow",
  },
  {
    id: "voice-search",
    title: "Voice Search",
    description: "Just speak and\nfind the right jobs\nnear you.",
    icon: "voice",
    iconVariant: "surface",
  },
  {
    id: "verified-employers",
    title: "Verified Employers",
    description: "All employers are\nverified for your\nsafety.",
    icon: "verified",
    iconVariant: "primary",
  },
  {
    id: "ai-job-matching",
    title: "AI Job Matching",
    description:
      "Get job recommendations\nthat match your skills\nand location.",
    icon: "ai-matching",
    iconVariant: "glow",
  },
  {
    id: "free-for-job-seekers",
    title: "Free for Job Seekers",
    description: "Create profile, search\njobs and apply\ncompletely free.",
    icon: "free",
    iconVariant: "surface",
  },
];
