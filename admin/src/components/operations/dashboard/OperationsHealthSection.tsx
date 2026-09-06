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
          className="text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          View details →
        </Link>
      }
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <Link
              to={item.href}
              className="flex h-full flex-col rounded-lg border border-border-subtle bg-hero-bg/40 px-3 py-2.5 transition-colors hover:border-primary/20 hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <p className="text-[12px] font-semibold text-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold",
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
              <p className="mt-0.5 text-[11px] text-muted">{item.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </OperationsCard>
  );
}
