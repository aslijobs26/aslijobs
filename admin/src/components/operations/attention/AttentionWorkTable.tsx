import {
  AlertTriangle,
  Briefcase,
  Building2,
  CreditCard,
  FileCheck2,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  AttentionQueueTabId,
  AttentionTabMeta,
  AttentionWorkItem,
  AttentionWorkType,
} from "../../../types/operations-attention";
import { OperationsAvatar } from "../../ui/OperationsAvatar";
import { OperationsFilterSelect } from "../jobs/OperationsFilterSelect";
import { cn } from "../../../utils/cn";
import type { AttentionFilters } from "../../../hooks/use-operations-attention";

interface AttentionWorkTableProps {
  tabs: AttentionTabMeta[];
  activeTab: AttentionQueueTabId;
  onTabChange: (tab: AttentionQueueTabId) => void;
  filters: AttentionFilters;
  onFiltersChange: (patch: Partial<AttentionFilters>) => void;
  filterOptions: {
    types: { value: string; label: string }[];
    teams: { value: string; label: string }[];
    locations: { value: string; label: string }[];
  };
  items: AttentionWorkItem[];
  totalFiltered: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleVisibleRows: () => void;
}

const PRIORITY_CLASSES: Record<AttentionWorkItem["priority"], string> = {
  P1: "bg-[#FEE2E2] text-[#B91C1C]",
  P2: "bg-[#FFEDD5] text-[#C2410C]",
  P3: "bg-[#DBEAFE] text-[#1D4ED8]",
};

const STATUS_CLASSES: Record<AttentionWorkItem["status"], string> = {
  in_progress: "bg-[#DBEAFE] text-[#1D4ED8]",
  open: "bg-[#FEE2E2] text-[#B91C1C]",
  queued: "bg-[#F1F5F9] text-[#475569]",
  waiting: "bg-[#FFEDD5] text-[#C2410C]",
};

const TYPE_ICON: Record<AttentionWorkType, LucideIcon> = {
  verification: FileCheck2,
  support: MessageCircle,
  risk: ShieldAlert,
  job_operations: Briefcase,
  hiring_operations: Building2,
  payments: CreditCard,
  others: AlertTriangle,
};

const DUE_DATE_OPTIONS = [
  { value: "", label: "Due Date" },
  { value: "urgent", label: "Due soon" },
  { value: "warning", label: "At risk" },
  { value: "later", label: "Later today" },
] as const;

