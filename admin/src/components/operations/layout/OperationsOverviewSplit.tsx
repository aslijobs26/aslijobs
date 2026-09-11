import type { ReactNode } from "react";
import { cn } from "../../../utils/cn";

type OperationsOverviewSplitVariant = "overview" | "command" | "attention";

interface OperationsOverviewSplitProps {
  /** Primary column (tables, filters, main workspace). */
  children: ReactNode;
  /** Right contextual rail (Quick Actions, Ask ASLI, insights). */
  rail: ReactNode;
  className?: string;
  railClassName?: string;
  /**
   * `overview` — narrow 16.5rem rail (Jobs / Employers / Candidates / …).
   * `command` — ~4/12 rail (Home).
   * `attention` — ~3/12 rail (What Needs Attention).
   */
  variant?: OperationsOverviewSplitVariant;
}

const VARIANT_CLASS: Record<
  OperationsOverviewSplitVariant,
  { root: string; main: string; rail: string }
> = {
  overview: {
    root: "xl:grid-cols-[minmax(0,1fr)_16.5rem] xl:gap-3.5",
    main: "min-w-0",
    rail: "",
  },
  command: {
    root: "xl:grid-cols-12 xl:gap-4",
    main: "min-w-0 xl:col-span-8",
    rail: "min-w-0 xl:col-span-4",
  },
  attention: {
    root: "xl:grid-cols-12 xl:gap-3",
    main: "min-w-0 xl:col-span-9",
    rail: "min-w-0 xl:col-span-3",
  },
};

/**
 * Shared XL two-column Operations layout: main content + contextual rail.
 *
 * Right rail is content-sized (`items-start` + `h-fit`) so it does not stretch
 * to the left column height.
 */
export function OperationsOverviewSplit({
  children,
  rail,
  className,
  railClassName,
  variant = "overview",
}: OperationsOverviewSplitProps) {
  const variantClass = VARIANT_CLASS[variant];

  return (
    <div
      className={cn(
        "operations-overview-split grid grid-cols-1 gap-3 max-sm:gap-2 xl:items-start",
        variantClass.root,
        className,
      )}
    >
      <div className={variantClass.main}>{children}</div>
      <aside
        className={cn(
          "operations-overview-rail flex h-fit min-w-0 flex-col gap-3 max-sm:gap-2",
          "xl:self-start",
          variantClass.rail,
          railClassName,
        )}
      >
        {rail}
      </aside>
    </div>
  );
}
