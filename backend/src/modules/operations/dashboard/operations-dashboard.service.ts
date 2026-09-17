import mongoose from "mongoose";
import { JobSeekerModel } from "../../job-seekers/job-seeker.model.js";
import { EmployerModel } from "../../employers/employer.model.js";
import { JobModel } from "../../jobs/job.model.js";
import { ApplicationModel } from "../../applications/application.model.js";
import { OPERATIONS_BUSINESS_TIMEZONE } from "../registration-awareness/operations-registration-awareness.constants.js";
import {
  formatRelativeTime,
  toKolkataIsoDate,
} from "../registration-awareness/operations-registration-time.js";
import { PENDING_VERIFICATION_FILTER } from "../verifications/operations-verifications-analytics.js";
import { resolveIndiaStateLabel } from "../employers/india-state-normalize.js";
import { OperationsDepartmentModel } from "../rbac/operations-department.model.js";
import { OperationsTeamUserModel } from "../auth/operations-team-user.model.js";
import { OperationsWorkItemModel } from "../work/operations-work.model.js";
import {
  WORK_ITEM_TYPE_LABELS,
} from "../work/operations-work.constants.js";
import {
  buildWorkVisibilityFilter,
} from "../work/operations-work-assignment.js";
import {
  operationsAccessCan,
  operationsAccessCanKey,
} from "../rbac/operations-access.service.js";
import type { OperationsResolvedAccess } from "../rbac/operations-access.types.js";
import { recordOperationsAuditEvent } from "../rbac/operations-audit.service.js";
import {
  completionRate,
  enumerateKolkataDays,
  mapWorkStatusToTaskBucket,
  percentChange,
  resolveDashboardDateRange,
  resolveOverallChartFrom,
} from "./operations-dashboard-domain.js";
import { buildLocationActivity } from "./operations-dashboard-location.js";
import type {
  OperationsDashboardOverviewQuery,
  OperationsDashboardExportQuery,
} from "./operations-dashboard.validation.js";
import type {
  OperationsDashboardAlert,
  OperationsDashboardKpi,
  OperationsDashboardMyTeam,
  OperationsDashboardOverviewResponse,
  OperationsDashboardQuickAction,
  OperationsDashboardRecentTask,
  OperationsDashboardTeamPerformanceRow,
  OperationsDashboardTrendPoint,
} from "./operations-dashboard.types.js";

const PLACEMENT_STATUSES = ["selected", "joined", "did_not_join"] as const;

function trendDirection(
  percent: number | null,
): "up" | "down" | "neutral" {
  if (percent == null || percent === 0) return "neutral";
  return percent > 0 ? "up" : "down";
}

/**
 * Same verified-employer definition as Employers Overview KPIs.
 * Includes explicit `verified` plus legacy WhatsApp-completed accounts.
 */
const EMPLOYERS_ONBOARDED_FILTER: Record<string, unknown> = {
  $or: [
    { verificationStatus: "verified" },
    {
      $and: [
        { verificationStatus: { $in: [null, ""] } },
        { isWhatsappVerified: true },
        { registrationStatus: "completed" },
      ],
    },
  ],
};

function createdAtRange(from: Date, toExclusive: Date) {
  return { createdAt: { $gte: from, $lt: toExclusive } };
}

function mergeFilters(
  ...parts: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  const clauses = parts.filter(
    (part): part is Record<string, unknown> =>
      Boolean(part) && Object.keys(part as object).length > 0,
  );
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

function stateMatchFilter(state: string): Record<string, unknown> | null {
  const trimmed = state.trim();
  if (!trimmed) return null;
  const label = resolveIndiaStateLabel(trimmed) ?? trimmed;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  return {
    $or: [
      { state: regex },
      { stateName: regex },
      { "address.state": regex },
      { preferredState: regex },
      { preferredJobLocation: regex },
      { "preferredLocation.state": regex },
      { location: regex },
      { city: regex },
      { cityName: regex },
      { "jobLocation.state": regex },
      { "location.state": regex },
    ],
  };
}

async function countInRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { countDocuments: (filter: Record<string, unknown>) => any },
  base: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
  stateFilter: Record<string, unknown> | null,
): Promise<number> {
  return Number(
    await model.countDocuments(
      mergeFilters(base, createdAtRange(from, toExclusive), stateFilter),
    ),
  );
}

