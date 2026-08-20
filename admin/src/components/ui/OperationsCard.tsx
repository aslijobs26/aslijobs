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

  return (

    <section

      className={cn(

        "flex h-full flex-col rounded-xl border border-border-subtle bg-surface shadow-sm",

        className,

      )}

    >

      {(title || action || badge) && (

        <header className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-border-subtle px-3 py-2.5 sm:px-4">

          <div className="min-w-0">

            {title && (

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-sm font-semibold text-foreground">{title}</h2>

                {badge}

              </div>

            )}

            {subtitle && (

              <p className="mt-0.5 text-xs text-muted">{subtitle}</p>

            )}

          </div>

          {action}

        </header>

      )}

      <div className={cn("min-h-0 flex-1 p-3 sm:p-4", bodyClassName)}>{children}</div>

    </section>

  );

}

