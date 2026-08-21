import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { OperationsCard } from "../../ui/OperationsCard";
import type {
  OperationsSnapshotMetric,
  SnapshotAccentTone,
} from "../../../types/operations-dashboard";
import { cn } from "../../../utils/cn";

interface OperationsSnapshotSectionProps {
  metrics: OperationsSnapshotMetric[];
}

const ACCENT_CONFIG: Record<
  SnapshotAccentTone,
  { icon: LucideIcon; surface: string; iconWrap: string; value: string }
> = {
  primary: {
    icon: Building2,
    surface: "bg-primary-light/70",
    iconWrap: "bg-primary-light text-primary",
    value: "text-primary",
  },
  teal: {
    icon: Users,
    surface: "bg-primary-soft/10",
    iconWrap: "bg-primary-soft/15 text-primary-soft",
    value: "text-primary-soft",
  },
  warning: {
    icon: Briefcase,
    surface: "bg-warning/10",
    iconWrap: "bg-warning/15 text-warning",
    value: "text-warning",
  },
  violet: {
    icon: FileText,
    surface: "bg-chart-accent-alt/10",
    iconWrap: "bg-chart-accent-alt/15 text-chart-accent-alt",
    value: "text-chart-accent-alt",
  },
  whatsapp: {
    icon: CalendarDays,
    surface: "bg-whatsapp/10",
    iconWrap: "bg-whatsapp/15 text-whatsapp",
    value: "text-whatsapp",
  },
  success: {
    icon: CheckCircle2,
    surface: "bg-success/10",
    iconWrap: "bg-success/15 text-success",
    value: "text-success",
  },
};

export function OperationsSnapshotSection({ metrics }: OperationsSnapshotSectionProps) {
  return (
    <OperationsCard title="Operations Snapshot" bodyClassName="p-0 sm:p-0">
      <div className="grid grid-cols-1 gap-1.5 p-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => {
          const accent = ACCENT_CONFIG[metric.accentTone];
          const Icon = accent.icon;
          const TrendIcon =
            metric.trendDirection === "up" ? TrendingUp : TrendingDown;

          return (
            <article
              key={metric.id}
              className={cn(
                "rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5",
                accent.surface,
              )}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted">{metric.label}</p>
                  <p
                    className={cn(
                      "mt-0.5 text-base font-bold leading-none sm:text-lg",
                      accent.value,
                    )}
                  >
                    {metric.value}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 flex items-center gap-0.5 text-[10px]",
                      metric.trendDirection === "up" ? "text-success" : "text-danger",
                    )}
                  >
                    <TrendIcon className="size-2.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{metric.trendLabel}</span>
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex size-7 shrink-0 items-center justify-center rounded-md",
                    accent.iconWrap,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </OperationsCard>
  );
}
