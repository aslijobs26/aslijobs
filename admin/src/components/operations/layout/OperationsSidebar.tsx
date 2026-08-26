import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronsLeft, LogOut, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  MOCK_OPERATIONS_USER,
  OPERATIONS_BRAND,
  OPERATIONS_NAV_ITEM_PERMISSION_MODULE,
  OPERATIONS_NAV_SECTIONS,
  type OperationsNavSection,
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
import { logoutOperationsTeam } from "../../../services/operations-auth.service";
import { getOperationsAuthUser } from "../../../utils/operations-auth-storage";
import { cn } from "../../../utils/cn";
import { clearOperationsClientSession } from "../../../utils/operations-session";

/** Primary ops nav stays open; secondary groups expand on click. */
const COLLAPSIBLE_SECTION_IDS = new Set([
  "management",
  "finance",
  "compliance",
]);

interface OperationsSidebarProps {
  collapsed: boolean;
  onCollapseToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  density?: OperationsLayoutDensity;
}

function isNavItemActive(pathname: string, href: string) {
  if (href === OPERATIONS_ROUTES.DASHBOARD) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function sectionContainsActiveRoute(
  section: OperationsNavSection,
  pathname: string,
): boolean {
  return section.items.some((item) => isNavItemActive(pathname, item.href));
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function OperationsSidebar({
  collapsed,
  onCollapseToggle,
  mobileOpen,
  onMobileClose,
  density = "compact",
}: OperationsSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isCompact = density === "compact";
  const sidebarWidth = isCompact
    ? OPERATIONS_SIDEBAR_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_WIDTH;
  const sidebarCollapsedWidth = isCompact
    ? OPERATIONS_SIDEBAR_COLLAPSED_WIDTH_COMPACT
    : OPERATIONS_SIDEBAR_COLLAPSED_WIDTH;
  const sessionUser = getOperationsAuthUser();
  const { can, isLoading: permissionsLoading } = useOperationsPermissions();
  const displayName = sessionUser?.fullName ?? MOCK_OPERATIONS_USER.name;
  const displayRole = sessionUser?.role ?? MOCK_OPERATIONS_USER.role;
  const displayInitials = sessionUser
    ? getInitials(sessionUser.fullName)
    : MOCK_OPERATIONS_USER.initials;

  const visibleNavSections = useMemo(() => {
    return OPERATIONS_NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const moduleKey = OPERATIONS_NAV_ITEM_PERMISSION_MODULE[item.id];
        if (!moduleKey) {
          return true;
        }
        // Avoid flashing unauthorized links while permissions resolve.
        if (permissionsLoading) {
          return false;
        }
        return can(moduleKey, "read");
      }),
    })).filter((section) => section.items.length > 0);
  }, [can, permissionsLoading]);

  const activeCollapsibleSectionIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of OPERATIONS_NAV_SECTIONS) {
      if (
        COLLAPSIBLE_SECTION_IDS.has(section.id) &&
        sectionContainsActiveRoute(section, location.pathname)
      ) {
        ids.add(section.id);
      }
    }
    return ids;
  }, [location.pathname]);

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (activeCollapsibleSectionIds.size === 0) {
      return;
    }

    setExpandedSections((current) => {
      let changed = false;
      const next = { ...current };
      for (const sectionId of activeCollapsibleSectionIds) {
        if (!next[sectionId]) {
          next[sectionId] = true;
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [activeCollapsibleSectionIds]);

  const isSectionExpanded = (section: OperationsNavSection): boolean => {
    if (!COLLAPSIBLE_SECTION_IDS.has(section.id)) {
      return true;
    }
    if (expandedSections[section.id] !== undefined) {
      return expandedSections[section.id];
    }
    return activeCollapsibleSectionIds.has(section.id);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !(current[sectionId] ?? activeCollapsibleSectionIds.has(sectionId)),
    }));
  };

  const logoutMutation = useMutation({
    mutationFn: logoutOperationsTeam,
    onSettled: () => {
      clearOperationsClientSession(queryClient);
      setIsLoggingOut(false);
      navigate(OPERATIONS_ROUTES.LOGIN, { replace: true });
    },
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    logoutMutation.mutate();
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
        aria-label="Operations navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-sidebar transition-[width,transform] duration-200 ease-out",
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
        {/* Brand */}
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-border-subtle",
            collapsed
              ? isCompact
                ? "justify-center px-1.5 py-2.5"
                : "justify-center px-2 py-3.5"
              : isCompact
                ? "gap-2 px-3 py-2.5"
                : "gap-2 px-3.5 py-3.5",
          )}
        >
          <div
            className={cn(
              "min-w-0",
              collapsed
                ? "inline-flex items-center justify-center"
                : "inline-flex flex-1 flex-col items-start gap-0.5",
            )}
          >
            {collapsed ? (
              <img
                src="/asli-logo-icon.svg"
                alt="AsliJobs"
                className={cn("object-contain", isCompact ? "size-7" : "size-8")}
              />
            ) : (
              <>
                <img
                  src="/AsliLogo.svg"
                  alt="AsliJobs"
                  className={cn(
                    "block w-auto max-w-full object-contain object-left",
                    isCompact ? "h-[1.625rem]" : "h-8",
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap font-medium leading-tight text-primary-soft",
                    isCompact ? "text-[9px]" : "text-[10px]",
                  )}
                >
                  {OPERATIONS_BRAND.tagline}
                </span>
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

        {/* Navigation */}
        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hidden",
            isCompact ? "px-2 py-2.5" : "px-2.5 py-3",
            collapsed && (isCompact ? "px-1.5" : "px-2"),
          )}
          aria-label="Primary"
        >
          {visibleNavSections.map((section, sectionIndex) => {
            const isCollapsible = COLLAPSIBLE_SECTION_IDS.has(section.id);
            const sectionExpanded = isSectionExpanded(section);
            const sectionPanelId = `ops-nav-section-${section.id}`;

            return (
              <div
                key={section.id}
                className={cn(
                  sectionIndex > 0 && "mt-3 border-t border-border-subtle/80 pt-3",
                  isCompact ? "mb-1" : "mb-1.5",
                )}
              >
                {!collapsed ? (
                  isCollapsible ? (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={sectionExpanded}
                      aria-controls={sectionPanelId}
                      className={cn(
                        "mb-1.5 flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1 font-semibold uppercase tracking-[0.08em] text-muted/80 transition-colors",
                        "hover:bg-hero-bg hover:text-muted",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        isCompact ? "text-[9px]" : "text-[10px]",
                      )}
                    >
                      <span>{section.label}</span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 shrink-0 transition-transform duration-200",
                          sectionExpanded ? "rotate-0" : "-rotate-90",
                        )}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <p
                      className={cn(
                        "mb-1.5 px-2.5 font-semibold uppercase tracking-[0.08em] text-muted/80",
                        isCompact ? "text-[9px]" : "text-[10px]",
                      )}
                    >
                      {section.label}
                    </p>
                  )
                ) : sectionIndex > 0 ? (
                  <div
                    className="mx-auto mb-1.5 h-px w-5 bg-border-subtle"
                    aria-hidden="true"
                  />
                ) : null}

                {collapsed || sectionExpanded ? (
                  <ul
                    id={sectionPanelId}
                    className={cn("flex flex-col", isCompact ? "gap-0.5" : "gap-1")}
                  >
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isNavItemActive(
                        location.pathname,
                        item.href,
                      );

                      return (
                        <li key={item.id}>
                          <NavLink
                            to={item.href}
                            end={item.href === OPERATIONS_ROUTES.DASHBOARD}
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
                                ? "bg-primary-light text-primary-soft"
                                : "text-nav hover:bg-hero-bg/80 hover:text-foreground",
                            )}
                          >
                            {active && !collapsed ? (
                              <span
                                className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary-soft"
                                aria-hidden="true"
                              />
                            ) : null}

                            <span
                              className={cn(
                                "inline-flex shrink-0 items-center justify-center rounded-md transition-colors",
                                isCompact ? "size-6" : "size-7",
                                active
                                  ? "bg-primary-soft/15 text-primary-soft"
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
                                {item.badge !== undefined ? (
                                  <span
                                    className={cn(
                                      "inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none tabular-nums",
                                      isCompact
                                        ? "h-4 min-w-4 px-1 text-[9px]"
                                        : "h-5 min-w-5 px-1 text-[10px]",
                                      active
                                        ? "bg-primary-soft/15 text-primary-soft"
                                        : "bg-primary-soft text-surface",
                                    )}
                                  >
                                    {item.badge > 99 ? "99+" : item.badge}
                                  </span>
                                ) : null}
                              </>
                            ) : null}

                            {collapsed && item.badge !== undefined ? (
                              <span
                                className="absolute right-1 top-1 size-1.5 rounded-full bg-primary-soft"
                                aria-hidden="true"
                              />
                            ) : null}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
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
          <div
            className={cn(
              "rounded-xl border border-border-subtle/80 bg-hero-bg/70",
              collapsed
                ? isCompact
                  ? "flex flex-col items-center gap-1 p-1.5"
                  : "flex flex-col items-center gap-1.5 p-2"
                : isCompact
                  ? "p-2"
                  : "p-2.5",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-2",
              )}
            >
              <span
                className={cn(
                  "relative inline-flex shrink-0 items-center justify-center rounded-full bg-primary-light font-semibold text-primary-soft ring-2 ring-sidebar",
                  isCompact ? "size-7 text-[10px]" : "size-8 text-xs",
                )}
              >
                {displayInitials}
                <span
                  className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-surface bg-success"
                  aria-hidden="true"
                  title={MOCK_OPERATIONS_USER.status}
                />
              </span>

              {!collapsed ? (
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate font-semibold text-foreground",
                      isCompact ? "text-xs" : "text-sm",
                    )}
                  >
                    {displayName}
                  </p>
                  <p
                    className={cn(
                      "truncate text-muted",
                      isCompact ? "text-[10px]" : "text-[11px]",
                    )}
                  >
                    {displayRole}
                  </p>
                </div>
              ) : null}

              {!collapsed ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-md text-muted transition-colors",
                    "hover:bg-surface hover:text-danger",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isCompact ? "size-7" : "size-8",
                  )}
                  aria-label={isLoggingOut ? "Signing out" : "Log out"}
                >
                  <LogOut
                    className={cn(isCompact ? "size-3.5" : "size-4")}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </div>

            {collapsed ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-muted transition-colors",
                    "hover:bg-surface hover:text-danger",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isCompact ? "size-7" : "size-8",
                  )}
                  aria-label={isLoggingOut ? "Signing out" : "Log out"}
                >
                  <LogOut
                    className={cn(isCompact ? "size-3.5" : "size-4")}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={onCollapseToggle}
                  className={cn(
                    "hidden items-center justify-center rounded-md text-muted transition-colors",
                    "hover:bg-surface hover:text-foreground",
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
              </>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
