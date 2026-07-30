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
  const hasOnboardingDot = Boolean(item.showOnboardingDot);
  const ariaLabel = hasOnboardingDot
    ? `${item.label}, your profile needs attention`
    : undefined;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      aria-label={ariaLabel}
      title={collapsed ? (ariaLabel ?? item.label) : undefined}
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
          {hasOnboardingDot ? (
            <span
              className="size-2 shrink-0 animate-pulse rounded-full bg-primary ring-4 ring-primary/20 transition-opacity duration-300"
              aria-hidden="true"
            />
          ) : null}
          {item.badge !== undefined ? (
            <span
              className={cn(
                "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                item.id === "messages"
                  ? "bg-pin-state text-surface"
                  : isActive
                    ? "bg-surface text-primary-soft"
                    : "bg-primary-soft text-surface",
              )}
            >
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </>
      ) : hasOnboardingDot || item.badge !== undefined ? (
        <span
          className={cn(
            "absolute right-1 top-1 size-2 rounded-full transition-opacity duration-300",
            hasOnboardingDot
              ? "animate-pulse bg-primary ring-4 ring-primary/20"
              : item.id === "messages"
                ? "bg-pin-state"
                : "bg-primary-soft",
          )}
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}
