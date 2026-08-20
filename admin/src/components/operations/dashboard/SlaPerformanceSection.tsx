import {

  Cell,

  Pie,

  PieChart,

  ResponsiveContainer,

} from "recharts";

import { OperationsCard } from "../../ui/OperationsCard";

import { useOperationsThemeColors } from "../../../hooks/use-operations-theme-colors";

import type { SlaCategoryMetric } from "../../../types/operations-dashboard";

import { cn } from "../../../utils/cn";



interface SlaPerformanceSectionProps {

  overall: number;

  target: number;

  categories: SlaCategoryMetric[];

}



export function SlaPerformanceSection({

  overall,

  target,

  categories,

}: SlaPerformanceSectionProps) {

  const colors = useOperationsThemeColors();

  const chartData = [

    { name: "Met", value: overall, fill: colors.primary },

    { name: "Remaining", value: 100 - overall, fill: colors.borderSubtle },

  ];



  return (

    <OperationsCard

      title="SLA Performance"

      subtitle={`Target: ${target}%`}

      className="min-w-0"

    >

      <div className="flex flex-col gap-4">

        <div className="relative mx-auto size-32 shrink-0">

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie

                data={chartData}

                dataKey="value"

                innerRadius="72%"

                outerRadius="100%"

                startAngle={90}

                endAngle={-270}

                stroke="none"

              >

                {chartData.map((entry) => (

                  <Cell key={entry.name} fill={entry.fill} />

                ))}

              </Pie>

            </PieChart>

          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

            <span className="text-2xl font-bold text-foreground">{overall}%</span>

            <span className="text-[11px] text-muted">Overall SLA</span>

          </div>

        </div>



        <ul className="w-full space-y-2.5">

          {categories.map((category) => (

            <li key={category.id}>

              <div className="mb-1 flex items-center justify-between text-xs">

                <span className="truncate text-muted">{category.label}</span>

                <span className="ml-2 shrink-0 font-medium text-foreground">

                  {category.percentage}%

                </span>

              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">

                <div

                  className={cn(

                    "h-full rounded-full bg-primary transition-all",

                    category.percentage < target && "bg-warning",

                  )}

                  style={{ width: `${category.percentage}%` }}

                />

              </div>

            </li>

          ))}

        </ul>

      </div>

    </OperationsCard>

  );

}

