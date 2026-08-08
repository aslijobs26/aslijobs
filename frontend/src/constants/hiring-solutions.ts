import type { HiringSolution } from "@/types/hiring-solutions";
import { ROUTES } from "./routes";

export const HIRING_SOLUTIONS_SECTION = {
  title: "Hiring Solutions for Every Need",
  description: "Choose the perfect solution to find the right talent",
  compareLabel: "Compare Solutions →",
  compareHref: ROUTES.CONTACT,
} as const;

export const HIRING_SOLUTIONS: readonly HiringSolution[] = [
  {
    id: "free-job-post",
    title: "FREE JOB POST",
    subtitle: "Best for small employers",
    features: [
      "Post unlimited jobs",
      "Receive applications",
      "Manage candidates",
    ],
    actionLabel: "Post Job FREE",
    href: ROUTES.POST_JOB,
  },
  {
    id: "job-boosters",
    title: "JOB BOOSTERS",
    subtitle: "Need faster hiring?",
    features: [
      "Reach more candidates",
      "Priority in search results",
      "Highlight your job",
    ],
    actionLabel: "Boost Job",
    href: ROUTES.CONTACT,
  },
  {
    id: "hire-assist",
    title: "HIRE ASSIST",
    subtitle: "We'll help you hire",
    features: [
      "Dedicated hiring expert",
      "Shortlist best candidates",
      "End-to-end support",
    ],
    actionLabel: "Get Hire Assist",
    href: ROUTES.CONTACT,
  },
  {
    id: "business-hiring",
    title: "BUSINESS HIRING",
    subtitle: "Hiring every month?",
    features: [
      "Volume hiring support",
      "Custom hiring solution",
      "Account manager",
    ],
    actionLabel: "Contact Sales",
    href: ROUTES.CONTACT,
  },
] as const;
