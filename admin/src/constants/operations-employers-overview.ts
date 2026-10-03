import type {
  OperationsEmployerOverviewKpi,
  OperationsEmployersOverviewKpis,
} from "../types/operations-employers";
type NumericKpiKey = {
  [K in keyof OperationsEmployersOverviewKpis]: OperationsEmployersOverviewKpis[K] extends number
    ? K
    : never;
}[keyof OperationsEmployersOverviewKpis];

type CaptionKpiKey = {
  [K in keyof OperationsEmployersOverviewKpis]: K extends `${string}Caption`
    ? K
    : never;
}[keyof OperationsEmployersOverviewKpis];

export interface EmployerOverviewKpiView {
  label: string;
  emptyMessage: string;
  valueKey: NumericKpiKey;
  captionKey: CaptionKpiKey;
}

export const EMPLOYER_OVERVIEW_KPI_VIEWS: Record<
  OperationsEmployerOverviewKpi,
  EmployerOverviewKpiView
> = {
  total: {
    label: "Total Employers",
    emptyMessage: "No employers found.",
    valueKey: "totalEmployers",
    captionKey: "totalEmployersCaption",
  },
  new: {
    label: "New Registrations",
    emptyMessage: "No new registrations found.",
    valueKey: "newRegistrations",
    captionKey: "newRegistrationsCaption",
  },
  verified: {
    label: "Verified Employers",
    emptyMessage: "No verified employers found.",
    valueKey: "verifiedEmployers",
    captionKey: "verifiedEmployersCaption",
  },
  active: {
    label: "Active Employers",
    emptyMessage: "No active employers found.",
    valueKey: "activeEmployers",
    captionKey: "activeEmployersCaption",
  },
  hiring: {
    label: "Employers Hiring",
    emptyMessage: "No employers with active job postings found.",
    valueKey: "employersHiring",
    captionKey: "employersHiringCaption",
  },
};
