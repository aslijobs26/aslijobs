export type OperationsDashboardKpi = {
  id: "jobseekers" | "employers" | "jobs" | "placements";
  label: string;
  value: number;
  trendPercent: number | null;
  trendDirection: "up" | "down" | "neutral";
  href: string;
};

export type OperationsDashboardTrendPoint = {
  date: string;
  label: string;
  jobseekers: number;
  employers: number;
  jobs: number;
  placements: number;
};

export type OperationsDashboardLocationRow = {
  state: string;
  totalActivity: number;
  trendPercent: number | null;
  trendDirection: "up" | "down" | "neutral";
};

export type OperationsDashboardTaskStatus = {
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

export type OperationsDashboardTeamPerformanceRow = {
  departmentId: string;
  teamName: string;
  completed: number;
  total: number;
  completionRate: number | null;
};

export type OperationsDashboardRecentTask = {
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
};

export type OperationsDashboardMyTeam = {
  departmentId: string;
  teamName: string;
  memberCount: number;
  openTasks: number;
};

export type OperationsDashboardAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  occurredAt: string;
  relativeTime: string;
  href: string;
  module: string;
};

export type OperationsDashboardQuickAction = {
  id: string;
  label: string;
  href: string;
  available: boolean;
};

export type OperationsDashboardOverviewResponse = {
  filters: {
    datePreset: string;
    dateLabel: string;
    dateFrom: string;
    dateTo: string;
    state: string;
    departmentId: string | null;
  };
  kpis: OperationsDashboardKpi[];
  activityTrend: OperationsDashboardTrendPoint[];
  operationsByLocation: OperationsDashboardLocationRow[];
  taskStatus: OperationsDashboardTaskStatus;
  teamPerformance: OperationsDashboardTeamPerformanceRow[];
  recentTasks: {
    tab: string;
    counts: {
      all: number;
      pending: number;
      inProgress: number;
      overdue: number;
      completed: number;
    };
    items: OperationsDashboardRecentTask[];
  };
  myTeams: OperationsDashboardMyTeam[];
  alerts: OperationsDashboardAlert[];
  quickActions: OperationsDashboardQuickAction[];
  askAsliAvailable: boolean;
  metadata: {
    generatedAt: string;
    timezone: string;
  };
};
