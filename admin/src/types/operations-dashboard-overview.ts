export type DashboardDatePreset =
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "custom";

export type DashboardTaskTab =
  | "all"
  | "pending"
  | "in_progress"
  | "overdue"
  | "completed";

export interface OperationsDashboardOverviewParams {
  datePreset: DashboardDatePreset;
  dateFrom?: string;
  dateTo?: string;
  state?: string;
  departmentId?: string;
  taskTab?: DashboardTaskTab;
  taskSearch?: string;
  taskLimit?: number;
}

export interface OperationsDashboardOverview {
  filters: {
    datePreset: string;
    dateLabel: string;
    dateFrom: string;
    dateTo: string;
    state: string;
    departmentId: string | null;
  };
  kpis: Array<{
    id: "jobseekers" | "employers" | "jobs" | "placements";
    label: string;
    value: number;
    trendPercent: number | null;
    trendDirection: "up" | "down" | "neutral";
    href: string;
  }>;
  activityTrend: Array<{
    date: string;
    label: string;
    jobseekers: number;
    employers: number;
    jobs: number;
    placements: number;
  }>;
  operationsByLocation: Array<{
    state: string;
    totalActivity: number;
    trendPercent: number | null;
    trendDirection: "up" | "down" | "neutral";
  }>;
  taskStatus: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    completedPercent: number | null;
    inProgressPercent: number | null;
    pendingPercent: number | null;
    overduePercent: number | null;
  };
  teamPerformance: Array<{
    departmentId: string;
    teamName: string;
    completed: number;
    total: number;
    completionRate: number | null;
  }>;
  recentTasks: {
    tab: string;
    counts: {
      all: number;
      pending: number;
      inProgress: number;
      overdue: number;
      completed: number;
    };
    items: Array<{
      id: string;
      displayId: string;
      title: string;
      type: string;
      typeLabel: string;
      assignedToName: string | null;
      priority: string;
      dueAt: string | null;
      status: string;
      statusBucket: "completed" | "in_progress" | "pending" | "overdue";
      href: string;
    }>;
  };
  myTeams: Array<{
    departmentId: string;
    teamName: string;
    memberCount: number;
    openTasks: number;
  }>;
  alerts: Array<{
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    occurredAt: string;
    relativeTime: string;
    href: string;
    module: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    available: boolean;
  }>;
  askAsliAvailable: boolean;
  metadata: {
    generatedAt: string;
    timezone: string;
  };
}
