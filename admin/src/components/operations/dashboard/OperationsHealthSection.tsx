import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsHealthItem } from "../../../types/operations-dashboard";
import { OperationsCard } from "../../ui/OperationsCard";
import { cn } from "../../../utils/cn";

const STATUS_LABEL: Record<OperationsHealthItem["status"], string> = {
  healthy: "Healthy",
  needs_attention: "Needs attention",
  sla_risk: "SLA risk",
};

const STATUS_DOT: Record<OperationsHealthItem["status"], string> = {
  healthy: "bg-success",
  needs_attention: "bg-warning",
  sla_risk: "bg-danger",
};

const STATUS_TEXT: Record<OperationsHealthItem["status"], string> = {
  healthy: "text-success",
  needs_attention: "text-warning",
  sla_risk: "text-danger",
};

const STATUS_CARD: Record<OperationsHealthItem["status"], string> = {
  healthy:
    "border-success/20 border-l-success from-surface to-success/5 hover:border-success/40 hover:border-l-success hover:to-success/15 hover:shadow-success/10",
  needs_attention:
    "border-warning/20 border-l-warning from-surface to-warning/5 hover:border-warning/40 hover:border-l-warning hover:to-warning/15 hover:shadow-warning/10",
  sla_risk:
    "border-danger/20 border-l-danger from-surface to-danger/5 hover:border-danger/40 hover:border-l-danger hover:to-danger/15 hover:shadow-danger/10",
};

const STATUS_HOVER_TEXT: Record<OperationsHealthItem["status"], string> = {
  healthy: "group-hover:text-success",
  needs_attention: "group-hover:text-warning",
  sla_risk: "group-hover:text-danger",
};

interface OperationsHealthSectionProps {
  items: OperationsHealthItem[];
}

export function OperationsHealthSection({
  items,
}: OperationsHealthSectionProps) {
  return (
    <OperationsCard
      title="Operations Health"
      className="min-w-0"
      action={
        <Link
          to={OPERATIONS_ROUTES.ACTIVITY_LOG}
          className="text-[11px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:text-[12px]"
        >
          View details →
        </Link>
      }
    >
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <Link
              to={item.href}
              className={cn(
                "group flex h-full flex-col rounded-lg border border-l-[3px] bg-gradient-to-br px-2.5 py-2 transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:px-3 sm:py-2.5",
                STATUS_CARD[item.status],
              )}
            >
              <p
                className={cn(
                  "flex items-center justify-between gap-1.5 text-[11px] font-semibold text-foreground transition-colors duration-200 sm:text-[12px]",
                  STATUS_HOVER_TEXT[item.status],
                )}
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <ArrowRight
                  className="size-3 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:size-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </p>
              <p
                className={cn(
                  "mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold sm:mt-1 sm:text-[11px]",
                  STATUS_TEXT[item.status],
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    STATUS_DOT[item.status],
                  )}
                  aria-hidden="true"
                />
                {STATUS_LABEL[item.status]}
              </p>
              <p className="mt-0.5 text-[10px] text-muted sm:text-[11px]">{item.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </OperationsCard>
  );
}
