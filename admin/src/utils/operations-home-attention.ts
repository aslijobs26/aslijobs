import { operationsMyWorkDetailPath } from "../constants/operations-routes";
import type { AttentionTabId } from "../types/operations-dashboard";
import type {
  AttentionDueTone,
  AttentionStatus,
  AttentionWorkItem,
  AttentionWorkType,
} from "../types/operations-attention";
import type { OperationsWorkListItem, WorkItemType } from "../types/operations-work";

const OPEN_STATUSES = new Set(["queued", "assigned", "in_progress", "waiting"]);

const TAB_LABELS: Array<{ id: AttentionTabId; label: string }> = [
  { id: "urgent", label: "Urgent" },
  { id: "sla_risk", label: "SLA Risk" },
  { id: "high_priority", label: "High Priority" },
  { id: "unassigned", label: "Unassigned" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatAgo(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatDue(
  iso: string | null,
  now: number,
): { label: string; tone: AttentionDueTone } {
  if (!iso) return { label: "No due date", tone: "neutral" };
  const due = Date.parse(iso);
  if (!Number.isFinite(due)) return { label: "No due date", tone: "neutral" };
  const diff = due - now;
  const hours = Math.max(1, Math.round(Math.abs(diff) / 3_600_000));
  if (diff < 0) {
    return {
      label: hours < 24 ? `${hours}h overdue` : `${Math.round(hours / 24)}d overdue`,
      tone: "danger",
    };
  }
  if (hours < 24) {
    return { label: `${hours}h left`, tone: hours <= 2 ? "danger" : "warning" };
  }
  return { label: `${Math.round(hours / 24)}d left`, tone: "neutral" };
}

function isOverdue(item: OperationsWorkListItem, now: number): boolean {
  const due = item.dueAt ? Date.parse(item.dueAt) : Number.NaN;
  const sla = item.slaTargetAt ? Date.parse(item.slaTargetAt) : Number.NaN;
  return (
    (Number.isFinite(due) && due < now) || (Number.isFinite(sla) && sla < now)
  );
}

function attentionTabs(item: OperationsWorkListItem, now: number): AttentionTabId[] {
  const tabs: AttentionTabId[] = [];
  const overdue = isOverdue(item, now);
  if (item.priority === "P1" || overdue) tabs.push("urgent");
  if (overdue) tabs.push("sla_risk");
  if (item.priority === "P1" || item.priority === "P2") tabs.push("high_priority");
  if (!item.assignedToUserId) tabs.push("unassigned");
  return tabs;
}

function workType(type: WorkItemType): AttentionWorkType {
  if (
    type === "verification" ||
    type === "support" ||
    type === "job_operations" ||
    type === "hiring_operations"
  ) {
    return type;
  }
  return "others";
}

function attentionStatus(status: OperationsWorkListItem["status"]): AttentionStatus {
  if (status === "in_progress" || status === "waiting" || status === "queued") {
    return status;
  }
  return "open";
}

export function toHomeAttentionItems(
  items: readonly OperationsWorkListItem[],
  now = Date.now(),
): AttentionWorkItem[] {
  return items.flatMap((item) => {
    if (!OPEN_STATUSES.has(item.status)) return [];
    const tabs = attentionTabs(item, now);
    if (tabs.length === 0) return [];
    const due = formatDue(item.dueAt ?? item.slaTargetAt, now);
    const ownerName = item.assignedToName?.trim() ?? "";
    return [
      {
        id: item.id,
        displayId: item.displayId,
        priority: item.priority,
        title: item.title,
        subtitle: item.description.trim() || item.statusLabel,
        workType: workType(item.type),
        workTypeLabel: item.typeLabel,
        relatedTo: item.relatedLabel.trim() || item.displayId,
        locationLabel: item.relatedLocationLabel.trim() || item.typeLabel,
        owner: ownerName
          ? { name: ownerName, initials: initials(ownerName) || "TM" }
          : null,
        createdAgo: formatAgo(item.createdAt, now),
        dueLabel: due.label,
        dueTone: due.tone,
        status: attentionStatus(item.status),
        statusLabel: item.statusLabel,
        actionLabel: "Open",
        actionHref: operationsMyWorkDetailPath(item.id),
        tabs,
      },
    ];
  });
}

export function homeAttentionTabs(items: readonly AttentionWorkItem[]) {
  return TAB_LABELS.map((tab) => ({
    ...tab,
    count: items.filter((item) => item.tabs.includes(tab.id)).length,
  }));
}