export function AttentionWorkTable({
  tabs,
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  filterOptions,
  items,
  totalFiltered,
  page,
  totalPages,
  pageSize,
  onPageChange,
  selectedIds,
  onToggleRow,
  onToggleVisibleRows,
}: AttentionWorkTableProps) {
  const allVisibleSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const from = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalFiltered);

  return (
    <section className="min-w-0 rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div
        className="flex gap-1 overflow-x-auto border-b border-border-subtle px-3 pt-1 scrollbar-hidden sm:px-4"
        role="tablist"
        aria-label="Work item queues"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-b border-border-subtle px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-4">
        <OperationsFilterSelect
          label="All Types"
          value={filters.workType}
          options={[
            { value: "", label: "All Types" },
            ...filterOptions.types,
          ]}
          onChange={(value) => onFiltersChange({ workType: value })}
          hideSearch
          className="w-full sm:w-auto sm:min-w-[8.5rem]"
        />
        <OperationsFilterSelect
          label="All Teams"
          value={filters.team}
          options={[{ value: "", label: "All Teams" }, ...filterOptions.teams]}
          onChange={(value) => onFiltersChange({ team: value })}
          className="w-full sm:w-auto sm:min-w-[8.5rem]"
        />
        <OperationsFilterSelect
          label="All Locations"
          value={filters.location}
          options={[
            { value: "", label: "All Locations" },
            ...filterOptions.locations,
          ]}
          onChange={(value) => onFiltersChange({ location: value })}
          className="w-full sm:w-auto sm:min-w-[9rem]"
        />
        <OperationsFilterSelect
          label="Due Date"
          value={filters.dueDate}
          options={[...DUE_DATE_OPTIONS]}
          onChange={(value) => onFiltersChange({ dueDate: value })}
          hideSearch
          className="w-full sm:w-auto sm:min-w-[8rem]"
        />
        <label className="relative ml-auto w-full sm:w-auto sm:min-w-[14rem] sm:max-w-[18rem]">
          <span className="sr-only">Search items</span>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ search: event.target.value })
            }
            placeholder="Search items..."
            className="h-8 w-full rounded-md border border-border-subtle bg-surface pl-8 pr-2.5 text-[11px] text-foreground placeholder:text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[64rem] w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={onToggleVisibleRows}
                  aria-label="Select all visible work items"
                  className="size-3.5 rounded border-border-subtle text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </th>
              <th className="px-2 py-2.5">Priority</th>
              <th className="px-2 py-2.5">Work Item</th>
              <th className="px-2 py-2.5">Type</th>
              <th className="px-2 py-2.5">Related To</th>
              <th className="px-2 py-2.5">Owner</th>
              <th className="px-2 py-2.5">Due In</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-[13px] text-muted"
                >
                  No items need attention for the current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const TypeIcon = TYPE_ICON[item.workType] ?? FileCheck2;
                return (
                  <tr
                    key={item.id}
                    className="border-t border-border-subtle text-[12px] hover:bg-[#FAFBFC]"
                  >
                    <td className="px-3 py-2.5 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggleRow(item.id)}
                        aria-label={`Select ${item.title}`}
                        className="size-3.5 rounded border-border-subtle text-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                      />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-7 items-center justify-center rounded px-1.5 text-[10px] font-bold",
                          PRIORITY_CLASSES[item.priority],
                        )}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="max-w-[14rem] px-2 py-2.5 align-middle">
                      <p className="truncate font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {item.displayId}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <TypeIcon
                          className="size-3.5 shrink-0 text-muted"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span className="whitespace-nowrap">
                          {item.workTypeLabel}
                        </span>
                      </span>
                    </td>
                    <td className="max-w-[12rem] px-2 py-2.5 align-middle">
                      <p className="truncate font-medium text-foreground">
                        {item.relatedTo}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {item.locationLabel}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      {item.owner ? (
                        <span className="inline-flex items-center gap-1.5">
                          <OperationsAvatar
                            initials={item.owner.initials}
                            size="sm"
                          />
                          <span className="whitespace-nowrap font-medium text-foreground">
                            {item.owner.name}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <span
                        className={cn(
                          "whitespace-nowrap font-semibold",
                          item.dueTone === "danger" && "text-danger",
                          item.dueTone === "warning" && "text-warning",
                          item.dueTone === "neutral" && "text-muted",
                        )}
                      >
                        {item.dueLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <span
                        className={cn(
                          "inline-flex h-6 items-center rounded-full px-2 text-[10px] font-semibold",
                          STATUS_CLASSES[item.status],
                        )}
                      >
                        {item.statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 pr-3 align-middle">
                      <div className="flex items-center gap-1">
                        <Link
                          to={item.actionHref}
                          className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-[11px] font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        >
                          {item.actionLabel}
                        </Link>
                        <Link
                          to={item.actionHref}
                          className="inline-flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                          aria-label={`More actions for ${item.title}`}
                        >
                          <MoreHorizontal
                            className="size-4"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-subtle px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="text-[11px] text-muted">
          Showing {from}–{to} of {totalFiltered} items
        </p>
        <nav
          className="flex items-center justify-center gap-1"
          aria-label="Attention pagination"
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={cn(
                  "inline-flex size-8 items-center justify-center rounded-md border text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  pageNumber === page
                    ? "border-primary bg-primary text-surface"
                    : "border-border-subtle bg-surface text-foreground hover:bg-hero-bg",
                )}
                aria-current={pageNumber === page ? "page" : undefined}
              >
                {pageNumber}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface text-[11px] font-medium text-foreground transition-colors hover:bg-hero-bg disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      </div>
    </section>
  );
}
