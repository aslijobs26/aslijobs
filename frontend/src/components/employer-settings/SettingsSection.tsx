"use client";

import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "danger";
};

export function SettingsSection({
  title,
  description,
  action,
  children,
  className,
  tone = "default",
}: SettingsSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-surface p-4 shadow-sm sm:p-5",
        tone === "danger"
          ? "border-pin-state/30"
          : "border-border-subtle",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className={cn(
              "text-base font-bold tracking-tight",
              tone === "danger" ? "text-pin-state" : "text-foreground",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
