import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface OperationsCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  badge?: ReactNode;
  bodyClassName?: string;
}

export function OperationsCard({
  children,
  className,
  title,
  subtitle,
  action,
  badge,
  bodyClassName,
}: OperationsCardProps) {
  const isFlushBody = Boolean(bodyClassName?.includes("p-0"));

  return (
    <section
      className={cn(
        // Content-sized by default. Pass `h-full` (or use `.operations-analytics-grid`)
        // only when equal-height card rows are intentional.
        "operations-density-card flex h-auto flex-col rounded-xl border border-border-subtle bg-surface shadow-sm",
        isFlushBody && "operations-density-card-flush",
        className,
      )}
    >
      {(title || action || badge) && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-1 border-b border-border-subtle px-2.5 py-1.5 max-sm:gap-1 sm:gap-1.5 sm:px-3.5 sm:py-2.5">
          <div className="min-w-0">
            {title && (
              <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                <h2 className="text-[12px] font-semibold leading-tight text-foreground sm:text-[13px]">
                  {title}
                </h2>
                {badge}
              </div>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[10px] leading-tight text-muted sm:text-[11px]">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </header>
      )}
      <div
        className={cn(
          "min-h-0 flex-1",
          isFlushBody ? "p-0" : "p-2 max-sm:p-2 sm:p-3",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
