import type { StaticImageData } from "next/image";

export type CategoryIconKey =
  | "drivers"
  | "delivery"
  | "warehouse"
  | "security"
  | "construction"
  | "hospitality"
  | "manufacturing"
  | "view-all";

export type CategoryIconVariant = "primary" | "glow" | "surface";

export type JobCategory = {
  id: string;
  name: string;
  jobCount?: string;
  subtitle?: string;
  icon: CategoryIconKey;
  href: string;
  iconVariant: CategoryIconVariant;
};

export type Employer = {
  id: string;
  name: string;
  initials: string;
  href: string;
  logo?: StaticImageData;
};
