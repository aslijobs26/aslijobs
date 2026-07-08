import type { CategoryIconVariant } from "@/types/discovery";

export type BenefitIconKey =
  | "whatsapp"
  | "languages"
  | "voice"
  | "verified"
  | "ai-matching"
  | "free";

export type AsliJobsBenefit = {
  id: string;
  title: string;
  description: string;
  icon: BenefitIconKey;
  iconVariant: CategoryIconVariant;
};

export type WorkflowIconKey =
  | "whatsapp"
  | "language"
  | "search"
  | "apply";

export type WorkflowStep = {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  icon: WorkflowIconKey;
  iconVariant: CategoryIconVariant;
};

export type ResourceIconKey =
  | "guide"
  | "resume"
  | "interview"
  | "salary"
  | "career";

export type ResourceSurfaceVariant =
  | "guide"
  | "resume"
  | "interview"
  | "salary"
  | "career";

export type JobSeekerResource = {
  id: string;
  title: string;
  description: string;
  icon: ResourceIconKey;
  surfaceVariant: ResourceSurfaceVariant;
  iconVariant: CategoryIconVariant;
  href: string;
};
