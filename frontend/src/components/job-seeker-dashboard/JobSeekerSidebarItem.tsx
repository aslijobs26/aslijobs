"use client";

import type { JobSeekerDashboardNavItem } from "@/types/job-seeker-dashboard";
import { cn } from "@/utils/cn";
import Link from "next/link";

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
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
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
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      ) : null}
    </Link>
  );
}
