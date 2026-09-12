export type WorkItemPriority = "P1" | "P2" | "P3";

export type WorkItemStatus =
  | "queued"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type WorkItemType =
  | "verification"
  | "support"
  | "job_operations"
  | "jobseeker"
  | "hiring_operations"
  | "placements"
  | "employer";

export type WorkQueueTab = "my_queue" | "waiting" | "completed" | "all";

export type WorkDueFilter =
  | "all"
  | "overdue"
  | "due_today"
  | "due_soon"
  | "upcoming"
  | "do_now";

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
  origin: "system_generated" | "manual";
  relatedEntityType: string | null;
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

export interface OperationsWorkHistoryEntry {
  action: string;
  at: string;
  actorUserId: string | null;
  actorName: string;
  fromStatus: string | null;
  toStatus: string | null;
  note: string;
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

export interface OperationsWorkListParams {
  page: number;
  limit: number;
  tab: WorkQueueTab;
  type: string;
  priority: string;
  due: WorkDueFilter;
  search: string;
  sort?: "dueAt" | "priority" | "createdAt" | "updatedAt";
  order?: "asc" | "desc";
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

export interface OperationsWorkAnalyticsResult {
  kpis: {
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
  };
  focus: Array<{
    id: string;
    title: string;
    current: number;
    target: number;
    status: "on_track" | "at_risk" | "done";
    progressLabel: string;
  }>;
  myQueueBadge: number;
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
  byType: Array<{
    type: WorkItemType;
    typeLabel: string;
    assigned: number;
    completed: number;
  }>;
  completionTrend: Array<{
    date: string;
    label: string;
    completed: number;
  }>;
  rangeFrom?: string;
  rangeTo?: string;
  generatedAt: string;
}

export interface EligibleAssignee {
  id: string;
  fullName: string;
  email: string | null;
  roleId: string | null;
  departmentId: string | null;
}

export interface EligibleDepartment {
  id: string;
  name: string;
  slug: string;
}

export interface OperationsWorkBulkAssignResult {
  requested: number;
  succeeded: number;
  failed: number;
  targetType: "department" | "user";
  targetId: string;
  targetLabel: string;
  successful: Array<{ workItemId: string; displayId: string }>;
  failures: Array<{
    workItemId: string;
    displayId: string | null;
    code: string;
    reason: string;
  }>;
}

export interface AssignWorkInput {
  assignedToUserId: string;
  dueAt?: string | null;
  priority?: WorkItemPriority;
  expectedRevision: number;
}

export interface UpdateWorkStatusInput {
  status: WorkItemStatus;
  waitingReason?: string | null;
  expectedRevision: number;
  note?: string;
}
