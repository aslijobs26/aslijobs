import { countWebsiteTraffic } from "../../analytics/analytics-event.service.js";
import type { OperationsAnalyticsOverviewQuery } from "./operations-analytics.validation.js";

const INDIA = new Set(["", "india", "in", "bharat"]);

export function countryIsOutOfScope(country: string): boolean {
  return !INDIA.has(country.trim().toLowerCase());
}

export function hasRecordFilters(query: OperationsAnalyticsOverviewQuery): boolean {
  return Boolean(
    query.state.trim() ||
      query.city.trim() ||
      query.category.trim() ||
      query.employer.trim() ||
      query.jobType ||
      query.applicationStatus ||
      countryIsOutOfScope(query.country),
  );
}

export async function previousWebsiteCounts(
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {},
) {
  return countWebsiteTraffic(from, to, extra);
}
