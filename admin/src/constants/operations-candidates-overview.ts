import type { CandidatesFiltersState } from "../components/operations/candidates/CandidatesFiltersBar";
import type {
  OperationsCandidateOverviewKpi,
  OperationsCandidatesFilterOptions,
  OperationsCandidatesOverviewKpis,
} from "../types/operations-candidates";
import {
  OPERATIONS_CANDIDATE_GENDERS,
  OPERATIONS_CANDIDATE_GENDER_LABELS,
} from "./operations-candidates";

export const EMPTY_CANDIDATES_FILTERS: CandidatesFiltersState = {
  search: "",
  location: "",
  experience: "",
  gender: "",
  preferredRole: "",
  profileStatus: "",
  applicationPresence: "",
  registrationPreset: "",
};

/** Filter dropdown options shown before the list response provides real ones. */
export const EMPTY_CANDIDATES_FILTER_OPTIONS: OperationsCandidatesFilterOptions = {
  jobs: [],
  employers: [],
  locations: [],
  experienceLevels: [],
  genders: OPERATIONS_CANDIDATE_GENDERS.map((value) => ({
    value,
    label: OPERATIONS_CANDIDATE_GENDER_LABELS[value],
  })),
  preferredRoles: [],
  profileStatuses: [],
};

export interface CandidateOverviewKpiView {
  label: string;
  emptyMessage: string;
  valueKey: keyof Pick<
    OperationsCandidatesOverviewKpis,
    | "totalJobseekers"
    | "newRegistrations"
    | "profileCompleted"
    | "verifiedJobseekers"
    | "activeJobseekers"
  >;
  trendKey: keyof Pick<
    OperationsCandidatesOverviewKpis,
    | "totalJobseekersTrendPercent"
    | "newRegistrationsTrendPercent"
    | "profileCompletedTrendPercent"
    | "verifiedJobseekersTrendPercent"
    | "activeJobseekersTrendPercent"
  >;
  captionKey: keyof Pick<
    OperationsCandidatesOverviewKpis,
    | "totalJobseekersCaption"
    | "newRegistrationsCaption"
    | "profileCompletedCaption"
    | "verifiedJobseekersCaption"
    | "activeJobseekersCaption"
  >;
}

export const CANDIDATE_OVERVIEW_KPI_VIEWS: Record<
  OperationsCandidateOverviewKpi,
  CandidateOverviewKpiView
> = {
  total: {
    label: "Total Jobseekers",
    emptyMessage: "No jobseekers found.",
    valueKey: "totalJobseekers",
    trendKey: "totalJobseekersTrendPercent",
    captionKey: "totalJobseekersCaption",
  },
  new: {
    label: "New Registrations",
    emptyMessage: "No new registrations found.",
    valueKey: "newRegistrations",
    trendKey: "newRegistrationsTrendPercent",
    captionKey: "newRegistrationsCaption",
  },
  complete: {
    label: "Registration Complete",
    emptyMessage: "No jobseekers with completed registration found.",
    valueKey: "profileCompleted",
    trendKey: "profileCompletedTrendPercent",
    captionKey: "profileCompletedCaption",
  },
  verified: {
    label: "WhatsApp Verified",
    emptyMessage: "No WhatsApp verified jobseekers found.",
    valueKey: "verifiedJobseekers",
    trendKey: "verifiedJobseekersTrendPercent",
    captionKey: "verifiedJobseekersCaption",
  },
  active: {
    label: "Active Jobseekers",
    emptyMessage: "No active jobseekers found.",
    valueKey: "activeJobseekers",
    trendKey: "activeJobseekersTrendPercent",
    captionKey: "activeJobseekersCaption",
  },
};
