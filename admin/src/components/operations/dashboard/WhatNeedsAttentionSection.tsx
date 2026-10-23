import {
  AlertTriangle,
  Briefcase,
  Building2,
  Clock3,
  CreditCard,
  FileCheck2,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  AttentionTabId,
  AttentionWorkItem,
  AttentionTabMeta,
} from "../../../types/operations-dashboard";
import type { AttentionWorkType } from "../../../types/operations-attention";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface WhatNeedsAttentionSectionProps {
  total: number;
  tabs: AttentionTabMeta[];
  items: AttentionWorkItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
}

const PRIORITY_CLASSES: Record<AttentionWorkItem["priority"], string> = {
  P1: "bg-danger text-surface",
  P2: "bg-warning text-surface",
  P3: "bg-primary text-surface",
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

export function WhatNeedsAttentionSection({
  total,
  tabs,
  items,
  isLoading = false,
  errorMessage = null,
}: WhatNeedsAttentionSectionProps) {
  const [activeTab, setActiveTab] = useState<AttentionTabId>(
    tabs[0]?.id ?? "urgent",
  );

  const filteredItems = useMemo(
    () => items.filter((item) => item.tabs.includes(activeTab)),
    [activeTab, items],
  );

  return (
    <OperationsCard
      title="What needs attention"
      subtitle="Items that need action from your team"
      className="min-w-0"
      badge={
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3.5 text-danger" strokeWidth={2} aria-hidden="true" />
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-surface">
            {total}
          </span>
        </span>
      }
      action={
        <Link
          to={OPERATIONS_ROUTES.WORK_QUEUE}
          className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[12px]"
        >
          View all →
        </Link>
      }
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0 sm:p-0"
    >
      <div
        className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border-subtle px-2 pt-0.5 scrollbar-hidden max-sm:px-2 sm:gap-1 sm:px-3.5 sm:pt-1"
        role="tablist"
        aria-label="Attention filters"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-2 py-2 text-[11px] font-medium transition-colors sm:px-2.5 sm:py-2.5 sm:text-[12px]",
                selected
                  ? "border-danger text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <ul className="max-h-[13.5rem] divide-y divide-border-subtle overflow-y-auto overscroll-contain scrollbar-hidden sm:max-h-[18.75rem]">
        {isLoading ? (
          <li className="px-2.5 py-6 text-center text-[11px] text-muted sm:px-3.5 sm:py-8 sm:text-[12px]">
            Loading attention items…
          </li>
        ) : errorMessage ? (
          <li className="px-2.5 py-6 text-center text-[11px] text-danger sm:px-3.5 sm:py-8 sm:text-[12px]">
            {errorMessage}
          </li>
        ) : filteredItems.length === 0 ? (
          <li className="px-2.5 py-6 text-center text-[11px] text-muted sm:px-3.5 sm:py-8 sm:text-[12px]">
            No items in this queue right now.
          </li>
        ) : (
          filteredItems.map((item) => {
            const TypeIcon = TYPE_ICON[item.workType] ?? FileCheck2;
            return (
              <li key={item.id}>
                {/* Mobile: compact two-line row */}
                <div className="flex items-center gap-2 px-2.5 py-2 sm:hidden">
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-6 shrink-0 items-center justify-center rounded px-1 text-[9px] font-bold",
                      PRIORITY_CLASSES[item.priority],
                    )}
                  >
                    {item.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px]">
                      <span className="min-w-0 truncate text-muted">
                        {item.relatedTo}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-semibold",
                          item.dueTone === "danger" && "text-danger",
                          item.dueTone === "warning" && "text-warning",
                          item.dueTone === "neutral" && "text-muted",
                        )}
                      >
                        {item.dueLabel}
                      </span>
                    </p>
                  </div>
                  <Link
                    to={item.actionHref}
                    className="inline-flex h-7 shrink-0 items-center rounded-md px-2 text-[10px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {item.actionLabel}
                  </Link>
                </div>

                {/* Tablet / desktop: full row */}
                <div className="hidden min-h-[3.75rem] items-center gap-3 px-3.5 py-2.5 sm:flex">
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-5 min-w-7 shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold",
                        PRIORITY_CLASSES[item.priority],
                      )}
                    >
                      {item.priority}
                    </span>
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-hero-bg text-muted">
                      <TypeIcon
                        className="size-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-[9.5rem] max-w-[11rem]">
                    <p className="truncate text-[12px] font-medium text-foreground">
                      {item.relatedTo}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {item.locationLabel}
                    </p>
                  </div>

                  <div className="min-w-[4.5rem] whitespace-nowrap text-right">
                    <p className="text-[11px] text-muted">{item.createdAgo}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[12px] font-semibold",
                        item.dueTone === "danger" && "text-danger",
                        item.dueTone === "warning" && "text-warning",
                        item.dueTone === "neutral" && "text-foreground",
                      )}
                    >
                      {item.dueLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={item.actionHref}
                      className="inline-flex h-8 items-center rounded-md px-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {item.actionLabel}
                    </Link>
                    <Link
                      to={item.actionHref}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hero-bg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      aria-label={`Open ${item.title}`}
                    >
                      <MoreHorizontal
                        className="size-4"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </OperationsCard>
  );
}
