import {

  AlertTriangle,

  CheckCircle2,

  Clock3,

  FileCheck2,

  Headphones,

  TrendingDown,

  TrendingUp,

  type LucideIcon,

} from "lucide-react";

import type { OperationsKpiMetric } from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



const TONE_CONFIG: Record<

  OperationsKpiMetric["iconTone"],

  { icon: LucideIcon; iconBg: string; iconColor: string }

> = {

  blue: { icon: Clock3, iconBg: "bg-primary-light", iconColor: "text-primary" },

  red: { icon: AlertTriangle, iconBg: "bg-danger/10", iconColor: "text-danger" },

  orange: { icon: Clock3, iconBg: "bg-warning/10", iconColor: "text-warning" },

  purple: { icon: AlertTriangle, iconBg: "bg-primary-light", iconColor: "text-primary-hover" },

  teal: { icon: Headphones, iconBg: "bg-primary-light", iconColor: "text-primary-soft" },

  violet: { icon: FileCheck2, iconBg: "bg-primary-light", iconColor: "text-primary" },

};



interface OperationsKpiCardProps {

  metric: OperationsKpiMetric;

}



export function OperationsKpiCard({ metric }: OperationsKpiCardProps) {

  const config = TONE_CONFIG[metric.iconTone];

  const Icon = config.icon;

  const TrendIcon =

    metric.trendDirection === "up"

      ? TrendingUp

      : metric.trendDirection === "down"

        ? TrendingDown

        : CheckCircle2;



  return (

    <article className="rounded-xl border border-border-subtle bg-surface px-3 py-3 shadow-sm sm:px-4">

      <div className="flex items-start justify-between gap-2">

        <div className="min-w-0">

          <p className="text-xs text-muted">{metric.label}</p>

          <p className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">

            {metric.value}

          </p>

          <p

            className={cn(

              "mt-0.5 flex items-center gap-1 text-[11px]",

              metric.trendDirection === "up" && "text-success",

              metric.trendDirection === "down" && "text-danger",

              metric.trendDirection === "neutral" && "text-warning",

            )}

          >

            <TrendIcon className="size-3 shrink-0" aria-hidden="true" />

            <span className="truncate">{metric.trendLabel}</span>

          </p>

        </div>

        <span

          className={cn(

            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg sm:size-10",

            config.iconBg,

          )}

        >

          <Icon className={cn("size-4 sm:size-5", config.iconColor)} aria-hidden="true" />

        </span>

      </div>

    </article>

  );

}



interface OperationsKpiStripProps {

  metrics: OperationsKpiMetric[];

}



export function OperationsKpiStrip({ metrics }: OperationsKpiStripProps) {

  return (

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">

      {metrics.map((metric) => (

        <OperationsKpiCard key={metric.id} metric={metric} />

      ))}

    </div>

  );

}

