import { useEffect, useMemo, useState } from "react";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import {
  OverviewKpiStrip,
  OverviewModuleTabs,
} from "../components/operations/dashboard/overview/OverviewKpiStrip";
import {
  OverviewActivityTrend,
  OverviewByLocation,
} from "../components/operations/dashboard/overview/OverviewCharts";
import {
  OverviewRecentTasks,
  OverviewTaskStatus,
  OverviewTeamPerformance,
} from "../components/operations/dashboard/overview/OverviewTasks";
import {
  OverviewAlerts,
  OverviewAskAsli,
  OverviewMyTeams,
  OverviewQuickActions,
} from "../components/operations/dashboard/overview/OverviewRail";
import { OperationsFilterSelect } from "../components/operations/jobs/OperationsFilterSelect";
import {
  exportOperationsDashboardOverview,
  useOperationsDashboardOverview,
} from "../hooks/use-operations-dashboard-overview";
import { useOperationsDepartments } from "../hooks/use-operations-departments";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import type {
  DashboardDatePreset,
  DashboardTaskTab,
} from "../types/operations-dashboard-overview";
import { INDIAN_STATES_AND_UTS } from "../services/india-location.service";

const DATE_OPTIONS = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_year", label: "This year" },
] as const;

export function OperationsDashboardPage() {
  const { can } = useOperationsPermissions();
  const [datePreset, setDatePreset] =
    useState<DashboardDatePreset>("last_30_days");
  const [state, setState] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [taskTab, setTaskTab] = useState<DashboardTaskTab>("all");
  const [taskSearchInput, setTaskSearchInput] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setTaskSearch(taskSearchInput.trim());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [taskSearchInput]);

  const departmentsQuery = useOperationsDepartments({ status: "active" });

  const params = useMemo(
    () => ({
      datePreset,
      state,
      departmentId: departmentId || undefined,
      taskTab,
      taskSearch,
      taskLimit: 10,
    }),
    [datePreset, state, departmentId, taskTab, taskSearch],
  );

  const overviewQuery = useOperationsDashboardOverview(params, {
    enabled: can("dashboard", "read"),
  });
  const data = overviewQuery.data;

  const locationOptions = useMemo(
    () => [
      { value: "", label: "All Locations" },
      ...INDIAN_STATES_AND_UTS.map((name) => ({ value: name, label: name })),
    ],
    [],
  );

  const teamOptions = useMemo(() => {
    const items = departmentsQuery.data?.departments ?? [];
    return [
      { value: "", label: "All Teams" },
      ...items.map((dept) => ({ value: dept.id, label: dept.name })),
    ];
  }, [departmentsQuery.data]);

  const handleExport = async () => {
    setActionError(null);
    setExporting(true);
    try {
      await exportOperationsDashboardOverview({
        datePreset,
        state,
        departmentId: departmentId || undefined,
      });
    } catch {
      setActionError("Failed to download operations report.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <OperationsLayout
      title="Operations Overview"
      subtitle="Monitor day-to-day operations, team performance and key workflows across the ASLI platform."
      headerVariant="command"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-[11px] text-muted">
          <span>Management</span>
          <span className="mx-1.5">›</span>
          <span className="text-foreground">Operations</span>
        </nav>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <OverviewModuleTabs active="overview" />
          </div>
          <div className="flex min-w-0 flex-wrap items-end gap-2">
            <div className="min-w-[140px] flex-1 sm:flex-none">
              <OperationsFilterSelect
                label="Date range"
                value={datePreset}
                options={DATE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) =>
                  setDatePreset(value as DashboardDatePreset)
                }
                hideSearch
                mobileSheet
              />
            </div>
            <div className="min-w-[140px] flex-1 sm:flex-none">
              <OperationsFilterSelect
                label="Location"
                value={state}
                options={locationOptions}
                onChange={setState}
                mobileSheet
              />
            </div>
            <div className="min-w-[140px] flex-1 sm:flex-none">
              <OperationsFilterSelect
                label="Team"
                value={departmentId}
                options={teamOptions}
                onChange={setDepartmentId}
                mobileSheet
              />
            </div>
          </div>
        </div>

        {actionError ? (
          <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[12px] text-danger">
            {actionError}
          </p>
        ) : null}

        {overviewQuery.isError ? (
          <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-6 text-center">
            <p className="text-[13px] font-semibold text-foreground">
              Unable to load Operations Overview
            </p>
            <button
              type="button"
              onClick={() => void overviewQuery.refetch()}
              className="mt-3 h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : overviewQuery.isPending && !data ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-xl border border-border-subtle bg-hero-bg"
              />
            ))}
          </div>
        ) : data ? (
          <>
            <OverviewKpiStrip kpis={data.kpis} />
            <OperationsOverviewSplit
              variant="command"
              rail={
                <>
                  <OverviewQuickActions
                    actions={data.quickActions}
                    onExport={() => void handleExport()}
                    exporting={exporting}
                  />
                  <OverviewMyTeams teams={data.myTeams} />
                  <OverviewAlerts alerts={data.alerts} />
                  <OverviewAskAsli />
                </>
              }
            >
              <div className="flex min-w-0 flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <OverviewActivityTrend points={data.activityTrend} />
                  <OverviewByLocation rows={data.operationsByLocation} />
                </div>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <OverviewTaskStatus status={data.taskStatus} />
                  <OverviewTeamPerformance rows={data.teamPerformance} />
                </div>
                <OverviewRecentTasks
                  recentTasks={data.recentTasks}
                  taskTab={taskTab}
                  taskSearch={taskSearchInput}
                  onTabChange={setTaskTab}
                  onSearchChange={setTaskSearchInput}
                />
              </div>
            </OperationsOverviewSplit>
          </>
        ) : null}
      </div>
    </OperationsLayout>
  );
}
