import { Link, useLocation } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import type { OperationsPermissionModule } from "../../../constants/operations-permissions";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import { cn } from "../../../utils/cn";

const TABS: Array<{
  id: string;
  label: string;
  href: string;
  module: OperationsPermissionModule;
}> = [
  { id: "structure", label: "Structure", href: OPERATIONS_ROUTES.ORGANIZATION, module: "team" },
  { id: "people", label: "People", href: OPERATIONS_ROUTES.TEAM_MANAGEMENT, module: "team" },
  { id: "teams", label: "Teams", href: OPERATIONS_ROUTES.TEAMS, module: "team" },
  {
    id: "roles",
    label: "Roles & Permissions",
    href: OPERATIONS_ROUTES.ROLES,
    module: "roles",
  },
  {
    id: "departments",
    label: "Departments",
    href: OPERATIONS_ROUTES.DEPARTMENTS,
    module: "departments",
  },
  { id: "settings", label: "Settings", href: OPERATIONS_ROUTES.SETTINGS, module: "settings" },
];

function isTabActive(href: string, pathname: string, tabId: string): boolean {
  if (tabId === "structure") {
    return (
      pathname === OPERATIONS_ROUTES.ORGANIZATION ||
      pathname.startsWith(`${OPERATIONS_ROUTES.ORGANIZATION}/`)
    );
  }
  if (tabId === "people") {
    return (
      pathname === OPERATIONS_ROUTES.TEAM_MANAGEMENT ||
      pathname.startsWith(`${OPERATIONS_ROUTES.TEAM_MANAGEMENT}/`) ||
      pathname === OPERATIONS_ROUTES.PEOPLE ||
      pathname.startsWith(`${OPERATIONS_ROUTES.PEOPLE}/`)
    );
  }
  if (tabId === "teams") {
    return (
      pathname === OPERATIONS_ROUTES.TEAMS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.TEAMS}/`)
    );
  }
  if (tabId === "roles") {
    return (
      pathname === OPERATIONS_ROUTES.ROLES ||
      pathname.startsWith(`${OPERATIONS_ROUTES.ROLES}/`)
    );
  }
  if (tabId === "departments") {
    return (
      pathname === OPERATIONS_ROUTES.DEPARTMENTS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.DEPARTMENTS}/`)
    );
  }
  if (tabId === "settings") {
    return (
      pathname === OPERATIONS_ROUTES.SETTINGS ||
      pathname.startsWith(`${OPERATIONS_ROUTES.SETTINGS}/`)
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OrganizationTabs() {
  const { pathname } = useLocation();
  const { can } = useOperationsPermissions();
  const visibleTabs = TABS.filter((tab) => can(tab.module, "read"));
  const activeId =
    visibleTabs.find((tab) => isTabActive(tab.href, pathname, tab.id))?.id ??
    visibleTabs[0]?.id ??
    "structure";

  if (visibleTabs.length === 0) {
    return null;
  }

  return (
    <div
      role="tablist"
      aria-label="Organization sections"
      className="flex gap-1 overflow-x-auto border-b border-border-subtle scrollbar-hidden"
    >
      {visibleTabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            role="tab"
            aria-selected={selected}
            id={`org-tab-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selected
                ? "border-primary font-semibold text-foreground"
                : "border-transparent font-medium text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
