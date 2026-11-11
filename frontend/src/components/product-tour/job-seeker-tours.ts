import { JOB_SEEKER_CORE_TOURS } from "./job-seeker-core-tours";
import { JOB_SEARCH_PAGE_TOURS, JOB_SEEKER_MORE_TOURS } from "./job-seeker-more-tours";
import type { ProductTourDefinition } from "./types";

export const JOB_SEEKER_TOURS: readonly ProductTourDefinition[] = [
  ...JOB_SEEKER_CORE_TOURS,
  ...JOB_SEEKER_MORE_TOURS,
];

export const JOB_SEARCH_TOURS: readonly ProductTourDefinition[] = JOB_SEARCH_PAGE_TOURS;
