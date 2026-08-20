import { TrendingDown, TrendingUp } from "lucide-react";

import { OperationsCard } from "../../ui/OperationsCard";

import type { OperationsSnapshotMetric } from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



interface OperationsSnapshotSectionProps {

  metrics: OperationsSnapshotMetric[];

}



export function OperationsSnapshotSection({ metrics }: OperationsSnapshotSectionProps) {

  return (

    <OperationsCard title="Operations Snapshot" bodyClassName="p-0 sm:p-0">

      <div className="grid grid-cols-1 divide-y divide-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6">

        {metrics.map((metric) => {

          const TrendIcon =

            metric.trendDirection === "up" ? TrendingUp : TrendingDown;

          return (

            <article key={metric.id} className="px-3 py-3 sm:px-4 sm:py-4">

              <p className="text-xs text-muted">{metric.label}</p>

              <p className="mt-0.5 text-lg font-bold text-foreground sm:text-xl">

                {metric.value}

              </p>

              <p

                className={cn(

                  "mt-0.5 flex items-center gap-1 text-[11px]",

                  metric.trendDirection === "up" ? "text-success" : "text-danger",

                )}

              >

                <TrendIcon className="size-3 shrink-0" aria-hidden="true" />

                <span className="truncate">{metric.trendLabel}</span>

              </p>

            </article>

          );

        })}

      </div>

    </OperationsCard>

  );

}

