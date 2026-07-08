import type { WorkflowStep } from "@/types/trust-resources";

export const HOW_IT_WORKS_SUBTITLE =
  "Find jobs on WhatsApp in 4 simple steps";

export const HOW_IT_WORKS_STEPS: WorkflowStep[] = [
  {
    id: "join-whatsapp",
    stepNumber: 1,
    title: "Join on WhatsApp",
    description:
      "Click ‘Join on WhatsApp’\nand start chatting with\nAsliJobs Bot.",
    icon: "whatsapp",
    iconVariant: "primary",
  },
  {
    id: "choose-language",
    stepNumber: 2,
    title: "Choose Language",
    description:
      "Select your preferred\nlanguage and tell us what\nyou’re looking for.",
    icon: "language",
    iconVariant: "glow",
  },
  {
    id: "get-job-matches",
    stepNumber: 3,
    title: "Get Job Matches",
    description:
      "Receive relevant job\nlistings instantly in\nWhatsApp.",
    icon: "search",
    iconVariant: "primary",
  },
  {
    id: "apply-get-hired",
    stepNumber: 4,
    title: "Apply & Get Hired",
    description:
      "Apply in one click and get\nconnected with employers\nquickly.",
    icon: "apply",
    iconVariant: "glow",
  },
];
