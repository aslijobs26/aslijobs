"use client";

import { SettingsSection } from "@/components/employer-settings/SettingsSection";
import { cn } from "@/utils/cn";
import { Lock, LogOut, Monitor, Shield, type LucideIcon } from "lucide-react";

type SecurityActionIcon = "password" | "twoFactor" | "sessions" | "logout";

export type SecurityAction = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  icon: SecurityActionIcon;
  disabled?: boolean;
  tone?: "default" | "danger";
};

type SecurityCardProps = {
  title?: string;
  description?: string;
  actions: SecurityAction[];
};

const ICON_MAP: Record<SecurityActionIcon, LucideIcon> = {
  password: Lock,
  twoFactor: Shield,
  sessions: Monitor,
  logout: LogOut,
};

export function SecurityCard({
  title = "Security",
  description = "Keep your account secure.",
  actions,
}: SecurityCardProps) {
  return (
    <SettingsSection title={title} description={description}>
      <ul className="divide-y divide-border-subtle" role="list">
        {actions.map((action) => {
          const Icon = ICON_MAP[action.icon];
          const disabled = Boolean(action.disabled) || !action.onAction;
          const isDanger = action.tone === "danger";
          return (
            <li
              key={action.id}
              className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                  isDanger
                    ? "bg-red-50 text-red-600"
                    : "bg-primary-light text-primary",
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground sm:text-sm">
                  {action.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
                  {action.description}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={action.onAction}
                className={cn(
                  "inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:min-h-9 sm:px-3 sm:text-sm",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
                  isDanger
                    ? "border-red-500 text-red-600 hover:bg-red-50 focus-visible:ring-red-200"
                    : "border-border-subtle text-foreground hover:bg-primary-light/40 focus-visible:ring-primary/30",
                )}
              >
                {action.actionLabel}
              </button>
            </li>
          );
        })}
      </ul>
    </SettingsSection>
  );
}
