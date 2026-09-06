import { useMemo, useState } from "react";
import { OPERATIONS_ATTENTION_MOCK } from "../data/operations-attention.mock";
import type {
  AttentionQueueTabId,
  AttentionWorkItem,
  OperationsAttentionData,
} from "../types/operations-attention";

export interface AttentionFilters {
  workType: string;
  team: string;
  location: string;
  dueDate: string;
  search: string;
  quickFilter: string | null;
}

const PAGE_SIZE = 10;

const INITIAL_FILTERS: AttentionFilters = {
  workType: "",
  team: "",
  location: "",
  dueDate: "",
  search: "",
  quickFilter: null,
};

function matchesQuickFilter(
  item: AttentionWorkItem,
  quickFilter: string | null,
): boolean {
  if (!quickFilter) {
    return true;
  }

  switch (quickFilter) {
    case "my_team":
      return item.owner !== null;
    case "my_location":
      return /hyderabad|bengaluru|chennai|mumbai|telangana|karnataka|tamil|maharashtra/i.test(
        `${item.relatedTo} ${item.locationLabel}`,
      );
    case "created_today":
      return /h ago|m ago/i.test(item.createdAgo);
    case "high_value":
      return item.workType === "verification" || item.workType === "payments";
    case "escalated":
      return item.tabs.includes("urgent") || item.workType === "risk";
    case "waiting_customer":
      return item.status === "waiting";
    default:
      return true;
  }
}

function matchesDueDate(item: AttentionWorkItem, dueDate: string): boolean {
  if (!dueDate) {
    return true;
  }
  if (dueDate === "urgent") {
    return item.dueTone === "danger";
  }
  if (dueDate === "warning") {
    return item.dueTone === "warning";
  }
  if (dueDate === "later") {
    return item.dueTone === "neutral";
  }
  return true;
}

export function useOperationsAttention() {
  const data: OperationsAttentionData = OPERATIONS_ATTENTION_MOCK;
  const [activeTab, setActiveTab] = useState<AttentionQueueTabId>("all");
  const [filters, setFilters] = useState<AttentionFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewSaved, setViewSaved] = useState(false);

  const filterOptions = useMemo(() => {
    const types = Array.from(
      new Map(
        data.items.map((item) => [item.workType, item.workTypeLabel]),
      ).entries(),
    ).map(([value, label]) => ({ value, label }));

    const teams = Array.from(
      new Set(
        data.items
          .map((item) => item.owner?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name }));

    const locations = Array.from(
      new Set(data.items.map((item) => item.locationLabel)),
    )
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ value: label, label }));

    return { types, teams, locations };
  }, [data.items]);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return data.items.filter((item) => {
      if (activeTab !== "all" && !item.tabs.includes(activeTab)) {
        return false;
      }
      if (filters.workType && item.workType !== filters.workType) {
        return false;
      }
      if (filters.team) {
        if (!item.owner || item.owner.name !== filters.team) {
          return false;
        }
      }
      if (filters.location && item.locationLabel !== filters.location) {
        return false;
      }
      if (!matchesDueDate(item, filters.dueDate)) {
        return false;
      }
      if (!matchesQuickFilter(item, filters.quickFilter)) {
        return false;
      }
      if (query) {
        const haystack = [
          item.title,
          item.subtitle,
          item.displayId,
          item.relatedTo,
          item.locationLabel,
          item.owner?.name ?? "unassigned",
          item.workTypeLabel,
          item.statusLabel,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [activeTab, data.items, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, safePage]);

  const updateFilters = (patch: Partial<AttentionFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
    setSelectedIds(new Set());
  };

  const setTab = (tab: AttentionQueueTabId) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleRow = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleVisibleRows = () => {
    const visibleIds = pageItems.map((item) => item.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const exportCsv = () => {
    const header = [
      "Priority",
      "Work Item",
      "ID",
      "Type",
      "Related To",
      "Location",
      "Owner",
      "Due In",
      "Status",
    ];
    const rows = filteredItems.map((item) => [
      item.priority,
      item.title,
      item.displayId,
      item.workTypeLabel,
      item.relatedTo,
      item.locationLabel,
      item.owner?.name ?? "Unassigned",
      item.dueLabel,
      item.statusLabel,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "what-needs-attention.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return {
    data,
    activeTab,
    setTab,
    filters,
    updateFilters,
    filterOptions,
    filteredItems,
    pageItems,
    page: safePage,
    setPage,
    totalPages,
    pageSize: PAGE_SIZE,
    selectedIds,
    toggleRow,
    toggleVisibleRows,
    exportCsv,
    viewSaved,
    saveView: () => setViewSaved(true),
  };
}
