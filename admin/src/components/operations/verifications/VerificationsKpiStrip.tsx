import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../../utils/cn";

export interface VerificationsKpiValues {
  totalPending: number;
  pendingToday: number;
  approved: number;
  rejected: number;
}

interface VerificationsKpiStripProps {
  kpis: VerificationsKpiValues;
}

const KPI_CONFIG: {
  id: keyof VerificationsKpiValues;
  label: string;
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  caption: string;
}[] = [
  {
    id: "totalPending",
    label: "Total Pending",
    icon: Clock,
    iconWrap: "bg-warning/10",
    iconColor: "text-warning",
    caption: "Awaiting review",
  },
  {
    id: "pendingToday",
    label: "Pending Today",
    icon: ShieldAlert,
    iconWrap: "bg-chart-accent/10",
    iconColor: "text-chart-accent",
    caption: "Registered today",
  },
  {
    id: "approved",
    label: "Approved",
    icon: CheckCircle2,
    iconWrap: "bg-success/10",
    iconColor: "text-success",
    caption: "Verified employers",
  },
  {
    id: "rejected",
    label: "Rejected",
    icon: ShieldX,
    iconWrap: "bg-danger/10",
    iconColor: "text-danger",
    caption: "Verification rejected",
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-IN");
}

export function VerificationsKpiStrip({ kpis }: VerificationsKpiStripProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
      {KPI_CONFIG.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.id}
            className="flex min-w-0 flex-col justify-between rounded-xl border border-border-subtle bg-surface p-2.5 shadow-sm ops-brand-border-glow transition-shadow sm:p-3"
          >
            <div className="flex items-start justify-between gap-1.5">
              <span
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8",
                  item.iconWrap,
                  item.iconColor,
                )}
              >
                <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-2 min-w-0">
              <p className="line-clamp-2 text-[10px] font-semibold text-muted">
                {item.label}
              </p>
              <p className="mt-0.5 text-base font-bold tabular-nums tracking-tight text-foreground sm:text-lg">
                {formatCount(kpis[item.id])}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-muted">
                {item.caption}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
