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
        "employer-settings-section rounded-xl border bg-surface p-4 shadow-sm sm:p-5 lg:rounded-lg lg:p-3",
        tone === "danger"
          ? "border-pin-state/30"
          : "border-border-subtle",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "employer-settings-section__title text-sm font-bold tracking-tight sm:text-base lg:text-xs",
              tone === "danger" ? "text-pin-state" : "text-foreground",
            )}
          >
            {title}
          </h2>
          {description ? (
            <p className="employer-settings-section__desc mt-0.5 text-xs text-muted sm:text-sm lg:text-[10px] lg:leading-snug">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="employer-settings-section__body mt-4 lg:mt-2.5">
        {children}
      </div>
    </section>
  );
}
