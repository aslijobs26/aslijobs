import type {
  WorkItemOrigin,
  WorkItemPriority,
  WorkItemStatus,
  WorkItemType,
  WorkRelatedEntityType,
} from "./operations-work.constants.js";

export type WorkQueueTab = "my_queue" | "waiting" | "completed" | "all";

export type WorkDueFilter =
  | "all"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "upcoming"
  | "do_now";

export interface OperationsWorkHistoryEntry {
  action: string;
  at: string;
  actorUserId: string | null;
  actorName: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string;
  metadata?: Record<string, unknown>;
}

export interface OperationsWorkListItem {
  id: string;
  displayId: string;
  title: string;
  description: string;
  type: WorkItemType;
  typeLabel: string;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  statusLabel: string;
  origin: WorkItemOrigin;
  relatedEntityType: WorkRelatedEntityType | null;
  relatedEntityId: string | null;
  relatedLabel: string;
  relatedLocationLabel: string;
  departmentId: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  dueAt: string | null;
  slaTargetAt: string | null;
  waitingReason: string | null;
  completedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface OperationsWorkDetail extends OperationsWorkListItem {
  createdByUserId: string | null;
  createdByName: string | null;
  assignedByUserId: string | null;
  assignedByName: string | null;
  assignedAt: string | null;
  completedByUserId: string | null;
  history: OperationsWorkHistoryEntry[];
  metadata: Record<string, unknown>;
  sourceEventKey: string | null;
}

export interface OperationsWorkListResult {
  items: OperationsWorkListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  tabs: {
    myQueue: number;
    waiting: number;
    completed: number;
    all: number;
  };
}

export interface OperationsWorkAnalyticsKpis {
  doNow: number;
  doNowCaption: string;
  dueToday: number;
  dueTodayCaption: string;
  upcoming: number;
  upcomingCaption: string;
  waiting: number;
  waitingCaption: string;
  completedToday: number;
  completedTodayCaption: string;
}

export interface OperationsWorkFocusItem {
  id: string;
  title: string;
  current: number;
  target: number;
  status: "on_track" | "at_risk" | "done";
  progressLabel: string;
}

export interface OperationsWorkAnalyticsResult {
  kpis: OperationsWorkAnalyticsKpis;
  focus: OperationsWorkFocusItem[];
  myQueueBadge: number;
}

export interface OperationsWorkPerformanceByType {
  type: WorkItemType;
  typeLabel: string;
  assigned: number;
  completed: number;
}

export interface OperationsWorkPerformanceTrendPoint {
  date: string;
  label: string;
  completed: number;
}

export interface OperationsWorkPerformanceResult {
  assignedOpen: number;
  completedTotal: number;
  completedLast7Days: number;
  completionRatePercent: number | null;
  overdue: number;
  slaOnTrack: number;
  slaBreached: number;
  slaCompliancePercent: number | null;
  averageResolutionHours: number | null;
  averageResponseHours: number | null;
  byType: OperationsWorkPerformanceByType[];
  completionTrend: OperationsWorkPerformanceTrendPoint[];
  rangeFrom: string;
  rangeTo: string;
  generatedAt: string;
}

export interface OperationsWorkBulkAssignResult {
  requested: number;
  succeeded: number;
  failed: number;
  targetType: "department" | "user";
  targetId: string;
  targetLabel: string;
  successful: Array<{
    workItemId: string;
    displayId: string;
  }>;
  failures: Array<{
    workItemId: string;
    displayId: string | null;
    code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "BAD_REQUEST"
      | "TERMINAL"
      | "UNAUTHORIZED";
    reason: string;
  }>;
}

export interface CreateSystemWorkItemInput {
  sourceEventKey: string;
  title: string;
  description?: string;
  type: WorkItemType;
  priority?: WorkItemPriority;
  relatedEntityType: WorkRelatedEntityType;
  relatedEntityId: string;
  relatedLabel?: string;
  relatedLocationLabel?: string;
  departmentId?: string | null;
  dueAt?: Date | null;
  slaTargetAt?: Date | null;
  metadata?: Record<string, unknown>;
  actionPath?: string;
}
