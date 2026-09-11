import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { operationsMyWorkDetailPath } from "../../../constants/operations-routes";
import type {
  OperationsWorkListItem,
  WorkDueFilter,
  WorkQueueTab,
} from "../../../types/operations-work";
import { cn } from "../../../utils/cn";
import { OperationsBadge } from "../../ui/OperationsBadge";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { formatWorkDueLabel, relatedEntityHref } from "./my-work-format";
import {
  MyWorkRowActions,
  type MyWorkRowAction,
} from "./MyWorkRowActions";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";

interface MyWorkTableSectionProps {
  items: OperationsWorkListItem[];
  tabs: {
    myQueue: number;
    waiting: number;
    completed: number;
    all: number;
  };
  activeTab: WorkQueueTab;
  onTabChange: (tab: WorkQueueTab) => void;
  type: string;
  onTypeChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  due: WorkDueFilter;
  onDueChange: (value: WorkDueFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  busyId?: string | null;
  onRowAction: (item: OperationsWorkListItem, action: MyWorkRowAction) => void;
  canFilter?: boolean;
  canSearch?: boolean;
  /** When true, All is listed first (operational heads / managers). */
  preferAllFirst?: boolean;
}

const SPECIALIST_TABS: Array<{
  id: WorkQueueTab;
  label: string;
  countKey: keyof MyWorkTableSectionProps["tabs"];
}> = [
  { id: "my_queue", label: "My Queue", countKey: "myQueue" },
  { id: "waiting", label: "Waiting", countKey: "waiting" },
  { id: "completed", label: "Completed", countKey: "completed" },
  { id: "all", label: "All", countKey: "all" },
];

/** Operational heads see All first (team queue + scoped work). */
const OPERATIONS_HEAD_TABS: Array<{
  id: WorkQueueTab;
  label: string;
  countKey: keyof MyWorkTableSectionProps["tabs"];
}> = [
  { id: "all", label: "All", countKey: "all" },
  { id: "my_queue", label: "My Queue", countKey: "myQueue" },
  { id: "waiting", label: "Waiting", countKey: "waiting" },
  { id: "completed", label: "Completed", countKey: "completed" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "verification", label: "Verification" },
  { value: "support", label: "Support" },
  { value: "job_operations", label: "Job Operations" },
  { value: "jobseeker", label: "Jobseeker" },
  { value: "hiring_operations", label: "Hiring Operations" },
  { value: "placements", label: "Placements" },
  { value: "employer", label: "Employer" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "P1", label: "P1" },
  { value: "P2", label: "P2" },
  { value: "P3", label: "P3" },
] as const;

const DUE_OPTIONS = [
  { value: "all", label: "All Due" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due Today" },
  { value: "due_soon", label: "Due Soon" },
  { value: "upcoming", label: "Upcoming" },
] as const;

const thClassName =
  "whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted first:pl-4 last:pr-4 sm:px-3.5 xl:px-2.5 xl:py-2 xl:text-[9px] xl:first:pl-3 xl:last:pr-3";

function priorityVariant(
  priority: string,
): "high" | "medium" | "low" {
  if (priority === "P1") return "high";
  if (priority === "P2") return "medium";
  return "low";
}

function statusVariant(
  status: string,
): "default" | "verification" | "support" | "job" {
  if (status === "in_progress") return "verification";
  if (status === "assigned") return "default";
  if (status === "waiting") return "job";
  if (status === "completed") return "default";
  return "support";
}

function emptyCopy(tab: WorkQueueTab): { title: string; body: string } {
  switch (tab) {
    case "my_queue":
      return {
        title: "Your queue is clear.",
        body: "New assignments will appear here when work is assigned to you.",
      };
    case "waiting":
      return {
        title: "No work is waiting.",
        body: "Items put on hold will show up in this tab.",
      };
    case "completed":
      return {
        title: "No completed work found.",
        body: "Completed work items remain available for history and audit.",
      };
    default:
      return {
        title: "No work items found.",
        body: "Try adjusting filters or search.",
      };
  }
}

export function MyWorkTableSection({
  items,
  tabs,
  activeTab,
  onTabChange,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
  due,
  onDueChange,
  search,
  onSearchChange,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  busyId,
  onRowAction,
  canFilter = true,
  canSearch = true,
  preferAllFirst = false,
}: MyWorkTableSectionProps) {
  const { canKey } = useOperationsPermissions();
  const empty = emptyCopy(activeTab);
  const showFilters = canFilter && canKey("my_work.list.filter");
  const showSearch = canSearch && canKey("my_work.list.search");
  const tabsConfig = preferAllFirst ? OPERATIONS_HEAD_TABS : SPECIALIST_TABS;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="border-b border-border-subtle px-3 py-2.5 sm:px-4 xl:px-3 xl:py-2">
        <div className="flex min-w-0 flex-col gap-2.5">
          <div
            className="-mx-0.5 flex min-w-0 items-end gap-0 overflow-x-auto overscroll-x-contain border-b border-border-subtle px-0.5 scrollbar-hidden"
            role="tablist"
            aria-label="Work queues"
          >
            {tabsConfig.map((tab) => {
              const active = activeTab === tab.id;
              const count = tabs[tab.countKey] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "relative shrink-0 px-3 pb-2.5 pt-1 text-[12px] font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 xl:text-[11px]",
                    active ? "text-primary" : "text-muted hover:text-foreground",
                  )}
                >
                  {tab.label}{" "}
                  <span className="tabular-nums">({count.toLocaleString("en-IN")})</span>
                  {active ? (
                    <span
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {showFilters ? (
              <>
                <OperationsFilterSelect
                  label="Type"
                  value={type}
                  options={TYPE_OPTIONS}
                  onChange={onTypeChange}
                  hideSearch
                  mobileSheet
                  className="min-w-[7.5rem] sm:w-auto"
                />
                <OperationsFilterSelect
                  label="Priority"
                  value={priority}
                  options={PRIORITY_OPTIONS}
                  onChange={onPriorityChange}
                  hideSearch
                  mobileSheet
                  className="min-w-[7.5rem] sm:w-auto"
                />
                <OperationsFilterSelect
                  label="Due"
                  value={due}
                  options={DUE_OPTIONS}
                  onChange={(value) => onDueChange(value as WorkDueFilter)}
                  hideSearch
                  mobileSheet
                  className="min-w-[7.5rem] sm:w-auto"
                />
              </>
            ) : null}
            {showSearch ? (
              <label className="relative min-w-0 flex-1 sm:min-w-[12rem]">
                <span className="sr-only">Search my work</span>
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search my work..."
                  className="h-8 w-full rounded-md border border-border-subtle bg-surface pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </label>
            ) : null}
          </div>
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-hero-bg/40">
              <th className={thClassName} scope="col">
                <span className="sr-only">Select</span>
              </th>
              <th className={thClassName} scope="col">
                Priority
              </th>
              <th className={thClassName} scope="col">
                Work Item
              </th>
              <th className={thClassName} scope="col">
                Type
              </th>
              <th className={thClassName} scope="col">
                Related To
              </th>
              <th className={thClassName} scope="col">
                Due
              </th>
              <th className={thClassName} scope="col">
                Status
              </th>
              <th className={thClassName} scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted">
                  Loading work items…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-danger">
                    {errorMessage ?? "Failed to load work items."}
                  </p>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Retry
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center">
                  <p className="text-sm font-medium text-foreground">{empty.title}</p>
                  <p className="mt-1 text-xs text-muted">{empty.body}</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const dueInfo = formatWorkDueLabel(item.dueAt);
                const relatedHref = relatedEntityHref(
                  item.relatedEntityType,
                  item.relatedEntityId,
                );
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border-subtle last:border-b-0 hover:bg-hero-bg/30"
                  >
                    <td className="px-3 py-2.5 first:pl-4 xl:px-2.5 xl:first:pl-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.displayId}`}
                        className="size-3.5 rounded border-border-subtle"
                      />
                    </td>
                    <td className="px-3 py-2.5 xl:px-2.5">
                      <OperationsBadge variant={priorityVariant(item.priority)}>
                        {item.priority}
                      </OperationsBadge>
                    </td>
                    <td className="max-w-[16rem] px-3 py-2.5 xl:px-2.5">
                      <Link
                        to={operationsMyWorkDetailPath(item.id)}
                        className="block truncate text-[12px] font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        {item.title}
                      </Link>
                      <p className="truncate text-[10px] text-muted">
                        {item.displayId}
                        {item.assignedToUserId == null &&
                        item.status === "queued"
                          ? " · Team queue"
                          : null}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-foreground xl:px-2.5">
                      {item.typeLabel}
                    </td>
                    <td className="max-w-[14rem] px-3 py-2.5 xl:px-2.5">
                      {relatedHref && item.relatedLabel ? (
                        <Link
                          to={relatedHref}
                          className="block truncate text-[11px] font-medium text-foreground hover:text-primary"
                        >
                          {item.relatedLabel}
                        </Link>
                      ) : (
                        <span className="block truncate text-[11px] text-foreground">
                          {item.relatedLabel || "—"}
                        </span>
                      )}
                      {item.relatedLocationLabel ? (
                        <span className="block truncate text-[10px] text-muted">
                          {item.relatedLocationLabel}
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 text-[11px] font-medium xl:px-2.5",
                        dueInfo.tone === "danger" && "text-danger",
                        dueInfo.tone === "warning" && "text-warning",
                        dueInfo.tone === "neutral" && "text-foreground",
                      )}
                    >
                      {dueInfo.label}
                    </td>
                    <td className="px-3 py-2.5 xl:px-2.5">
                      <OperationsBadge variant={statusVariant(item.status)}>
                        {item.statusLabel}
                      </OperationsBadge>
                    </td>
                    <td className="px-3 py-2.5 last:pr-4 xl:px-2.5 xl:last:pr-3">
                      <MyWorkRowActions
                        item={item}
                        busy={busyId === item.id}
                        onAction={(action) => onRowAction(item, action)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col divide-y divide-border-subtle md:hidden">
        {isLoading ? (
          <li className="px-4 py-10 text-center text-sm text-muted">
            Loading work items…
          </li>
        ) : isError ? (
          <li className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-danger">
              {errorMessage ?? "Failed to load work items."}
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-xs font-semibold text-primary"
              >
                Retry
              </button>
            ) : null}
          </li>
        ) : items.length === 0 ? (
          <li className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">{empty.title}</p>
            <p className="mt-1 text-xs text-muted">{empty.body}</p>
          </li>
        ) : (
          items.map((item) => {
            const dueInfo = formatWorkDueLabel(item.dueAt);
            return (
              <li key={item.id} className="flex flex-col gap-2 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={operationsMyWorkDetailPath(item.id)}
                      className="text-[13px] font-semibold text-foreground"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[10px] text-muted">{item.displayId}</p>
                  </div>
                  <MyWorkRowActions
                    item={item}
                    busy={busyId === item.id}
                    onAction={(action) => onRowAction(item, action)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <OperationsBadge variant={priorityVariant(item.priority)}>
                    {item.priority}
                  </OperationsBadge>
                  <OperationsBadge variant={statusVariant(item.status)}>
                    {item.statusLabel}
                  </OperationsBadge>
                  <span className="text-[11px] text-muted">{item.typeLabel}</span>
                </div>
                <p className="text-[11px] text-foreground">
                  {item.relatedLabel || "—"}
                  {item.relatedLocationLabel
                    ? ` · ${item.relatedLocationLabel}`
                    : ""}
                </p>
                <p
                  className={cn(
                    "text-[11px] font-medium",
                    dueInfo.tone === "danger" && "text-danger",
                    dueInfo.tone === "warning" && "text-warning",
                  )}
                >
                  Due: {dueInfo.label}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