async function countDocuments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { countDocuments: (filter: Record<string, unknown>) => any },
  base: Record<string, unknown>,
  stateFilter: Record<string, unknown> | null,
): Promise<number> {
  return Number(await model.countDocuments(mergeFilters(base, stateFilter)));
}

async function dailyCreatedCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: { aggregate: (pipeline: any[]) => any },
  match: Record<string, unknown>,
  from: Date,
  toExclusive: Date,
): Promise<Map<string, number>> {
  const rows = (await model.aggregate([
    {
      $match: {
        ...match,
        createdAt: { $gte: from, $lt: toExclusive },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: OPERATIONS_BUSINESS_TIMEZONE,
          },
        },
        count: { $sum: 1 },
      },
    },
  ])) as Array<{ _id: string; count: number }>;
  return new Map(rows.map((row) => [row._id, row.count]));
}

function workDepartmentScope(
  access: OperationsResolvedAccess,
  departmentId?: string,
): Record<string, unknown> {
  const visibility = buildWorkVisibilityFilter(access);
  const filter: Record<string, unknown> = { ...visibility };
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    if (!access.isSuperAdmin && access.departmentId) {
      if (String(access.departmentId) !== String(departmentId)) {
        // Outside scope — force empty match.
        filter._id = new mongoose.Types.ObjectId();
        return filter;
      }
    }
    filter.departmentId = new mongoose.Types.ObjectId(departmentId);
  }
  return filter;
}

function authorizedDepartmentsFilter(access: OperationsResolvedAccess) {
  const filter: Record<string, unknown> = { status: "active" };
  if (!access.isSuperAdmin && access.departmentId) {
    filter._id = access.departmentId;
  }
  return filter;
}

