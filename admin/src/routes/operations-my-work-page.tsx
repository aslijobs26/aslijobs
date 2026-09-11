import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import { MyWorkAssignDialog } from "../components/operations/my-work/MyWorkAssignDialog";
import { MyWorkCreateDialog } from "../components/operations/my-work/MyWorkCreateDialog";
import { MyWorkPageSkeleton } from "../components/operations/my-work/MyWorkPageSkeleton";
import { MyWorkAskAsliCard } from "../components/operations/my-work/overview/MyWorkAskAsliCard";
import { MyWorkKpiStrip } from "../components/operations/my-work/overview/MyWorkKpiStrip";
import { MyWorkOverviewHeader } from "../components/operations/my-work/overview/MyWorkOverviewHeader";
import { MyWorkTipOfTheDay } from "../components/operations/my-work/overview/MyWorkTipOfTheDay";
import { MyWorkTodaysFocus } from "../components/operations/my-work/overview/MyWorkTodaysFocus";
import { MyWorkTableSection } from "../components/operations/my-work/MyWorkTableSection";
import type { MyWorkRowAction } from "../components/operations/my-work/MyWorkRowActions";
import { workMutationErrorMessage } from "../components/operations/my-work/my-work-errors";
import { useOperationsPermissions } from "../hooks/use-operations-permissions";
import {
  useClaimOperationsWork,
  useExportOperationsWork,
  useOperationsWorkAnalytics,
  useOperationsWorkList,
  useUpdateOperationsWorkStatus,
} from "../hooks/use-operations-work";
import type {
  OperationsWorkListItem,
  OperationsWorkListParams,
  WorkDueFilter,
  WorkQueueTab,
} from "../types/operations-work";
import { isOperationsSessionTransientError } from "../utils/operations-session-errors";

const EMPTY_TABS = {
  myQueue: 0,
  waiting: 0,
  completed: 0,
  all: 0,
};

function parseTab(
  value: string | null,
  fallback: WorkQueueTab = "my_queue",
): WorkQueueTab {
  if (
    value === "my_queue" ||
    value === "waiting" ||
    value === "completed" ||
    value === "all"
  ) {
    return value;
  }
  return fallback;
}

