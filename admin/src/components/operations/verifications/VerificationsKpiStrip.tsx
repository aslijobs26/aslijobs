/**
 * Legacy KPI strip — prefer `VerificationsOverviewKpiStrip` for the overview page.
 * Re-exports overview strip for any remaining callers.
 */
export {
  VerificationsOverviewKpiStrip as VerificationsKpiStrip,
} from "./overview/VerificationsOverviewKpiStrip";
