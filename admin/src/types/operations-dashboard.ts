import type {
  AttentionPriority,
  AttentionWorkItem,
} from "./operations-attention";

export type { AttentionPriority, AttentionWorkItem };
export type { AttentionDueTone } from "./operations-attention";

export type TrendDirection = "up" | "down" | "neutral";

export type AttentionTabId =
  | "urgent"
  | "sla_risk"
  | "high_priority"
  | "unassigned";

export type OperationsHealthStatus = "healthy" | "needs_attention" | "sla_risk";

export interface PlatformPulseMetric {
  id: string;
  label: string;
  value: number | null;
  trendPercent: number | null;
  trendDirection: TrendDirection;
  todayChange: number | null;
  href: string;
  iconTone: "blue" | "purple" | "green" | "orange" | "red";
}

export interface AttentionTabMeta {
  id: AttentionTabId;
  label: string;
  count: number;
}

export interface OperationsHealthItem {
  id: string;
  label: string;
  status: OperationsHealthStatus;
  detail: string;
  href: string;
}

export interface TeamWorkloadMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  assigned: number;
  capacity: number;
}

export interface TodaysActivityMetric {
  id: string;
  label: string;
  value: number | null;
  href: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  href: string;
  icon: "jobseeker" | "employer" | "job" | "support";
}

export interface AsliInsightItem {
  id: string;
  message: string;
  actionLabel: string;
  href: string;
}

export interface OperationsDashboardData {
  platformPulse: PlatformPulseMetric[];
  attentionTotal: number;
  attentionTabs: AttentionTabMeta[];
  attentionItems: AttentionWorkItem[];
  operationsHealth: OperationsHealthItem[];
  teamWorkload: TeamWorkloadMember[];
  todaysActivity: TodaysActivityMetric[];
  quickActions: QuickActionItem[];
  insights: AsliInsightItem[];
}
