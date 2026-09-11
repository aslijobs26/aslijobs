import { NavLink, useLocation } from "react-router-dom";
import { ChevronsLeft, X } from "lucide-react";
import { useMemo, type CSSProperties } from "react";
import indiaStatesMap from "../../../assets/india-states-map.json";
import {
  OPERATIONS_BRAND,
  OPERATIONS_NAV_ITEM_PERMISSION_MODULE,
  OPERATIONS_NAV_SECTIONS,
} from "../../../constants/operations-navigation";
import {
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH_COMPACT,
  OPERATIONS_SIDEBAR_WIDTH,
  OPERATIONS_SIDEBAR_WIDTH_COMPACT,
  type OperationsLayoutDensity,
} from "../../../constants/operations-layout";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import { useOperationsRegistrationBadges } from "../../../hooks/use-operations-registration-awareness";
import { useOperationsWorkAnalytics } from "../../../hooks/use-operations-work";
import type { OperationsNavBadgeCounts } from "../../../types/operations-registration-awareness";
import { cn } from "../../../utils/cn";

function resolveNavBadgeCount(
  badgeKey: keyof OperationsNavBadgeCounts | undefined,
  badges: OperationsNavBadgeCounts | undefined,
  staticBadge: number | undefined,
): number | undefined {
  if (badgeKey && badges) {
    const value = badges[badgeKey];
    if (value == null || value <= 0) {
      return undefined;
    }
    return value;
  }
  if (staticBadge != null && staticBadge > 0) {
    return staticBadge;
  }
  return undefined;
}

interface OperationsSidebarProps {
  collapsed: boolean;
  onCollapseToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  density?: OperationsLayoutDensity;
}

function getHrefPath(href: string) {
  return href.split("?")[0] ?? href;
}

