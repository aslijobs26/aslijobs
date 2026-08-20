import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronsLeft, LogOut } from "lucide-react";
import { useState } from "react";
import {
  MOCK_OPERATIONS_USER,
  OPERATIONS_BRAND,
  OPERATIONS_NAV_SECTIONS,
} from "../../../constants/operations-navigation";
import {
  OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
  OPERATIONS_SIDEBAR_WIDTH,
} from "../../../constants/operations-layout";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { logoutOperationsTeam } from "../../../services/operations-auth.service";
import { getOperationsAuthUser } from "../../../utils/operations-auth-storage";
import { cn } from "../../../utils/cn";
import { clearOperationsClientSession } from "../../../utils/operations-session";
import type { CSSProperties } from "react";

interface OperationsSidebarProps {
  collapsed: boolean;
  onCollapseToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function isNavItemActive(pathname: string, href: string) {
  if (href === OPERATIONS_ROUTES.DASHBOARD) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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
}: OperationsSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const sessionUser = getOperationsAuthUser();
  const displayName = sessionUser?.fullName ?? MOCK_OPERATIONS_USER.name;
  const displayRole = sessionUser?.role ?? MOCK_OPERATIONS_USER.role;
  const displayInitials = sessionUser
    ? getInitials(sessionUser.fullName)
    : MOCK_OPERATIONS_USER.initials;

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
          "fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-border-subtle bg-surface transition-[width,transform] duration-200 ease-out",
          collapsed
            ? "lg:w-[var(--operations-sidebar-collapsed-width)]"
            : "lg:w-[var(--operations-sidebar-width)]",
          "w-[var(--operations-sidebar-width)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        style={
          {
            "--operations-sidebar-width": OPERATIONS_SIDEBAR_WIDTH,
            "--operations-sidebar-collapsed-width":
              OPERATIONS_SIDEBAR_COLLAPSED_WIDTH,
          } as CSSProperties
        }
      >
        <div
          className={cn(
            "flex shrink-0 flex-col border-b border-border-subtle",
            collapsed ? "items-center px-2 py-4" : "px-4 py-4",
          )}
        >
          <div
            className={cn(
              collapsed
                ? "inline-flex items-center justify-center"
                : "inline-flex flex-col items-start gap-0.5",
            )}
          >
            {collapsed ? (
              <img
                src="/asli-logo-icon.svg"
                alt="AsliJobs"
                className="size-9 object-contain"
              />
            ) : (
              <>
                <img
                  src="/AsliLogo.svg"
                  alt="AsliJobs"
                  className="block h-9 w-auto max-w-full object-contain object-left"
                />
                <span className="whitespace-nowrap text-[10px] font-medium leading-tight text-primary-soft">
                  {OPERATIONS_BRAND.tagline}
                </span>
              </>
            )}
          </div>
        </div>

        <nav
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 scrollbar-hidden",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {OPERATIONS_NAV_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4 last:mb-0">
              {!collapsed && (
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {section.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(location.pathname, item.href);

                  return (
                    <li key={item.id}>
                      <NavLink
                        to={item.href}
                        end={item.href === OPERATIONS_ROUTES.DASHBOARD}
                        onClick={onMobileClose}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                          active
                            ? "bg-primary-soft text-surface"
                            : "text-nav hover:bg-primary-light hover:text-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-[1.125rem] shrink-0",
                            active
                              ? "text-surface"
                              : "text-muted group-hover:text-foreground",
                          )}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span
                                className={cn(
                                  "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none tabular-nums",
                                  active
                                    ? "bg-surface text-primary-soft"
                                    : "bg-primary-soft text-surface",
                                )}
                              >
                                {item.badge > 99 ? "99+" : item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && item.badge !== undefined ? (
                          <span
                            className="absolute right-1 top-1 size-2 rounded-full bg-primary-soft"
                            aria-hidden="true"
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
            collapsed ? "p-2" : "p-3",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl bg-hero-bg",
              collapsed ? "justify-center p-2" : "p-3",
            )}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-semibold text-primary">
              {displayInitials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted">{displayRole}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-success">
                  <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                  {MOCK_OPERATIONS_USER.status}
                </p>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                collapsed ? "px-2" : "px-3",
              )}
              aria-label="Log out"
            >
              <LogOut className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {!collapsed ? (isLoggingOut ? "Signing out..." : "Log out") : null}
            </button>

            <button
              type="button"
              onClick={onCollapseToggle}
              className="hidden w-full items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-primary-light hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronsLeft
                className={cn("size-4 transition-transform", collapsed && "rotate-180")}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
