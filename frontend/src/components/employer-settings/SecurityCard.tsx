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
          return (
            <li
              key={action.id}
              className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0"
            >
              <span
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary"
                aria-hidden="true"
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {action.title}
                </p>
                <p className="mt-0.5 text-xs text-muted">{action.description}</p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={action.onAction}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle px-3 text-sm font-semibold text-foreground transition-colors",
                  "hover:bg-primary-light/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
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
