import type { AttentionTabId } from "./operations-dashboard";

export type AttentionPriority = "P1" | "P2" | "P3";

export type AttentionDueTone = "danger" | "warning" | "neutral";

export type AttentionWorkType =
  | "verification"
  | "support"
  | "risk"
  | "job_operations"
  | "hiring_operations"
  | "payments"
  | "others";

export type AttentionStatus =
  | "in_progress"
  | "open"
  | "queued"
  | "waiting";

/** Full work-queue tab set (includes All for the detailed page). */
export type AttentionQueueTabId = "all" | AttentionTabId;

export interface AttentionOwner {
  name: string;
  initials: string;
}

export interface AttentionWorkItem {
  id: string;
  displayId: string;
  priority: AttentionPriority;
  title: string;
  subtitle: string;
  workType: AttentionWorkType;
  workTypeLabel: string;
  relatedTo: string;
  locationLabel: string;
  owner: AttentionOwner | null;
  createdAgo: string;
  dueLabel: string;
  dueTone: AttentionDueTone;
  status: AttentionStatus;
  statusLabel: string;
  actionLabel: string;
  actionHref: string;
  tabs: AttentionTabId[];
}

export interface AttentionSummaryCard {
  id: AttentionQueueTabId;
  label: string;
  value: number;
  detail: string;
  tone: "total" | "urgent" | "sla" | "priority" | "unassigned";
}

export interface AttentionTabMeta {
  id: AttentionQueueTabId;
  label: string;
  count: number;
}

export interface AttentionQuickFilter {
  id: string;
  label: string;
  count: number;
}

export interface AttentionSlaStatusItem {
  id: string;
  label: string;
  count: number;
  tone: "success" | "warning" | "danger";
}

export interface AttentionWorkByTypeItem {
  id: string;
  workType: AttentionWorkType;
  label: string;
  count: number;
}

export interface OperationsAttentionData {
  total: number;
  summary: AttentionSummaryCard[];
  tabs: AttentionTabMeta[];
  items: AttentionWorkItem[];
  quickFilters: AttentionQuickFilter[];
  slaStatus: AttentionSlaStatusItem[];
  workByType: AttentionWorkByTypeItem[];
}
