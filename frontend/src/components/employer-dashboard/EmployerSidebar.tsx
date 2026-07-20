"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import asliLogoMark from "@/assets/logos/Frame 130.png";
import { EmployerSidebarItem } from "@/components/employer-dashboard/EmployerSidebarItem";
import {
  EMPLOYER_DASHBOARD_HELP_CTA,
  EMPLOYER_DASHBOARD_HELP_ICON,
  EMPLOYER_DASHBOARD_HELP_SUBTITLE,
  EMPLOYER_DASHBOARD_HELP_TITLE,
  EMPLOYER_DASHBOARD_LOGO_TAGLINE,
  EMPLOYER_DASHBOARD_NAV_ITEMS,
  EMPLOYER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
  EMPLOYER_DASHBOARD_SIDEBAR_WIDTH,
} from "@/constants/employer-dashboard";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { ChevronsLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
type EmployerSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
};

const HelpIcon = EMPLOYER_DASHBOARD_HELP_ICON;

export function EmployerSidebar({
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onMobileClose,
}: EmployerSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />

      <aside
        aria-label="Employer dashboard navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-surface transition-[width,transform] duration-200 ease-out",
          collapsed
            ? "lg:w-[var(--employer-sidebar-collapsed-width)]"
            : "lg:w-[var(--employer-sidebar-width)]",
          "w-[var(--employer-sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={
          {
            "--employer-sidebar-width": EMPLOYER_DASHBOARD_SIDEBAR_WIDTH,
            "--employer-sidebar-collapsed-width":
              EMPLOYER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            "flex shrink-0 flex-col border-b border-border-subtle",
            collapsed ? "items-center px-2 py-4" : "px-4 py-4",
          )}
        >
          <Link
            href={ROUTES.EMPLOYER_DASHBOARD}
            onClick={onMobileClose}
            aria-label="AsliJobs employer dashboard"
            className={cn(
              "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              collapsed
                ? "inline-flex items-center justify-center"
                : "inline-flex flex-col items-start gap-0.5",
            )}
          >
            {collapsed ? (
              <Image
                src={asliLogoMark}
                alt=""
                width={40}
                height={40}
                className="size-9 object-contain"
                priority
                aria-hidden
              />
            ) : (
              <>
                <Image
                  src={asliLogo}
                  alt=""
                  width={213}
                  height={70}
                  className="block h-9 w-auto max-w-full object-contain object-left"
                  priority
                  aria-hidden
                />
                <span className="whitespace-nowrap text-[10px] font-medium leading-tight text-primary-soft">
                  {EMPLOYER_DASHBOARD_LOGO_TAGLINE}
                </span>
              </>
            )}
          </Link>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3",
            collapsed ? "px-2" : "px-3",
          )}
          aria-label="Primary"
        >
          <ul className="flex flex-col gap-1">
            {EMPLOYER_DASHBOARD_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <EmployerSidebarItem
                  item={item}
                  isActive={
                    item.href !== "#" &&
                    (pathname === item.href ||
                      pathname.startsWith(`${item.href}/`))
                  }
                  collapsed={collapsed}
                  onNavigate={onMobileClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "mt-auto shrink-0 border-t border-border-subtle",
            collapsed ? "p-2" : "p-3",
          )}
        >
          {!collapsed ? (
            <div className="rounded-xl bg-hero-bg p-3.5">
              <p className="text-sm font-bold text-foreground">
                {EMPLOYER_DASHBOARD_HELP_TITLE}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {EMPLOYER_DASHBOARD_HELP_SUBTITLE}
              </p>
              <button
                type="button"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary-soft transition-colors hover:border-primary-soft/40 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <HelpIcon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
                {EMPLOYER_DASHBOARD_HELP_CTA}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface p-2.5 text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={EMPLOYER_DASHBOARD_HELP_CTA}
              title={EMPLOYER_DASHBOARD_HELP_CTA}
            >
              <HelpIcon className="size-4" strokeWidth={2} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={onCollapseToggle}
            className="mt-2 hidden w-full items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform",
                collapsed && "rotate-180",
              )}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>
    </>
  );
}