function isNavItemActive(
  itemId: string,
  href: string,
  pathname: string,
  _search: string,
) {
  const path = getHrefPath(href);

  if (itemId === "home") {
    return pathname === OPERATIONS_ROUTES.HOME;
  }

  if (itemId === "operations-dashboard") {
    return (
      pathname === OPERATIONS_ROUTES.DASHBOARD ||
      pathname === OPERATIONS_ROUTES.WORK_QUEUE ||
      pathname.startsWith(`${OPERATIONS_ROUTES.WORK_QUEUE}/`)
    );
  }

  if (itemId === "jobs") {
    return (
      pathname === OPERATIONS_ROUTES.JOBS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.JOBS}/`)
    );
  }

  if (itemId === "organization") {
    return (
      pathname === OPERATIONS_ROUTES.TEAM_MANAGEMENT ||
      pathname.startsWith(`${OPERATIONS_ROUTES.TEAM_MANAGEMENT}/`) ||
      pathname === OPERATIONS_ROUTES.DEPARTMENTS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.DEPARTMENTS}/`) ||
      pathname === OPERATIONS_ROUTES.ROLES ||
      pathname.startsWith(`${OPERATIONS_ROUTES.ROLES}/`)
    );
  }

  if (path === OPERATIONS_ROUTES.HOME || path === OPERATIONS_ROUTES.DASHBOARD) {
    return pathname === path;
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function OperationsSidebar({
  collapsed,
  onCollapseToggle,
  mobileOpen,
  onMobileClose,
  density = "compact",
}: OperationsSidebarProps) {
  const location = useLocation();
  const isCompact = density === "compact";
  const sidebarWidth = isCompact
    ? OPERATIONS_SIDEBAR_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_WIDTH;
  const sidebarCollapsedWidth = isCompact
    ? OPERATIONS_SIDEBAR_COLLAPSED_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_COLLAPSED_WIDTH;
  const { can, isLoading: permissionsLoading } = useOperationsPermissions();
  const badgesQuery = useOperationsRegistrationBadges();
  const badges = badgesQuery.data;
  const canReadMyWork = !permissionsLoading && can("my_work", "read");
  const myWorkAnalyticsQuery = useOperationsWorkAnalytics({
    enabled: canReadMyWork,
  });
  const myWorkBadgeCount =
    myWorkAnalyticsQuery.data?.myQueueBadge &&
    myWorkAnalyticsQuery.data.myQueueBadge > 0
      ? myWorkAnalyticsQuery.data.myQueueBadge
      : undefined;

  const visibleNavSections = useMemo(() => {
    return OPERATIONS_NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const moduleKey = OPERATIONS_NAV_ITEM_PERMISSION_MODULE[item.id];
        if (!moduleKey) {
          return true;
        }
        if (permissionsLoading) {
          return false;
        }
        return can(moduleKey, "read");
      }),
    })).filter((section) => section.items.length > 0);
  }, [can, permissionsLoading]);

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
        aria-label="Operations navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-surface transition-[width,transform] duration-200 ease-out",
          "w-[min(18rem,calc(100vw-2.5rem))]",
          collapsed
            ? "lg:w-[var(--operations-sidebar-collapsed-width)]"
            : "lg:w-[var(--operations-sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={
          {
            "--operations-sidebar-width": sidebarWidth,
            "--operations-sidebar-collapsed-width": sidebarCollapsedWidth,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-border-subtle",
            collapsed
              ? isCompact
                ? "justify-center px-1.5 py-3"
                : "justify-center px-2 py-3.5"
              : isCompact
                ? "gap-2 px-3 py-3"
                : "gap-2 px-3.5 py-3.5",
          )}
        >
          <div
            className={cn(
              "min-w-0",
              collapsed
                ? "inline-flex items-center justify-center"
                : "inline-flex flex-1 items-center gap-2",
            )}
          >
            {collapsed ? (
              <img
                src="/asli-logo-icon.svg"
                alt="ASLI OS"
                className={cn("object-contain", isCompact ? "size-7" : "size-8")}
              />
            ) : (
              <>
                <img
                  src="/asli-logo-icon.svg"
                  alt=""
                  className={cn(
                    "shrink-0 object-contain",
                    isCompact ? "size-8" : "size-9",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold tracking-tight text-foreground">
                    {OPERATIONS_BRAND.name}
                  </p>
                  <span
                    className={cn(
                      "block truncate font-medium leading-tight text-muted",
                      isCompact ? "text-[10px]" : "text-[11px]",
                    )}
                  >
                    {OPERATIONS_BRAND.tagline}
                  </span>
                </div>
              </>
            )}
          </div>

          {!collapsed ? (
            <button
              type="button"
              onClick={onCollapseToggle}
              className={cn(
                "hidden shrink-0 items-center justify-center rounded-md text-muted transition-colors",
                "hover:bg-hero-bg hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "lg:inline-flex",
                isCompact ? "size-7" : "size-8",
              )}
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft
                className={cn(isCompact ? "size-3.5" : "size-4")}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onMobileClose}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md text-muted transition-colors",
              "hover:bg-hero-bg hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "lg:hidden",
              isCompact ? "size-8" : "size-9",
            )}
            aria-label="Close navigation menu"
          >
            <X
              className={cn(isCompact ? "size-4" : "size-5")}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hidden",
            isCompact ? "px-2 py-2.5" : "px-2.5 py-3",
            collapsed && (isCompact ? "px-1.5" : "px-2"),
          )}
          aria-label="Primary"
        >
          {visibleNavSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className={cn(
                sectionIndex > 0 && "mt-3 border-t border-border-subtle/80 pt-3",
                isCompact ? "mb-1" : "mb-1.5",
              )}
            >
              {!collapsed && section.label ? (
                <p
                  className={cn(
                    "mb-1.5 px-2.5 font-semibold uppercase tracking-[0.08em] text-muted/80",
                    isCompact ? "text-[9px]" : "text-[10px]",
                  )}
                >
                  {section.label}
                </p>
              ) : sectionIndex > 0 && collapsed ? (
                <div
                  className="mx-auto mb-1.5 h-px w-5 bg-border-subtle"
                  aria-hidden="true"
                />
              ) : null}

              <ul
                className={cn("flex flex-col", isCompact ? "gap-0.5" : "gap-1")}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(
                    item.id,
                    item.href,
                    location.pathname,
                    location.search,
                  );
                  const badgeCount =
                    item.id === "my-work"
                      ? myWorkBadgeCount
                      : resolveNavBadgeCount(
                          item.badgeKey,
                          badges,
                          item.badge,
                        );
                  const badgeAriaLabel =
                    badgeCount != null
                      ? item.id === "my-work"
                        ? `${badgeCount} item${badgeCount === 1 ? "" : "s"} in My Queue`
                        : (item.badgeAriaLabel?.(badgeCount) ??
                          `${badgeCount} new items`)
                      : undefined;

                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.href}
                        end={
                          getHrefPath(item.href) === OPERATIONS_ROUTES.HOME ||
                          getHrefPath(item.href) === OPERATIONS_ROUTES.DASHBOARD
                        }
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center rounded-md font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          isCompact ? "text-[12px]" : "text-sm",
                          collapsed
                            ? isCompact
                              ? "justify-center px-1.5 py-1.5"
                              : "justify-center px-2 py-2"
                            : isCompact
                              ? "gap-2 px-2 py-1.5"
                              : "gap-2.5 px-2.5 py-2",
                          active
                            ? "bg-primary-light text-primary"
                            : "text-nav hover:bg-hero-bg/80 hover:text-foreground",
                        )}
                      >
                        {active && !collapsed ? (
                          <span
                            className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        ) : null}

                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
                            isCompact ? "size-6" : "size-7",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted group-hover:text-foreground",
                          )}
                        >
                          <Icon
                            className={cn(isCompact ? "size-3.5" : "size-4")}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>

                        {!collapsed ? (
                          <>
                            <span className="min-w-0 flex-1 truncate leading-tight">
                              {item.label}
                            </span>
                            {badgeCount !== undefined ? (
                              <span
                                aria-label={badgeAriaLabel}
                                className={cn(
                                  "inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none tabular-nums",
                                  isCompact
                                    ? "h-4 min-w-4 px-1 text-[9px]"
                                    : "h-5 min-w-5 px-1 text-[10px]",
                                  active
                                    ? "bg-primary/15 text-primary"
                                    : "bg-primary text-surface",
                                )}
                              >
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            ) : null}
                          </>
                        ) : null}

                        {collapsed && badgeCount !== undefined ? (
                          <span
                            className="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
                            aria-label={badgeAriaLabel}
                          />
                        ) : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto shrink-0 border-t border-border-subtle",
            collapsed
              ? isCompact
                ? "p-1.5"
                : "p-2"
              : isCompact
                ? "p-2"
                : "p-2.5",
          )}
        >
          {collapsed ? (
            <button
              type="button"
              onClick={onCollapseToggle}
              className={cn(
                "mx-auto hidden items-center justify-center rounded-md text-muted transition-colors",
                "hover:bg-hero-bg hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                "lg:inline-flex",
                isCompact ? "size-7" : "size-8",
              )}
              aria-label="Expand sidebar"
            >
              <ChevronsLeft
                className={cn(
                  "rotate-180",
                  isCompact ? "size-3.5" : "size-4",
                )}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          ) : (
            <div className="rounded-xl border border-border-subtle bg-hero-bg/70 p-2.5">
              <div className="flex items-center gap-2.5">
                <svg
                  viewBox={indiaStatesMap.viewBox}
                  className="h-11 w-auto max-w-[2.75rem] shrink-0 text-[#B7C2D1]"
                  role="img"
                  aria-label="Map of India"
                >
                  {indiaStatesMap.features.map((feature) => (
                    <path
                      key={feature.id}
                      d={feature.d}
                      fill="currentColor"
                    />
                  ))}
                </svg>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-foreground">
                    India
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted">
                    Building opportunities
                    <br />
                    across Bharat.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
