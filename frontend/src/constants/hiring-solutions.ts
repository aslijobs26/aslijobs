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
      "1 Free Job Post",
      "1 City or Region Targeting",
      "Unlimited Candidate Responses",
    ],
    actionLabel: "Post Job FREE",
    href: ROUTES.POST_JOB,
  },
  {
    id: "job-boosters",
    title: "JOB BOOSTERS",
    subtitle: "Need faster hiring?",
    features: [
      "1 Active Job Post",
      "2 City or Region Targeting",
      "Unlimited Candidate Responses",
      "AI Candidate Shortlisting",
    ],
    actionLabel: "Boost Job",
    href: ROUTES.CONTACT,
  },
  {
    id: "hire-assist",
    title: "HIRE ASSIST",
    subtitle: "We'll help you hire",
    features: [
      "5 Free Job Post",
      "5 City or Region Targeting",
      "Unlimited Candidate Responses",
      "AI sourcing & shortlisting",
      "Candidate data access",
    ],
    actionLabel: "Get Hire Assist",
    href: ROUTES.CONTACT,
  },
  {
    id: "business-hiring",
    title: "BUSINESS HIRING",
    subtitle: "Hiring every month?",
    features: [
      "Unlimited Job Post",
      "5 City or Region Targeting",
      "Unlimited Candidate Responses",
      "AI sourcing, shortlisting & coordination",
      "Bulk Hiring Support",
      "Dedicated Account Manager",
    ],
    actionLabel: "Contact Sales",
    href: ROUTES.CONTACT,
  },
] as const;
