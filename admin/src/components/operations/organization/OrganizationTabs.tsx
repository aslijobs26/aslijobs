import { Link, useLocation } from "react-router-dom";
import { OPERATIONS_ROUTES } from "../../../constants/operations-routes";
import { useOperationsPermissions } from "../../../hooks/use-operations-permissions";
import { cn } from "../../../utils/cn";

const TABS: Array<{
  id: string;
  label: string;
  href: string;
  /** Fine entry keys — field-only grants must not unlock tabs. */
  entryKeys: readonly string[];
  /** Coarse fallback for legacy roles without fine grants. */
  coarseModule: "team" | "roles" | "departments" | "settings";
}> = [
  {
    id: "structure",
    label: "Structure",
    href: OPERATIONS_ROUTES.ORGANIZATION,
    entryKeys: ["team.organization.view"],
    coarseModule: "team",
  },
  {
    id: "people",
    label: "People",
    href: OPERATIONS_ROUTES.TEAM_MANAGEMENT,
    entryKeys: ["team.members.view"],
    coarseModule: "team",
  },
  {
    id: "teams",
    label: "Teams",
    href: OPERATIONS_ROUTES.TEAMS,
    entryKeys: ["team.teams.view"],
    coarseModule: "team",
  },
  {
    id: "roles",
    label: "Roles & Permissions",
    href: OPERATIONS_ROUTES.ROLES,
    entryKeys: ["roles.view"],
    coarseModule: "roles",
  },
  {
    id: "departments",
    label: "Departments",
    href: OPERATIONS_ROUTES.DEPARTMENTS,
    entryKeys: ["departments.view"],
    coarseModule: "departments",
  },
  {
    id: "settings",
    label: "Settings",
    href: OPERATIONS_ROUTES.SETTINGS,
    entryKeys: ["settings.view"],
    coarseModule: "settings",
  },
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

function hasFineGrantsForModule(
  grantedKeys: readonly string[],
  module: string,
): boolean {
  const prefix = `${module}.`;
  return grantedKeys.some((key) => key === module || key.startsWith(prefix));
}

export function OrganizationTabs() {
  const { pathname } = useLocation();
  const { can, canKey, grantedKeys, isSuperAdmin } = useOperationsPermissions();

  const visibleTabs = TABS.filter((tab) => {
    if (isSuperAdmin) return true;
    if (tab.entryKeys.some((key) => canKey(key))) return true;
    // Legacy coarse roles without fine grants for this module.
    if (!hasFineGrantsForModule(grantedKeys, tab.coarseModule)) {
      return can(tab.coarseModule, "read");
    }
    return false;
  });

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
