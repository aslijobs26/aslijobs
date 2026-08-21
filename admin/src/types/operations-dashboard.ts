export type TrendDirection = "up" | "down" | "neutral";

export type PriorityLevel = "high" | "medium" | "low";

export type EntityType = "employer" | "candidate" | "job" | "verification" | "support";

export interface OperationsKpiMetric {
  id: string;
  label: string;
  value: number;
  trendLabel: string;
  trendDirection: TrendDirection;
  iconTone: "blue" | "red" | "orange" | "purple" | "teal" | "violet";
}

export interface PriorityQueueItem {
  id: string;
  type: EntityType;
  customer: string;
  task: string;
  priority: PriorityLevel;
  language: string;
  assignedTo: { name: string; initials: string } | null;
  slaRemainingMinutes: number;
}

export interface SlaCategoryMetric {
  id: string;
  label: string;
  percentage: number;
}

export interface AiNextBestAction {
  id: string;
  title: string;
  description: string;
  tone: "whatsapp" | "insight" | "compliance";
}

export interface JourneyAlertItem {
  id: string;
  label: string;
  count: number;
  trendDirection: TrendDirection;
  trendValue: string;
}

export interface WhatsAppActivityMetric {
  id: string;
  label: string;
  value: string;
  subLabel?: string;
}

export interface TeamWorkloadMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  assigned: number;
  capacity: number;
}

export type EscalationChartColorToken =
  | "danger"
  | "warning"
  | "chartAccentAlt"
  | "chartAccent";

export interface EscalationBreakdownItem {
  id: string;
  label: string;
  count: number;
  colorToken: EscalationChartColorToken;
}

export type SnapshotAccentTone =
  | "primary"
  | "teal"
  | "success"
  | "warning"
  | "violet"
  | "whatsapp";

export interface OperationsSnapshotMetric {
  id: string;
  label: string;
  value: string;
  trendLabel: string;
  trendDirection: TrendDirection;
  accentTone: SnapshotAccentTone;
}

export interface OperationsDashboardData {
  kpis: OperationsKpiMetric[];
  priorityQueue: PriorityQueueItem[];
  slaOverall: number;
  slaTarget: number;
  slaCategories: SlaCategoryMetric[];
  aiActions: AiNextBestAction[];
  journeyAlerts: JourneyAlertItem[];
  whatsappActivity: WhatsAppActivityMetric[];
  teamWorkload: TeamWorkloadMember[];
  escalations: EscalationBreakdownItem[];
  snapshot: OperationsSnapshotMetric[];
}