function parseDue(value: string | null): WorkDueFilter {
  if (
    value === "overdue" ||
    value === "due_today" ||
    value === "due_soon" ||
    value === "upcoming" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

function queryErrorMessage(error: unknown, fallback: string): string {
  if (isOperationsSessionTransientError(error)) {
    return "The API server is temporarily unavailable. Please wait a moment and retry.";
  }
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session expired. Please refresh or sign in again.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function OperationsMyWorkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperAdmin, canKey, isLoading: permissionsLoading } =
    useOperationsPermissions();
  const isOperationsHead =
    isSuperAdmin ||
    canKey("my_work.assign") ||
    canKey("my_work.reassign");
  const defaultTab: WorkQueueTab = isOperationsHead ? "all" : "my_queue";
  const hasExplicitTab = searchParams.has("tab");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tab, setTab] = useState<WorkQueueTab>(() =>
    parseTab(searchParams.get("tab"), "all"),
  );
  const [type, setType] = useState(() => searchParams.get("type") ?? "");
  const [priority, setPriority] = useState(
    () => searchParams.get("priority") ?? "",
  );
  const [due, setDue] = useState<WorkDueFilter>(() =>
    parseDue(searchParams.get("due")),
  );
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput.trim());
  const [assignItem, setAssignItem] = useState<OperationsWorkListItem | null>(
    null,
  );
  const [assignMode, setAssignMode] = useState<"assign" | "reassign">("assign");
  const [createOpen, setCreateOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    if (hasExplicitTab) {
      setTab(parseTab(searchParams.get("tab"), defaultTab));
    } else if (!permissionsLoading) {
      setTab(defaultTab);
    }
    setType(searchParams.get("type") ?? "");
    setPriority(searchParams.get("priority") ?? "");
    setDue(parseDue(searchParams.get("due")));
  }, [
    searchParams,
    hasExplicitTab,
    permissionsLoading,
    defaultTab,
  ]);

  const syncParams = (next: {
    tab?: WorkQueueTab;
    type?: string;
    priority?: string;
    due?: WorkDueFilter;
    search?: string;
  }) => {
    const params = new URLSearchParams(searchParams);
    const nextTab = next.tab ?? tab;
    const nextType = next.type ?? type;
    const nextPriority = next.priority ?? priority;
    const nextDue = next.due ?? due;
    const nextSearch = next.search ?? debouncedSearch;

    if (nextTab === defaultTab) params.delete("tab");
    else params.set("tab", nextTab);

    if (!nextType) params.delete("type");
    else params.set("type", nextType);

    if (!nextPriority) params.delete("priority");
    else params.set("priority", nextPriority);

    if (nextDue === "all") params.delete("due");
    else params.set("due", nextDue);

    if (!nextSearch) params.delete("search");
    else params.set("search", nextSearch);

    setSearchParams(params, { replace: true });
  };

  const listParams = useMemo<OperationsWorkListParams>(
    () => ({
      page,
      limit,
      tab,
      type,
      priority,
      due,
      search: debouncedSearch,
      sort: "dueAt",
      order: "asc",
    }),
    [page, limit, tab, type, priority, due, debouncedSearch],
  );

  const analyticsQuery = useOperationsWorkAnalytics();
  const listQuery = useOperationsWorkList(listParams);
  const exportMutation = useExportOperationsWork();
  const claimMutation = useClaimOperationsWork();
  const statusMutation = useUpdateOperationsWorkStatus();

  const analytics = analyticsQuery.data;
  const listData = listQuery.data;

  const isInitialLoading =
    (analyticsQuery.isPending && !analytics) ||
    (listQuery.isPending && !listData);

  const handleKpiSelect = (
    key: "doNow" | "dueToday" | "upcoming" | "waiting" | "completed",
  ) => {
    setPage(1);
    switch (key) {
      case "doNow":
        // Scope-wide urgent work (includes team queue for authorized actors).
        setTab("all");
        setPriority("P1");
        setDue("all");
        setType("");
        syncParams({
          tab: "all",
          priority: "P1",
          due: "all",
          type: "",
        });
        break;
      case "dueToday":
        setTab("all");
        setDue("due_today");
        setPriority("");
        setType("");
        syncParams({
          tab: "all",
          due: "due_today",
          priority: "",
          type: "",
        });
        break;
      case "upcoming":
        setTab("all");
        setDue("upcoming");
        setPriority("");
        setType("");
        syncParams({
          tab: "all",
          due: "upcoming",
          priority: "",
          type: "",
        });
        break;
      case "waiting":
        setTab("waiting");
        setDue("all");
        setPriority("");
        setType("");
        syncParams({
          tab: "waiting",
          due: "all",
          priority: "",
          type: "",
        });
        break;
      case "completed":
        setTab("completed");
        setDue("all");
        setPriority("");
        setType("");
        syncParams({
          tab: "completed",
          due: "all",
          priority: "",
          type: "",
        });
        break;
    }
  };

  const runStatus = async (
    item: OperationsWorkListItem,
    status: OperationsWorkListItem["status"],
    waitingReason?: string,
  ) => {
    setActionError(null);
    setBusyId(item.id);
    try {
      await statusMutation.mutateAsync({
        id: item.id,
        input: {
          status,
          expectedRevision: item.revision,
          waitingReason: waitingReason ?? null,
        },
      });
    } catch (error) {
      setActionError(
        workMutationErrorMessage(error, "Failed to update work status."),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleRowAction = async (
    item: OperationsWorkListItem,
    action: MyWorkRowAction,
  ) => {
    if (action === "view") return;
    if (action === "assign" || action === "reassign") {
      setAssignMode(action);
      setAssignItem(item);
      return;
    }
    if (action === "claim") {
      setActionError(null);
      setBusyId(item.id);
      try {
        await claimMutation.mutateAsync({
          id: item.id,
          expectedRevision: item.revision,
        });
      } catch (error) {
        setActionError(
          workMutationErrorMessage(error, "Failed to claim work item."),
        );
      } finally {
        setBusyId(null);
      }
      return;
    }
    if (action === "start") {
      await runStatus(item, "in_progress");
      return;
    }
    if (action === "resume") {
      await runStatus(item, "in_progress");
      return;
    }
    if (action === "wait") {
      const reason = window.prompt("Waiting reason (optional):") ?? "";
      await runStatus(item, "waiting", reason.trim() || "Awaiting input");
      return;
    }
    if (action === "complete") {
      await runStatus(item, "completed");
    }
  };

  const pagination = {
    page: listData?.pagination.page ?? page,
    limit: listData?.pagination.limit ?? limit,
    total: listData?.pagination.total ?? 0,
    totalPages: listData?.pagination.totalPages ?? 1,
    hasNextPage:
      (listData?.pagination.page ?? page) <
      (listData?.pagination.totalPages ?? 1),
    hasPreviousPage: (listData?.pagination.page ?? page) > 1,
  };

  return (
    <OperationsLayout
      title="My Work"
      subtitle="Tasks and assignments"
      headerVariant="command"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 max-lg:gap-2.5 max-sm:gap-2">
        {isInitialLoading ? (
          <MyWorkPageSkeleton />
        ) : (
          <>
            <MyWorkOverviewHeader
              onCreate={() => setCreateOpen(true)}
              onExport={() => {
                setActionError(null);
                exportMutation.mutate(
                  {
                    tab,
                    type,
                    priority,
                    due,
                    search: debouncedSearch,
                    format: "xlsx",
                  },
                  {
                    onError: (error) => {
                      setActionError(
                        workMutationErrorMessage(
                          error,
                          "Failed to export work items.",
                        ),
                      );
                    },
                  },
                );
              }}
              isExporting={exportMutation.isPending}
            />

            {actionError ? (
              <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                {actionError}
              </div>
            ) : null}

            {analyticsQuery.error && !analytics ? (
              <div className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger">
                {queryErrorMessage(
                  analyticsQuery.error,
                  "Failed to load My Work analytics.",
                )}
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={() => void analyticsQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : null}

            <MyWorkKpiStrip
              kpis={analytics?.kpis}
              isLoading={
                (analyticsQuery.isPending || analyticsQuery.isFetching) &&
                !analytics
              }
              isError={Boolean(analyticsQuery.error) && !analytics}
              onSelect={handleKpiSelect}
            />

            <OperationsOverviewSplit
              variant="overview"
              rail={
                <>
                  <MyWorkTodaysFocus
                    focus={analytics?.focus}
                    onViewAll={() => handleKpiSelect("doNow")}
                  />
                  <MyWorkAskAsliCard />
                  <MyWorkTipOfTheDay />
                </>
              }
            >
              <div className="flex min-w-0 flex-col gap-2.5">
                  <MyWorkTableSection
                  items={listData?.items ?? []}
                  tabs={listData?.tabs ?? EMPTY_TABS}
                  activeTab={tab}
                  onTabChange={(next) => {
                    // Tab clicks reset KPI shortcut filters so Waiting/All are not
                    // stuck under a leftover P1 / due filter from "Do Now".
                    setTab(next);
                    setType("");
                    setPriority("");
                    setDue("all");
                    setPage(1);
                    syncParams({
                      tab: next,
                      type: "",
                      priority: "",
                      due: "all",
                    });
                  }}
                  type={type}
                  onTypeChange={(next) => {
                    setType(next);
                    setPage(1);
                    syncParams({ type: next });
                  }}
                  priority={priority}
                  onPriorityChange={(next) => {
                    setPriority(next);
                    setPage(1);
                    syncParams({ priority: next });
                  }}
                  due={due}
                  onDueChange={(next) => {
                    setDue(next);
                    setPage(1);
                    syncParams({ due: next });
                  }}
                  search={searchInput}
                  onSearchChange={setSearchInput}
                  isLoading={listQuery.isFetching && !listData}
                  isError={Boolean(listQuery.error)}
                  errorMessage={
                    listQuery.error
                      ? queryErrorMessage(
                          listQuery.error,
                          "Failed to load work items.",
                        )
                      : undefined
                  }
                  onRetry={() => void listQuery.refetch()}
                  busyId={busyId}
                  preferAllFirst={isOperationsHead}
                  onRowAction={(item, action) => {
                    void handleRowAction(item, action);
                  }}
                />
                <JobsPaginationBar
                  pagination={pagination}
                  onPageChange={setPage}
                  onLimitChange={(next) => {
                    setLimit(next);
                    setPage(1);
                  }}
                  ariaLabel="My Work pagination"
                />
              </div>
            </OperationsOverviewSplit>
          </>
        )}
      </div>

      <MyWorkAssignDialog
        open={Boolean(assignItem)}
        mode={assignMode}
        item={assignItem}
        onClose={() => setAssignItem(null)}
        onSuccess={() => setActionError(null)}
      />
      <MyWorkCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => setActionError(null)}
      />
    </OperationsLayout>
  );
}
