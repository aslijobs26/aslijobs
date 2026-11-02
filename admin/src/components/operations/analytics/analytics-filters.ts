import type { AnalyticsDatePreset } from "../../../types/operations-analytics";

export type AnalyticsFilterDraft = {
  preset: AnalyticsDatePreset;
  dateFrom: string;
  dateTo: string;
  country: string;
  state: string;
  city: string;
  category: string;
  employer: string;
  jobType: string;
  applicationStatus: string;
  horizonDays: number;
};

export function todayKey(now = new Date()): string {
  const shifted = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function validateCustomRange(
  dateFrom: string,
  dateTo: string,
  now = new Date(),
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return "Choose a start date and an end date.";
  }
  if (dateTo < dateFrom) return "End date cannot be earlier than the start date.";
  const today = todayKey(now);
  if (dateFrom > today || dateTo > today) {
    return "Future dates are not accepted for historical reporting.";
  }
  return null;
}

export function filtersFromSearch(params: URLSearchParams): AnalyticsFilterDraft {
  const preset = params.get("preset") || "last_6_months";
  const horizon = Number(params.get("horizon") || "30");
  return {
    preset: preset as AnalyticsDatePreset,
    dateFrom: params.get("from") ?? "",
    dateTo: params.get("to") ?? "",
    country: params.get("country") ?? "",
    state: params.get("state") ?? "",
    city: params.get("city") ?? "",
    category: params.get("category") ?? "",
    employer: params.get("employer") ?? "",
    jobType: params.get("jobType") ?? "",
    applicationStatus: params.get("status") ?? "",
    horizonDays: [7, 14, 30, 60, 90].includes(horizon) ? horizon : 30,
  };
}

export function writeFiltersToSearch(
  current: URLSearchParams,
  draft: AnalyticsFilterDraft,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string, skip: string) => {
    if (!value || value === skip) next.delete(key);
    else next.set(key, value);
  };
  set("preset", draft.preset, "last_6_months");
  set("from", draft.preset === "custom" ? draft.dateFrom : "", "");
  set("to", draft.preset === "custom" ? draft.dateTo : "", "");
  set("country", draft.country, "");
  set("state", draft.state, "");
  set("city", draft.city, "");
  set("category", draft.category, "");
  set("employer", draft.employer, "");
  set("jobType", draft.jobType, "");
  set("status", draft.applicationStatus, "");
  set("horizon", String(draft.horizonDays), "30");
  return next;
}

export function emptyFilters(): AnalyticsFilterDraft {
  return {
    preset: "last_6_months",
    dateFrom: "",
    dateTo: "",
    country: "",
    state: "",
    city: "",
    category: "",
    employer: "",
    jobType: "",
    applicationStatus: "",
    horizonDays: 30,
  };
}
