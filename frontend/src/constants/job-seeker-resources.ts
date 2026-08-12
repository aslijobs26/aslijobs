import type { JobSeekerResource } from "@/types/trust-resources";
import { ROUTES } from "./routes";

export const JOB_SEEKER_RESOURCES: JobSeekerResource[] = [
  {
    id: "job-seeker-guide",
    title: "Job Seeker Guide",
    description:
      "Tips to create profile,\nsearch jobs and\ncrack interviews.",
    icon: "guide",
    surfaceVariant: "guide",
    iconVariant: "primary",
    href: ROUTES.JOB_SEEKER_GUIDE,
  },
  {
    id: "resume-builder",
    title: "Resume Builder",
    description: "Create a professional\nresume in minutes.",
    icon: "resume",
    surfaceVariant: "resume",
    iconVariant: "glow",
    href: `${ROUTES.RESOURCES}?resource=resume-builder`,
  },
  {
    id: "interview-tips",
    title: "Interview Tips",
    description: "Prepare for interviews\nand get hired faster.",
    icon: "interview",
    surfaceVariant: "interview",
    iconVariant: "surface",
    href: `${ROUTES.RESOURCES}?resource=interview-tips`,
  },
  {
    id: "salary-guide",
    title: "Salary Guide",
    description: "Know the right salary\nfor your role.",
    icon: "salary",
    surfaceVariant: "salary",
    iconVariant: "primary",
    href: `${ROUTES.RESOURCES}?resource=salary-guide`,
  },
  {
    id: "career-advice",
    title: "Career Advice",
    description: "Guidance to grow\nyour career.",
    icon: "career",
    surfaceVariant: "career",
    iconVariant: "glow",
    href: `${ROUTES.RESOURCES}?resource=career-advice`,
  },
];
