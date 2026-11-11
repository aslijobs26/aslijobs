import { EMPLOYER_ACCOUNT_TOURS } from "./employer-account-tours";
import { EMPLOYER_CANDIDATES_TOURS } from "./employer-candidates-tours";
import { EMPLOYER_ENGAGEMENT_TOURS } from "./employer-engagement-tours";
import { EMPLOYER_HOME_JOBS_TOURS } from "./employer-home-jobs-tours";
import type { ProductTourDefinition } from "./types";

export const EMPLOYER_TOURS: readonly ProductTourDefinition[] = [
  ...EMPLOYER_HOME_JOBS_TOURS,
  ...EMPLOYER_CANDIDATES_TOURS,
  ...EMPLOYER_ENGAGEMENT_TOURS,
  ...EMPLOYER_ACCOUNT_TOURS,
];
