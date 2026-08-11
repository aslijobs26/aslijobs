import type { StaticImageData } from "next/image";

export type PopularJob = {
  id: string;
  title: string;
  companyName: string;
  companyInitials: string;
  companyLogo?: StaticImageData;
  /** When true, logo fills the badge edge-to-edge (no inner padding). */
  companyLogoBleed?: boolean;
  /** Tailwind/arbitrary background for the logo badge (e.g. brand color). */
  companyLogoBadgeClassName?: string;
  /** Extra image class for logo sizing inside the badge (e.g. padding). */
  companyLogoImageClassName?: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  tags: string[];
  postedAt: string;
  href: string;
};

export type JobLocationItem = {
  id: string;
  name: string;
  jobCount: string;
  href: string;
};

export type JobLocationIconType = "state" | "city";
