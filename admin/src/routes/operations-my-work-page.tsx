import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import { JobsPaginationBar } from "../components/operations/jobs/JobsPaginationBar";
import { OperationsLayout } from "../components/operations/layout/OperationsLayout";
import { OperationsOverviewSplit } from "../components/operations/layout/OperationsOverviewSplit";
import { MyWorkAssignDialog } from "../components/operations/my-work/MyWorkAssignDialog";
import { MyWorkBulkAssignDialog } from "../components/operations/my-work/MyWorkBulkAssignDialog";
import { MyWorkCreateDialog } from "../components/operations/my-work/MyWorkCreateDialog";
import { MyWorkWaitingReasonDialog } from "../components/operations/my-work/MyWorkWaitingReasonDialog";
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
    value === "do_now" ||
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
  const canBulkAssign =
    canKey("my_work.assign") || canKey("my_work.reassign");
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
  const [createOpen, setCreateOpen] = useState(
    () => searchParams.get("create") === "1",
  );
  const [waitingItem, setWaitingItem] = useState<OperationsWorkListItem | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkResultMessage, setBulkResultMessage] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sort, setSort] = useState<
    "dueAt" | "priority" | "createdAt" | "updatedAt"
  >(() => {
    const value = searchParams.get("sort");
    if (
      value === "dueAt" ||
      value === "priority" ||
      value === "createdAt" ||
      value === "updatedAt"
    ) {
      return value;
    }
    return "dueAt";
  });
  const [order, setOrder] = useState<"asc" | "desc">(() =>
    searchParams.get("order") === "desc" ? "desc" : "asc",
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  // Changing filters/page context clears selection to avoid assigning hidden rows.
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionModeActive(false);
    setBulkAssignOpen(false);
  }, [tab, type, priority, due, debouncedSearch, page, limit, sort, order]);

  const exitSelectionMode = () => {
    setSelectedIds(new Set());
    setSelectionModeActive(false);
    setBulkAssignOpen(false);
  };

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
    sort?: "dueAt" | "priority" | "createdAt" | "updatedAt";
    order?: "asc" | "desc";
  }) => {
    const params = new URLSearchParams(searchParams);
    const nextTab = next.tab ?? tab;
    const nextType = next.type ?? type;
    const nextPriority = next.priority ?? priority;
    const nextDue = next.due ?? due;
    const nextSearch = next.search ?? debouncedSearch;
    const nextSort = next.sort ?? sort;
    const nextOrder = next.order ?? order;

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

    if (nextSort === "dueAt") params.delete("sort");
    else params.set("sort", nextSort);

    if (nextOrder === "asc") params.delete("order");
    else params.set("order", nextOrder);

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
      sort,
      order,
    }),
    [page, limit, tab, type, priority, due, debouncedSearch, sort, order],
  );

  const analyticsQuery = useOperationsWorkAnalytics();
  const listQuery = useOperationsWorkList(listParams);
  const exportMutation = useExportOperationsWork();
  const claimMutation = useClaimOperationsWork();
  const statusMutation = useUpdateOperationsWorkStatus();

  const analytics = analyticsQuery.data;
  const listData = listQuery.data;
  const listItems = listData?.items ?? [];

  const isItemSelectable = (item: OperationsWorkListItem) => {
    if (!canBulkAssign) return false;
    if (item.status === "completed" || item.status === "cancelled") {
      return false;
    }
    return true;
  };

  const selectedItems = useMemo(
    () => listItems.filter((item) => selectedIds.has(item.id)),
    [listItems, selectedIds],
  );

  const toggleSelect = (item: OperationsWorkListItem) => {
    if (!isItemSelectable(item)) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const selectable = listItems.filter(isItemSelectable);
    setSelectedIds((current) => {
      const allSelected =
        selectable.length > 0 &&
        selectable.every((item) => current.has(item.id));
      if (allSelected) {
        const next = new Set(current);
        for (const item of selectable) next.delete(item.id);
        return next;
      }
      const next = new Set(current);
      for (const item of selectable) next.add(item.id);
      return next;
    });
  };

  const isInitialLoading =
    (analyticsQuery.isPending && !analytics) ||
    (listQuery.isPending && !listData);

  const handleKpiSelect = (
    key: "doNow" | "dueToday" | "upcoming" | "waiting" | "completed",
  ) => {
    setPage(1);
    switch (key) {
      case "doNow":
        // Matches backend KPI: P1 OR overdue (due=do_now).
        setTab("all");
        setPriority("");
        setDue("do_now");
        setType("");
        syncParams({
          tab: "all",
          priority: "",
          due: "do_now",
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
    if (action === "select") {
      if (!canBulkAssign) return;
      setBulkResultMessage(null);
      setSelectionModeActive(true);
      return;
    }
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
      setWaitingItem(item);
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

            {bulkResultMessage ? (
              <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-xs text-foreground">
                {bulkResultMessage}
              </div>
            ) : null}

            {canBulkAssign && selectionModeActive ? (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-[12px] font-semibold text-foreground">
                  {selectedItems.length > 0 ? (
                    <>
                      {selectedItems.length} selected
                      <span className="ml-1 font-normal text-muted">
                        (current page only)
                      </span>
                    </>
                  ) : (
                    <span className="font-normal text-muted">
                      Selection mode — choose work items to assign
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={selectedItems.length === 0}
                    onClick={() => {
                      setBulkResultMessage(null);
                      setBulkAssignOpen(true);
                    }}
                    className="h-8 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    onClick={exitSelectionMode}
                    className="h-8 rounded-lg border border-border-subtle px-3 text-[11px] font-semibold text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Exit selection
                  </button>
                </div>
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
                  items={listItems}
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
                  sort={sort}
                  order={order}
                  onSortChange={(nextSort, nextOrder) => {
                    setSort(nextSort);
                    setOrder(nextOrder);
                    setPage(1);
                    syncParams({ sort: nextSort, order: nextOrder });
                  }}
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
                  selectionEnabled={canBulkAssign && selectionModeActive}
                  showSelectMenuOption={canBulkAssign && !selectionModeActive}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                  onToggleSelectAllVisible={toggleSelectAllVisible}
                  isItemSelectable={isItemSelectable}
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
      <MyWorkWaitingReasonDialog
        open={Boolean(waitingItem)}
        workTitle={waitingItem?.title}
        isSubmitting={Boolean(waitingItem && busyId === waitingItem.id)}
        onClose={() => setWaitingItem(null)}
        onConfirm={async (reason) => {
          if (!waitingItem) return;
          await runStatus(waitingItem, "waiting", reason);
          setWaitingItem(null);
        }}
      />
      <MyWorkBulkAssignDialog
        open={bulkAssignOpen}
        items={selectedItems}
        onClose={() => setBulkAssignOpen(false)}
        onComplete={(result) => {
          setBulkResultMessage(
            result.failed === 0
              ? `${result.succeeded} of ${result.requested} assigned successfully.`
              : `${result.succeeded} of ${result.requested} assigned. ${result.failed} could not be assigned.`,
          );
          if (result.succeeded > 0) {
            setSelectedIds((current) => {
              const next = new Set(current);
              for (const row of result.successful) next.delete(row.workItemId);
              return next;
            });
          }
        }}
      />
    </OperationsLayout>
  );
}
