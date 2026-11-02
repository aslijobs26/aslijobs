export const DRILLDOWN_METRICS = [
  "applications",
  "interviews-completed",
  "selected",
  "joined",
  "employers",
  "visitors",
] as const;

export type DrilldownMetric = (typeof DRILLDOWN_METRICS)[number];

const KPI_TO_METRIC: Record<string, DrilldownMetric> = {
  applications: "applications",
  "interviews-completed": "interviews-completed",
  selected: "selected",
  joined: "joined",
  "verified-employers": "employers",
  "unique-visitors": "visitors",
};

export function drilldownMetricForKpi(kpiId: string): DrilldownMetric | null {
  return KPI_TO_METRIC[kpiId] ?? null;
}
