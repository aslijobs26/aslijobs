import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../../utils/cn";

interface OperationsPostJobSectionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function OperationsPostJobSectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: OperationsPostJobSectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border-subtle bg-surface shadow-sm",
        className,
      )}
    >
      <header className="flex items-start gap-3 border-b border-border-subtle px-3 py-3 sm:px-4 sm:py-3.5">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="space-y-4 p-3 sm:p-4">{children}</div>
    </section>
  );
}
