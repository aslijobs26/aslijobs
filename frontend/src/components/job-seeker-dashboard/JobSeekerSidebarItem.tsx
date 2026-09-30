"use client";

import { useTranslate, type MessageKey } from "@/i18n/translate";
import type { JobSeekerDashboardNavItem } from "@/types/job-seeker-dashboard";
import { cn } from "@/utils/cn";
import Link from "next/link";

const NAV_ITEM_LABEL_KEYS: Record<string, MessageKey> = {
  profile: "seeker.nav.profile",
  "applied-jobs": "seeker.nav.myApplications",
  "my-resume": "seeker.nav.myResume",
  notifications: "seeker.nav.notifications",
  "saved-jobs": "seeker.nav.savedJobs",
  "help-support": "seeker.nav.helpSupport",
  settings: "seeker.nav.accountSettings",
};

type JobSeekerSidebarItemProps = {
  item: JobSeekerDashboardNavItem;
  isActive: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function JobSeekerSidebarItem({
  item,
  isActive,
  collapsed = false,
  onNavigate,
}: JobSeekerSidebarItemProps) {
  const t = useTranslate();
  const Icon = item.icon;
  const labelKey = NAV_ITEM_LABEL_KEYS[item.id];
  const label = labelKey ? t(labelKey) : item.label;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "group flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        isActive
          ? "bg-primary-soft text-surface"
          : "text-nav hover:bg-primary-light hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-[1.125rem] shrink-0",
          isActive ? "text-surface" : "text-muted group-hover:text-foreground",
        )}
        strokeWidth={2}
        aria-hidden="true"
      />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate">{label}</span>
      ) : null}
    </Link>
  );
}
