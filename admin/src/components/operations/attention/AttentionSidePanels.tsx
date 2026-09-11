import {
  AlertTriangle,
  Briefcase,
  Building2,
  CreditCard,
  FileCheck2,
  Filter,
  MapPin,
  MessageCircle,
  ShieldAlert,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type {
  AttentionQuickFilter,
  AttentionSlaStatusItem,
  AttentionWorkByTypeItem,
  AttentionWorkType,
} from "../../../types/operations-attention";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

interface AttentionSidePanelsProps {
  quickFilters: AttentionQuickFilter[];
  activeQuickFilter: string | null;
  onQuickFilterChange: (id: string | null) => void;
  onSaveView: () => void;
  viewSaved: boolean;
  slaStatus: AttentionSlaStatusItem[];
  workByType: AttentionWorkByTypeItem[];
}

const QUICK_ICONS: Record<string, LucideIcon> = {
  my_team: Users,
  my_location: MapPin,
  created_today: Star,
  high_value: Building2,
  escalated: AlertTriangle,
  waiting_customer: MessageCircle,
};

const TYPE_ICONS: Record<AttentionWorkType, LucideIcon> = {
  verification: FileCheck2,
  support: MessageCircle,
  risk: ShieldAlert,
  job_operations: Briefcase,
  hiring_operations: Building2,
  payments: CreditCard,
  others: Filter,
};

const SLA_DOT: Record<AttentionSlaStatusItem["tone"], string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function AttentionSidePanels({
  quickFilters,
  activeQuickFilter,
  onQuickFilterChange,
  onSaveView,
  viewSaved,
  slaStatus,
  workByType,
}: AttentionSidePanelsProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <OperationsCard title="Quick Filters" bodyClassName="space-y-1 p-2 sm:p-2.5">
        <ul className="space-y-0.5">
          {quickFilters.map((filter) => {
            const Icon = QUICK_ICONS[filter.id] ?? Filter;
            const selected = activeQuickFilter === filter.id;
            return (
              <li key={filter.id}>
                <button
                  type="button"
                  onClick={() =>
                    onQuickFilterChange(selected ? null : filter.id)
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "bg-primary-light text-primary"
                      : "text-foreground hover:bg-hero-bg",
                  )}
                  aria-pressed={selected}
                >
                  <Icon
                    className="size-3.5 shrink-0 text-muted"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {filter.label}
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold text-muted">
                    {filter.count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={onSaveView}
          className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {viewSaved ? "View saved" : "Save this view"}
        </button>
      </OperationsCard>

      <OperationsCard title="SLA Status" bodyClassName="space-y-2 p-2.5 sm:p-3">
        <ul className="space-y-2">
          {slaStatus.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 text-[12px]"
            >
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <span
                  className={cn("size-2 rounded-full", SLA_DOT[item.tone])}
                  aria-hidden="true"
                />
                {item.label}
              </span>
              <span className="font-semibold text-muted">{item.count}</span>
            </li>
          ))}
        </ul>
      </OperationsCard>

      <OperationsCard title="Work by Type" bodyClassName="space-y-1 p-2 sm:p-2.5">
        <ul className="space-y-0.5">
          {workByType.map((item) => {
            const Icon = TYPE_ICONS[item.workType] ?? Filter;
            return (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px]"
              >
                <Icon
                  className="size-3.5 shrink-0 text-muted"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {item.label}
                </span>
                <span className="shrink-0 font-semibold text-muted">
                  {item.count}
                </span>
              </li>
            );
          })}
        </ul>
      </OperationsCard>

      <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-[#EFF6FF] to-[#F8FAFC] p-3.5 shadow-sm">
        <p className="text-[12px] font-semibold text-foreground">Need Help?</p>
        <div className="mt-2 flex items-start gap-2.5">
          <img
            src="/assets/ask-asli-robot.png"
            alt=""
            className="size-12 shrink-0 object-contain"
          />
          <p className="text-[11px] leading-snug text-muted">
            Ask ASLI for insights, summaries or next best actions.
          </p>
        </div>
        <Link
          to={OPERATIONS_ROUTES.MY_WORK}
          className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-md bg-primary text-[12px] font-semibold text-surface transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Ask ASLI
        </Link>
      </section>
    </div>
  );
}
