"use client";

import type { EmployerDashboardNavItem } from "@/types/employer-dashboard";
import { cn } from "@/utils/cn";
import Link from "next/link";

type EmployerSidebarItemProps = {
  item: EmployerDashboardNavItem;
  isActive: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function EmployerSidebarItem({
  item,
  isActive,
  collapsed = false,
  onNavigate,
}: EmployerSidebarItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
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
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge !== undefined ? (
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                isActive
                  ? "bg-surface text-primary-soft"
                  : "bg-primary-soft text-surface",
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </>
      ) : item.badge !== undefined ? (
        <span className="absolute right-1 top-1 size-2 rounded-full bg-primary-soft" />
      ) : null}
    </Link>
  );
}
