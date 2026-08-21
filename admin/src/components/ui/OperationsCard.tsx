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
        "operations-density-card flex h-full flex-col rounded-xl border border-border-subtle bg-surface shadow-sm",
        isFlushBody && "operations-density-card-flush",
        className,
      )}
    >
      {(title || action || badge) && (
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-1.5 border-b border-border-subtle px-3 py-2 sm:px-3.5 sm:py-2.5">
          <div className="min-w-0">
            {title && (
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-[13px] font-semibold leading-tight text-foreground">
                  {title}
                </h2>
                {badge}
              </div>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11px] leading-tight text-muted">{subtitle}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={cn("min-h-0 flex-1 p-2.5 sm:p-3", bodyClassName)}>{children}</div>
    </section>
  );
}
