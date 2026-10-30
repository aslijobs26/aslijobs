"use client";

import { SkeletonBone } from "@/components/shared/skeletons/SkeletonBone";
import asliLogo from "@/assets/AsliLogo.svg";
import asliLogoMark from "@/assets/logos/Frame 130.png";
import { EmployerSidebarItem } from "@/components/employer-dashboard/EmployerSidebarItem";
import { EMPLOYER_NAV_ITEM_MESSAGE_KEYS } from "@/components/employer-dashboard/employer-message-keys";
import {
  EMPLOYER_DASHBOARD_HELP_ICON,
  EMPLOYER_DASHBOARD_LOGO_TAGLINE,
  EMPLOYER_DASHBOARD_NAV_ITEMS,
} from "@/constants/employer-dashboard";
import { NAV_ITEM_PERMISSION_MODULE } from "@/constants/employer-rbac";
import { ROUTES } from "@/constants/routes";
import { useEmployerProfile } from "@/hooks/useEmployerProfile";
import { useTranslate } from "@/i18n/translate";
import { useCan } from "@/providers/employer-permission-provider";
import {
  employerMessageQueryKeys,
  fetchNotificationConversations,
} from "@/services/notifications.service";
import type { EmployerDashboardNavItem } from "@/types/employer-dashboard";
import { cn } from "@/utils/cn";
import { useQuery } from "@tanstack/react-query";
import { ChevronsLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

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
  const t = useTranslate();
  const isHelpCenterActive =
    pathname === ROUTES.EMPLOYER_HELP_CENTER ||
    pathname.startsWith(`${ROUTES.EMPLOYER_HELP_CENTER}/`);

  // Messages badge = unread application/job conversation threads only.
  // Do not use global /notifications/me/unread-count — account notices
  // (e.g. employer verification) inflate that count but never appear in Messages.
  const messagesUnreadQuery = useQuery({
    queryKey: [
      ...employerMessageQueryKeys.stats,
      "sidebar-unread-conversations",
    ],
    queryFn: async () => {
      const result = await fetchNotificationConversations({
        page: 1,
        limit: 1,
        readStatus: "unread",
      });
      return result.pagination.total;
    },
    staleTime: 60_000,
    refetchInterval: 180_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  const profileQuery = useEmployerProfile();
  const { can, isLoading: permissionsLoading } = useCan();

  const showCompanyProfileOnboardingDot =
    profileQuery.data?.companyProfileVisited === false;

  const navItems = useMemo<EmployerDashboardNavItem[]>(() => {
    const unread = messagesUnreadQuery.data ?? 0;
    const messagesBadgeLoading = messagesUnreadQuery.isLoading;
    return EMPLOYER_DASHBOARD_NAV_ITEMS.map((baseItem) => {
      const labelKey = EMPLOYER_NAV_ITEM_MESSAGE_KEYS[baseItem.id];
      const item = labelKey ? { ...baseItem, label: t(labelKey) } : baseItem;
      if (item.id === "messages") {
        return {
          ...item,
          badge: messagesBadgeLoading
            ? undefined
            : unread > 0
              ? unread
              : undefined,
          badgeLoading: messagesBadgeLoading,
        };
      }
      if (item.id === "company-profile") {
        return {
          ...item,
          label:
            profileQuery.data?.accountType === "individual"
              ? t("employer.nav.individualProfile")
              : item.label,
          showOnboardingDot: showCompanyProfileOnboardingDot || undefined,
        };
      }
      return item;
    }).filter((item) => {
      const moduleKey = NAV_ITEM_PERMISSION_MODULE[item.id];
      if (!moduleKey) {
        return true;
      }
      // Never flash unauthorized modules while the RBAC session loads.
      if (permissionsLoading) {
        return false;
      }
      return can(moduleKey, "read");
    });
  }, [
    messagesUnreadQuery.data,
    messagesUnreadQuery.isLoading,
    profileQuery.data?.accountType,
    showCompanyProfileOnboardingDot,
    can,
    permissionsLoading,
    t,
  ]);

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
        aria-label={t("employer.shell.sidebarAria")}
        className={cn(
          "employer-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-surface transition-[width,transform] duration-200 ease-out",
          collapsed
            ? "lg:w-[var(--employer-sidebar-collapsed-width)]"
            : "lg:w-[var(--employer-sidebar-width)]",
          "w-[var(--employer-sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "employer-sidebar-brand flex shrink-0 flex-col border-b border-border-subtle",
            collapsed ? "items-center px-2 py-4 lg:py-3" : "px-4 py-4 lg:px-3 lg:py-3",
          )}
        >
          <Link
            href={ROUTES.HOME}
            onClick={onMobileClose}
            aria-label={t("navbar.homeAria")}
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
                className="employer-sidebar-logo-mark size-9 object-contain lg:size-8"
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
                  className="employer-sidebar-logo block h-9 w-auto max-w-full object-contain object-left lg:h-7"
                  priority
                  aria-hidden
                />
                <span className="employer-sidebar-tagline whitespace-nowrap text-[10px] font-medium leading-tight text-primary-soft lg:text-[9px]">
                  {EMPLOYER_DASHBOARD_LOGO_TAGLINE}
                </span>
              </>
            )}
          </Link>
        </div>

        <nav
          className={cn(
            "employer-sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-3 lg:py-2",
            collapsed ? "px-2" : "px-3 lg:px-2.5",
          )}
          aria-label={t("employer.shell.primaryNavAria")}
        >
          <ul className="employer-sidebar-nav-list flex flex-col gap-1 lg:gap-0.5">
            {permissionsLoading
              ? EMPLOYER_DASHBOARD_NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <div
                      className={cn(
                        "employer-sidebar-item flex items-center rounded-lg",
                        collapsed
                          ? "justify-center px-2 py-2.5 lg:py-2"
                          : "gap-3 px-3 py-2.5 lg:gap-2.5 lg:px-2.5 lg:py-2",
                      )}
                      aria-hidden="true"
                    >
                      <SkeletonBone className="size-[1.125rem] shrink-0 rounded lg:size-4" />
                      {!collapsed ? (
                        <>
                          <SkeletonBone className="h-4 flex-1 max-w-[8rem] rounded lg:h-3.5" />
                          <SkeletonBone className="size-4 shrink-0 rounded-full lg:size-3.5" />
                        </>
                      ) : null}
                    </div>
                  </li>
                ))
              : navItems.map((item) => (
                  <li key={item.id}>
                    <EmployerSidebarItem
                      item={item}
                      isActive={
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)
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
            "employer-sidebar-footer mt-auto shrink-0 border-t border-border-subtle",
            collapsed ? "p-2" : "p-3 lg:p-2.5",
          )}
        >
          {!collapsed ? (
            <div className="employer-sidebar-help rounded-xl bg-hero-bg p-3.5 lg:rounded-lg lg:p-2.5">
              <p className="employer-sidebar-help__title text-sm font-bold text-foreground lg:text-xs">
                {t("employer.shell.helpTitle")}
              </p>
              <p className="employer-sidebar-help__text mt-1 text-xs leading-relaxed text-muted lg:mt-0.5 lg:text-[0.625rem] lg:leading-snug">
                {t("employer.shell.helpSubtitle")}
              </p>
              <Link
                href={ROUTES.EMPLOYER_HELP_CENTER}
                onClick={onMobileClose}
                aria-current={isHelpCenterActive ? "page" : undefined}
                className="employer-sidebar-help__cta mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-primary-soft transition-colors hover:border-primary-soft/40 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mt-2 lg:gap-1.5 lg:px-2 lg:py-1.5 lg:text-xs"
              >
                <HelpIcon
                  className="size-4 shrink-0 lg:size-3.5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("employer.shell.helpCta")}
              </Link>
            </div>
          ) : (
            <Link
              href={ROUTES.EMPLOYER_HELP_CENTER}
              onClick={onMobileClose}
              aria-current={isHelpCenterActive ? "page" : undefined}
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-surface p-2.5 text-primary-soft transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:p-2"
              aria-label={t("employer.shell.helpCta")}
              title={t("employer.shell.helpCta")}
            >
              <HelpIcon className="size-4 lg:size-3.5" strokeWidth={2} aria-hidden="true" />
            </Link>
          )}

          <button
            type="button"
            onClick={onCollapseToggle}
            className="mt-2 hidden w-full items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:mt-1.5 lg:inline-flex lg:p-1.5"
            aria-label={
              collapsed
                ? t("employer.shell.expandSidebar")
                : t("employer.shell.collapseSidebar")
            }
          >
            <ChevronsLeft
              className={cn(
                "size-4 transition-transform lg:size-3.5",
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
