import type { StaticImageData } from "next/image";

export type PopularJob = {
  id: string;
  title: string;
  companyName: string;
  companyInitials: string;
  companyLogo?: StaticImageData;
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
