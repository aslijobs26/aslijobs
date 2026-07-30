"use client";

import type { EmployerDashboardSourceSlice } from "@/utils/employer-dashboard-home";
import { cn } from "@/utils/cn";

type DashboardSourcesPerformanceProps = {
  slices: EmployerDashboardSourceSlice[];
  total: number;
  isLoading?: boolean;
};

const SLICE_COLORS = [
  "var(--color-primary)",
  "var(--color-primary-soft)",
  "var(--color-employer-button)",
  "var(--color-resource-interview-icon)",
  "var(--color-muted)",
  "var(--color-border)",
] as const;

function buildDonutPath(
  startRatio: number,
  endRatio: number,
  radius: number,
  thickness: number,
): string {
  const clampedEnd = Math.min(endRatio, startRatio + 0.999999);
  const startAngle = startRatio * Math.PI * 2 - Math.PI / 2;
  const endAngle = clampedEnd * Math.PI * 2 - Math.PI / 2;
  const outer = radius;
  const inner = radius - thickness;
  const largeArc = clampedEnd - startRatio > 0.5 ? 1 : 0;

  const x1 = Math.cos(startAngle) * outer;
  const y1 = Math.sin(startAngle) * outer;
  const x2 = Math.cos(endAngle) * outer;
  const y2 = Math.sin(endAngle) * outer;
  const x3 = Math.cos(endAngle) * inner;
  const y3 = Math.sin(endAngle) * inner;
  const x4 = Math.cos(startAngle) * inner;
  const y4 = Math.sin(startAngle) * inner;

  return [
    `M ${x1} ${y1}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

export function DashboardSourcesPerformance({
  slices,
  total,
  isLoading = false,
}: DashboardSourcesPerformanceProps) {
  const paths = slices.reduce<
    Array<
      EmployerDashboardSourceSlice & {
        color: string;
        d: string;
      }
    >
  >((accumulator, slice, index) => {
    const start = accumulator.reduce(
      (sum, item) => sum + item.value / Math.max(total, 1),
      0,
    );
    const end = start + slice.value / Math.max(total, 1);
    accumulator.push({
      ...slice,
      color: SLICE_COLORS[index % SLICE_COLORS.length]!,
      d: buildDonutPath(start, end, 48, 14),
    });
    return accumulator;
  }, []);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <h2 className="text-base font-bold text-foreground">
          Sources Performance
        </h2>
        <span className="text-xs font-semibold text-muted">Live</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 p-4 sm:p-5">
        {isLoading ? (
          <div className="size-36 animate-pulse rounded-full bg-hero-bg" />
        ) : null}

        {!isLoading && slices.length === 0 ? (
          <p className="px-2 text-center text-sm text-muted">
            Source data will appear once applications start coming in.
          </p>
        ) : null}

        {!isLoading && slices.length > 0 ? (
          <>
            <div className="relative size-36">
              <svg
                viewBox="-54 -54 108 108"
                className="size-full"
                role="img"
                aria-label={`Total applications ${total}`}
              >
                {paths.map((path) => (
                  <path
                    key={path.id}
                    d={path.d}
                    fill={path.color}
                    className="transition-opacity duration-300 hover:opacity-90"
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {total.toLocaleString("en-IN")}
                </p>
                <p className="text-[0.6875rem] font-medium text-muted">Total</p>
              </div>
            </div>

            <ul className="w-full space-y-2">
              {paths.map((slice) => (
                <li
                  key={slice.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium">{slice.label}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-bold tabular-nums text-foreground",
                    )}
                  >
                    {slice.percent}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-center text-[0.6875rem] leading-relaxed text-muted">
              Tracked through the AsliJobs application channel.
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
