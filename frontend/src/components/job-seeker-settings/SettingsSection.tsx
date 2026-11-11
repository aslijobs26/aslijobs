import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Product tour anchor (`data-tour`). */
  dataTour?: string;
};

export function SettingsSection({
  title,
  description,
  action,
  children,
  dataTour,
}: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-sm sm:p-5">
      <div
        data-tour={dataTour}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-muted sm:text-sm">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
