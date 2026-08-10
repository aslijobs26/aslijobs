"use client";

import asliLogo from "@/assets/AsliLogo.svg";
import asliLogoMark from "@/assets/logos/Frame 130.png";
import { JobSeekerSidebarItem } from "@/components/job-seeker-dashboard/JobSeekerSidebarItem";
import {
  JOB_SEEKER_DASHBOARD_LOGO_TAGLINE,
  JOB_SEEKER_DASHBOARD_NAV_ITEMS,
  JOB_SEEKER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
  JOB_SEEKER_DASHBOARD_SIDEBAR_WIDTH,
} from "@/constants/job-seeker-dashboard";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/utils/cn";
import { clearJobSeekerAuthSession } from "@/utils/job-seeker-auth-storage";
import { ChevronsLeft, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type JobSeekerSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onCollapseToggle: () => void;
  onMobileClose: () => void;
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }
  return pathname.startsWith(`${href}/`);
}

export function JobSeekerSidebar({
  collapsed,
  mobileOpen,
  onCollapseToggle,
  onMobileClose,
}: JobSeekerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearJobSeekerAuthSession();
    onMobileClose();
    router.replace(ROUTES.HOME);
  };

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
        aria-label="Job seeker dashboard navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-surface transition-[width,transform] duration-200 ease-out",
          collapsed
            ? "lg:w-[var(--seeker-sidebar-collapsed-width)]"
            : "lg:w-[var(--seeker-sidebar-width)]",
          "w-[var(--seeker-sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={
          {
            "--seeker-sidebar-width": JOB_SEEKER_DASHBOARD_SIDEBAR_WIDTH,
            "--seeker-sidebar-collapsed-width":
              JOB_SEEKER_DASHBOARD_SIDEBAR_COLLAPSED_WIDTH,
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
            href={ROUTES.HOME}
            onClick={onMobileClose}
            aria-label="AsliJobs home"
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
                  {JOB_SEEKER_DASHBOARD_LOGO_TAGLINE}
                </span>
              </>
            )}
          </Link>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-hidden",
            collapsed ? "px-2" : "px-3",
          )}
          aria-label="Primary"
        >
          <ul className="flex flex-col gap-1">
            {JOB_SEEKER_DASHBOARD_NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <JobSeekerSidebarItem
                  item={item}
                  isActive={isNavItemActive(pathname, item.href)}
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
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            )}
          >
            <LogOut className="size-[1.125rem] shrink-0" aria-hidden="true" />
            {!collapsed ? <span>Logout</span> : null}
          </button>

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