export const operationsDashboardService = {
  async getOverview(
    query: OperationsDashboardOverviewQuery,
    access: OperationsResolvedAccess,
  ): Promise<OperationsDashboardOverviewResponse> {
    const range = resolveDashboardDateRange({
      datePreset: query.datePreset,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
    const now = new Date();
    const stateFilter = stateMatchFilter(query.state ?? "");
    const canCandidates = operationsAccessCan(access, "candidates", "read");
    const canEmployers = operationsAccessCan(access, "employers", "read");
    const canJobs = operationsAccessCan(access, "jobs", "read");
    const canPlacements = operationsAccessCan(access, "placements", "read");
    const canWork = operationsAccessCan(access, "my_work", "read");
    const canTeam = operationsAccessCan(access, "team", "read");
    const canDepartments = operationsAccessCan(access, "departments", "read");
    const canVerifications = operationsAccessCan(
      access,
      "verifications",
      "read",
    );

    const kpiPromises: Promise<void>[] = [];
    let jobseekersCurrent = 0;
    let jobseekersPrevious = 0;
    let employersCurrent = 0;
    let employersPrevious = 0;
    let jobsCurrent = 0;
    let jobsPrevious = 0;
    let placementsCurrent = 0;
    let placementsPrevious = 0;

    if (canCandidates) {
      kpiPromises.push(
        (async () => {
          jobseekersCurrent = await countInRange(
            JobSeekerModel,
            { registrationStatus: "COMPLETED" },
            range.from,
            range.toExclusive,
            stateFilter,
          );
          jobseekersPrevious = await countInRange(
            JobSeekerModel,
            { registrationStatus: "COMPLETED" },
            range.previousFrom,
            range.previousToExclusive,
            stateFilter,
          );
        })(),
      );
    }
    if (canEmployers) {
      kpiPromises.push(
        (async () => {
          if (range.preset === "all") {
            // Match Employers Overview Overall: network verified stock, not createdAt cohort.
            employersCurrent = await countDocuments(
              EmployerModel,
              EMPLOYERS_ONBOARDED_FILTER,
              stateFilter,
            );
            employersPrevious = 0;
          } else {
            employersCurrent = await countInRange(
              EmployerModel,
              EMPLOYERS_ONBOARDED_FILTER,
              range.from,
              range.toExclusive,
              stateFilter,
            );
            employersPrevious = await countInRange(
              EmployerModel,
              EMPLOYERS_ONBOARDED_FILTER,
              range.previousFrom,
              range.previousToExclusive,
              stateFilter,
            );
          }
        })(),
      );
    }
    if (canJobs) {
      kpiPromises.push(
        (async () => {
          jobsCurrent = await countInRange(
            JobModel,
            {},
            range.from,
            range.toExclusive,
            stateFilter,
          );
          jobsPrevious = await countInRange(
            JobModel,
            {},
            range.previousFrom,
            range.previousToExclusive,
            stateFilter,
          );
        })(),
      );
    }
    if (canPlacements) {
      kpiPromises.push(
        (async () => {
          placementsCurrent = await countInRange(
            ApplicationModel,
            { status: { $in: [...PLACEMENT_STATUSES] } },
            range.from,
            range.toExclusive,
            stateFilter,
          );
          placementsPrevious = await countInRange(
            ApplicationModel,
            { status: { $in: [...PLACEMENT_STATUSES] } },
            range.previousFrom,
            range.previousToExclusive,
            stateFilter,
          );
        })(),
      );
    }
    await Promise.all(kpiPromises);

    const kpis: OperationsDashboardKpi[] = [];
    if (canCandidates) {
      const trend = percentChange(jobseekersCurrent, jobseekersPrevious);
      kpis.push({
        id: "jobseekers",
        label: "Jobseekers Onboarded",
        value: jobseekersCurrent,
        trendPercent: trend,
        trendDirection: trendDirection(trend),
        href: "/operations/candidates",
      });
    }
    if (canEmployers) {
      const trend = percentChange(employersCurrent, employersPrevious);
      kpis.push({
        id: "employers",
        label: "Employers Onboarded",
        value: employersCurrent,
        trendPercent: trend,
        trendDirection: trendDirection(trend),
        href: "/operations/employers",
      });
    }
    if (canJobs) {
      const trend = percentChange(jobsCurrent, jobsPrevious);
      kpis.push({
        id: "jobs",
        label: "Jobs Posted",
        value: jobsCurrent,
        trendPercent: trend,
        trendDirection: trendDirection(trend),
        href: "/operations/jobs",
      });
    }
    if (canPlacements) {
      const trend = percentChange(placementsCurrent, placementsPrevious);
      kpis.push({
        id: "placements",
        label: "Placements",
        value: placementsCurrent,
        trendPercent: trend,
        trendDirection: trendDirection(trend),
        href: "/operations/placements",
      });
    }

    // Overall KPIs stay all-time; activity trend uses the last 12 months.
    const trendFrom = resolveOverallChartFrom(range);

    const days = enumerateKolkataDays(trendFrom, range.toExclusive);
    const activityTrend: OperationsDashboardTrendPoint[] = days.map((date) => {
      const [y, m, d] = date.split("-").map(Number);
      const labelDate = new Date(Date.UTC(y, m - 1, d, 12));
      return {
        date,
        label: labelDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        jobseekers: 0,
        employers: 0,
        jobs: 0,
        placements: 0,
      };
    });
    const trendIndex = new Map(
      activityTrend.map((point, index) => [point.date, index]),
    );

    const trendLoads: Promise<void>[] = [];
    if (canCandidates) {
      trendLoads.push(
        dailyCreatedCounts(
          JobSeekerModel,
          { registrationStatus: "COMPLETED", ...(stateFilter ?? {}) },
          trendFrom,
          range.toExclusive,
        ).then((map) => {
          for (const [date, count] of map) {
            const idx = trendIndex.get(date);
            if (idx != null) activityTrend[idx].jobseekers = count;
          }
        }),
      );
    }
    if (canEmployers) {
      trendLoads.push(
        dailyCreatedCounts(
          EmployerModel,
          { ...EMPLOYERS_ONBOARDED_FILTER, ...(stateFilter ?? {}) },
          trendFrom,
          range.toExclusive,
        ).then((map) => {
          for (const [date, count] of map) {
            const idx = trendIndex.get(date);
            if (idx != null) activityTrend[idx].employers = count;
          }
        }),
      );
    }
    if (canJobs) {
      trendLoads.push(
        dailyCreatedCounts(
          JobModel,
          { ...(stateFilter ?? {}) },
          trendFrom,
          range.toExclusive,
        ).then((map) => {
          for (const [date, count] of map) {
            const idx = trendIndex.get(date);
            if (idx != null) activityTrend[idx].jobs = count;
          }
        }),
      );
    }
    if (canPlacements) {
      trendLoads.push(
        dailyCreatedCounts(
          ApplicationModel,
          {
            status: { $in: [...PLACEMENT_STATUSES] },
            ...(stateFilter ?? {}),
          },
          trendFrom,
          range.toExclusive,
        ).then((map) => {
          for (const [date, count] of map) {
            const idx = trendIndex.get(date);
            if (idx != null) activityTrend[idx].placements = count;
          }
        }),
      );
    }
    await Promise.all(trendLoads);

    const operationsByLocation = await buildLocationActivity({
      canCandidates,
      canEmployers,
      canJobs,
      canPlacements,
      range,
      selectedState: query.state ?? "",
      employerMatch: EMPLOYERS_ONBOARDED_FILTER,
    });

    const workScope = workDepartmentScope(access, query.departmentId);
    const taskBundle = canWork
      ? await buildTaskBundle({
          workScope,
          query,
          range,
          access,
          now,
        })
      : {
          taskStatus: {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            overdue: 0,
            completedPercent: null,
            inProgressPercent: null,
            pendingPercent: null,
            overduePercent: null,
          },
          teamPerformance: [] as OperationsDashboardTeamPerformanceRow[],
          recentTasks: {
            tab: query.taskTab,
            counts: {
              all: 0,
              pending: 0,
              inProgress: 0,
              overdue: 0,
              completed: 0,
            },
            items: [] as OperationsDashboardRecentTask[],
          },
        };

    const myTeams =
      canDepartments || canTeam
        ? await buildMyTeams(access, workScope)
        : [];

    const alerts = await buildAlerts({
      access,
      canVerifications,
      canJobs,
      canWork,
      canPlacements,
      now,
    });

    const quickActions = buildQuickActions(access);

    return {
      filters: {
        datePreset: range.preset,
        dateLabel: range.label,
        dateFrom: toKolkataIsoDate(range.from),
        dateTo: toKolkataIsoDate(
          new Date(range.toExclusive.getTime() - 1),
        ),
        state: query.state?.trim() ?? "",
        departmentId: query.departmentId ?? null,
      },
      kpis,
      activityTrend,
      operationsByLocation,
      taskStatus: taskBundle.taskStatus,
      teamPerformance: taskBundle.teamPerformance,
      recentTasks: taskBundle.recentTasks,
      myTeams,
      alerts,
      quickActions,
      askAsliAvailable: false,
      metadata: {
        generatedAt: now.toISOString(),
        timezone: OPERATIONS_BUSINESS_TIMEZONE,
      },
    };
  },

  async exportOverview(
    query: OperationsDashboardExportQuery,
    access: OperationsResolvedAccess,
  ): Promise<{ filename: string; contentType: string; body: Buffer }> {
    const overview = await this.getOverview(
      {
        ...query,
        taskTab: "all",
        taskSearch: "",
        taskLimit: 25,
      },
      access,
    );

    const lines: string[] = [];
    lines.push("ASLI OS Operations Overview Report");
    lines.push(
      `Period,${overview.filters.dateLabel},${overview.filters.dateFrom},${overview.filters.dateTo}`,
    );
    lines.push(`Generated,${overview.metadata.generatedAt}`);
    lines.push("");
    lines.push("KPI,Value,TrendPercent");
    for (const kpi of overview.kpis) {
      lines.push(
        `${csvEscape(kpi.label)},${kpi.value},${kpi.trendPercent ?? ""}`,
      );
    }
    lines.push("");
    lines.push("Task Status,Count");
    lines.push(`Completed,${overview.taskStatus.completed}`);
    lines.push(`In Progress,${overview.taskStatus.inProgress}`);
    lines.push(`Pending,${overview.taskStatus.pending}`);
    lines.push(`Overdue,${overview.taskStatus.overdue}`);
    lines.push("");
    lines.push("Operations by Location");
    lines.push("State,TotalActivity,SharePercent,TrendPercent");
    for (const row of overview.operationsByLocation) {
      lines.push(
        [
          csvEscape(row.state),
          row.totalActivity,
          row.sharePercent ?? "",
          row.trendPercent ?? (row.trendDirection === "new" ? "new" : ""),
        ].join(","),
      );
    }
    lines.push("");
    lines.push("Recent Tasks");
    lines.push("DisplayId,Title,Type,Assignee,Priority,Status,DueAt");
    for (const task of overview.recentTasks.items) {
      lines.push(
        [
          task.displayId,
          task.title,
          task.typeLabel,
          task.assignedToName ?? "",
          task.priority,
          task.status,
          task.dueAt ?? "",
        ]
          .map(csvEscape)
          .join(","),
      );
    }

    await recordOperationsAuditEvent({
      actorUserId: access.userId,
      actorName: access.roleName ?? "Operations",
      action: "dashboard.export",
      targetType: "dashboard",
      targetId: "overview",
      targetLabel: "Operations Overview",
      metadata: {
        datePreset: overview.filters.datePreset,
        state: overview.filters.state,
        departmentId: overview.filters.departmentId,
      },
    });

    const stamp = overview.filters.dateTo.replace(/-/g, "");
    return {
      filename: `operations-overview-${stamp}.csv`,
      contentType: "text/csv; charset=utf-8",
      body: Buffer.from(`\uFEFF${lines.join("\n")}`, "utf8"),
    };
  },
};

function csvEscape(value: string | number): string {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function buildTaskBundle(input: {
  workScope: Record<string, unknown>;
  query: OperationsDashboardOverviewQuery;
  range: ReturnType<typeof resolveDashboardDateRange>;
  access: OperationsResolvedAccess;
  now: Date;
}) {
  const dateScoped =
    input.range.preset === "all"
      ? {}
      : {
          createdAt: {
            $gte: input.range.from,
            $lt: input.range.toExclusive,
          },
        };

  const openFilter = {
    ...input.workScope,
    ...dateScoped,
    status: { $nin: ["cancelled"] },
  };
  const items = await OperationsWorkItemModel.find(openFilter)
    .select(
      "_id displayId title type priority status dueAt assignedToUserId departmentId updatedAt",
    )
    .sort({ updatedAt: -1 })
    .limit(5000)
    .lean();

  let completed = 0;
  let inProgress = 0;
  let pending = 0;
  let overdue = 0;
  const byDepartment = new Map<
    string,
    { completed: number; total: number }
  >();

  const assigneeIds = new Set<string>();
  for (const item of items) {
    if (item.assignedToUserId) {
      assigneeIds.add(String(item.assignedToUserId));
    }
  }
  const assignees = assigneeIds.size
    ? await OperationsTeamUserModel.find({
        _id: { $in: [...assigneeIds] },
      })
        .select("_id fullName")
        .lean()
    : [];
  const assigneeName = new Map(
    assignees.map((user) => [String(user._id), user.fullName]),
  );

  const activeDepartments = await OperationsDepartmentModel.find(
    authorizedDepartmentsFilter(input.access),
  )
    .select("_id name")
    .sort({ name: 1 })
    .lean();
  const departmentName = new Map(
    activeDepartments.map((dept) => [String(dept._id), dept.name]),
  );
  for (const dept of activeDepartments) {
    byDepartment.set(String(dept._id), { completed: 0, total: 0 });
  }

  const recentCandidates: OperationsDashboardRecentTask[] = [];

  for (const item of items) {
    const bucket = mapWorkStatusToTaskBucket(
      String(item.status),
      item.dueAt ? new Date(item.dueAt) : null,
      input.now,
    );
    if (!bucket) continue;
    if (bucket === "completed") completed += 1;
    if (bucket === "in_progress") inProgress += 1;
    if (bucket === "pending") pending += 1;
    if (bucket === "overdue") overdue += 1;

    const deptId = item.departmentId ? String(item.departmentId) : null;
    if (deptId) {
      const row = byDepartment.get(deptId) ?? { completed: 0, total: 0 };
      row.total += 1;
      if (bucket === "completed") row.completed += 1;
      byDepartment.set(deptId, row);
      if (!departmentName.has(deptId)) {
        departmentName.set(deptId, "Unassigned team");
      }
    }

    recentCandidates.push({
      id: String(item._id),
      displayId: String(item.displayId),
      title: String(item.title),
      type: String(item.type),
      typeLabel:
        WORK_ITEM_TYPE_LABELS[
          item.type as keyof typeof WORK_ITEM_TYPE_LABELS
        ] ?? String(item.type),
      assignedToName: item.assignedToUserId
        ? (assigneeName.get(String(item.assignedToUserId)) ?? null)
        : null,
      priority: String(item.priority),
      dueAt: item.dueAt ? new Date(item.dueAt).toISOString() : null,
      status: String(item.status),
      statusBucket: bucket,
      href: `/operations/my-work/${String(item._id)}`,
    });
  }

  // Resolve names for departments that appear on work items but are inactive/missing.
  const missingDeptIds = [...byDepartment.keys()].filter(
    (id) => !departmentName.has(id) || departmentName.get(id) === "Unassigned team",
  );
  if (missingDeptIds.length > 0) {
    const extra = await OperationsDepartmentModel.find({
      _id: { $in: missingDeptIds },
    })
      .select("_id name")
      .lean();
    for (const dept of extra) {
      departmentName.set(String(dept._id), dept.name);
    }
  }

  const total = completed + inProgress + pending + overdue;
  const taskStatus = {
    total,
    completed,
    inProgress,
    pending,
    overdue,
    completedPercent: completionRate(completed, total),
    inProgressPercent: completionRate(inProgress, total),
    pendingPercent: completionRate(pending, total),
    overduePercent: completionRate(overdue, total),
  };

  const teamPerformance: OperationsDashboardTeamPerformanceRow[] = [
    ...byDepartment.entries(),
  ]
    .map(([departmentId, stats]) => ({
      departmentId,
      teamName: departmentName.get(departmentId) ?? "Unassigned team",
      completed: stats.completed,
      total: stats.total,
      completionRate:
        stats.total > 0 ? completionRate(stats.completed, stats.total) : 0,
    }))
    .filter((row) => row.total > 0)
    .sort(
      (a, b) => (b.completionRate ?? -1) - (a.completionRate ?? -1),
    );

  const search = input.query.taskSearch.trim().toLowerCase();
  // Return an unfiltered pool so the admin can tab/search client-side without
  // refetching the entire Overview payload.
  const poolLimit = Math.max(input.query.taskLimit, 100);
  let pool = recentCandidates;
  if (search) {
    pool = recentCandidates.filter(
      (task) =>
        task.title.toLowerCase().includes(search) ||
        task.displayId.toLowerCase().includes(search) ||
        (task.assignedToName?.toLowerCase().includes(search) ?? false),
    );
  }

  return {
    taskStatus,
    teamPerformance,
    recentTasks: {
      tab: "all",
      counts: {
        all: recentCandidates.length,
        pending,
        inProgress,
        overdue,
        completed,
      },
      items: pool.slice(0, poolLimit),
    },
  };
}

async function buildMyTeams(
  access: OperationsResolvedAccess,
  workScope: Record<string, unknown>,
): Promise<OperationsDashboardMyTeam[]> {
  const departments = await OperationsDepartmentModel.find(
    authorizedDepartmentsFilter(access),
  )
    .select("_id name")
    .sort({ name: 1 })
    .limit(20)
    .lean();

  if (departments.length === 0) return [];

  const deptIds = departments.map((dept) => dept._id);
  const [memberCounts, openTaskCounts] = await Promise.all([
    OperationsTeamUserModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      {
        $match: {
          status: "active",
          departmentId: { $in: deptIds },
        },
      },
      { $group: { _id: "$departmentId", count: { $sum: 1 } } },
    ]),
    OperationsWorkItemModel.aggregate<{
      _id: mongoose.Types.ObjectId;
      count: number;
    }>([
      {
        $match: {
          ...workScope,
          departmentId: { $in: deptIds },
          status: { $nin: ["completed", "cancelled"] },
        },
      },
      { $group: { _id: "$departmentId", count: { $sum: 1 } } },
    ]),
  ]);

  const members = new Map(
    memberCounts.map((row) => [String(row._id), row.count]),
  );
  const openTasks = new Map(
    openTaskCounts.map((row) => [String(row._id), row.count]),
  );

  return departments.map((dept) => ({
    departmentId: String(dept._id),
    teamName: dept.name,
    memberCount: members.get(String(dept._id)) ?? 0,
    openTasks: openTasks.get(String(dept._id)) ?? 0,
  }));
}

async function buildAlerts(input: {
  access: OperationsResolvedAccess;
  canVerifications: boolean;
  canJobs: boolean;
  canWork: boolean;
  canPlacements: boolean;
  now: Date;
}): Promise<OperationsDashboardAlert[]> {
  const alerts: OperationsDashboardAlert[] = [];

  if (input.canVerifications) {
    const pending = await EmployerModel.countDocuments(PENDING_VERIFICATION_FILTER);
    if (pending >= 5) {
      alerts.push({
        id: "verification-backlog",
        severity: pending >= 20 ? "critical" : "warning",
        title: `High verification pending (${pending})`,
        occurredAt: input.now.toISOString(),
        relativeTime: "Just now",
        href: "/operations/verifications",
        module: "verifications",
      });
    }
  }

  if (input.canJobs) {
    const pendingJobs = await JobModel.countDocuments({
      status: { $in: ["pending_review", "under_review", "submitted"] },
    });
    if (pendingJobs >= 5) {
      alerts.push({
        id: "job-moderation-backlog",
        severity: pendingJobs >= 20 ? "critical" : "warning",
        title: `Job moderation backlog (${pendingJobs})`,
        occurredAt: input.now.toISOString(),
        relativeTime: "Just now",
        href: "/operations/jobs?tab=pending",
        module: "jobs",
      });
    }
  }

  if (input.canWork) {
    const visibility = buildWorkVisibilityFilter(input.access);
    const overdue = await OperationsWorkItemModel.countDocuments({
      ...visibility,
      status: { $nin: ["completed", "cancelled"] },
      dueAt: { $lt: input.now },
    });
    if (overdue >= 1) {
      alerts.push({
        id: "work-overdue",
        severity: overdue >= 10 ? "critical" : "warning",
        title: `${overdue} overdue operational task${overdue === 1 ? "" : "s"}`,
        occurredAt: input.now.toISOString(),
        relativeTime: formatRelativeTime(input.now, input.now),
        href: "/operations/my-work?due=overdue",
        module: "my_work",
      });
    }
  }

  if (input.canPlacements) {
    const joiningPending = await ApplicationModel.countDocuments({
      status: "selected",
    });
    if (joiningPending >= 5) {
      alerts.push({
        id: "joining-pending",
        severity: "info",
        title: `${joiningPending} placements awaiting joining confirmation`,
        occurredAt: input.now.toISOString(),
        relativeTime: "Just now",
        href: "/operations/placements?tab=joining_pending",
        module: "placements",
      });
    }
  }

  return alerts.slice(0, 8);
}

function buildQuickActions(
  access: OperationsResolvedAccess,
): OperationsDashboardQuickAction[] {
  const actions: OperationsDashboardQuickAction[] = [];
  if (
    operationsAccessCanKey(access, "my_work.assign") ||
    operationsAccessCanKey(access, "my_work.reassign")
  ) {
    actions.push({
      id: "assign-work",
      label: "Assign Work to Team",
      href: "/operations/my-work",
      available: true,
    });
  }
  if (operationsAccessCanKey(access, "my_work.create")) {
    actions.push({
      id: "create-task",
      label: "Create Operational Task",
      href: "/operations/my-work?create=1",
      available: true,
    });
  }
  if (operationsAccessCan(access, "verifications", "update")) {
    actions.push({
      id: "bulk-verification",
      label: "Open Verifications",
      href: "/operations/verifications",
      available: true,
    });
  }
  if (operationsAccessCan(access, "dashboard", "read")) {
    actions.push({
      id: "download-report",
      label: "Download Operations Report",
      href: "export",
      available: true,
    });
  }
  return actions;
}
