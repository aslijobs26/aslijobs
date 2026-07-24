import type { PublicJobSort } from "@/services/public-jobs.service";

export type JobSearchUrlState = {
  q: string;
  within: string;
  state: string;
  cities: string[];
  jobType: string[];
  experience: string[];
  gender: string;
  workMode: string[];
  minSalary: number | undefined;
  maxSalary: number | undefined;
  sort: PublicJobSort;
  page: number;
  job: string;
};

export type JobSearchLocationValue = {
  label: string;
  state: string;
  city: string;
};
